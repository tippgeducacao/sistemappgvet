import { supabase } from '@/integrations/supabase/client';

export class FastUpdateService {
  static async updateVendaStatus(
    vendaId: string,
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string,
    dataAssinaturaContrato?: string
  ): Promise<boolean> {
    console.log('⚡ FastUpdateService: Iniciando atualização otimizada', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();

    try {
      // Se tiver data de assinatura, usar o AdminVendaUpdateService que é mais completo
      if (dataAssinaturaContrato && status === 'matriculado') {
        console.log('📅 FastUpdateService: Usando AdminVendaUpdateService devido à data de assinatura');
        const { AdminVendaUpdateService } = await import('./AdminVendaUpdateService');
        
        // Preparar dados para atualização
        const updateData: any = {
          status,
          atualizado_em: new Date().toISOString()
        };

        if (status === 'matriculado') {
          updateData.data_aprovacao = new Date().toISOString();
          updateData.data_assinatura_contrato = dataAssinaturaContrato;
        } else if (status === 'pendente' || status === 'desistiu') {
          // Limpar data de assinatura quando voltar para pendente ou rejeitar
          updateData.data_assinatura_contrato = null;
          updateData.data_aprovacao = null;
        }

        if (pontuacaoValidada !== undefined) {
          updateData.pontuacao_validada = pontuacaoValidada;
        }

        if (motivoPendencia) {
          updateData.motivo_pendencia = motivoPendencia;
        }

        const { error } = await supabase
          .from('form_entries')
          .update(updateData)
          .eq('id', vendaId);

        if (error) {
          console.error('❌ FastUpdateService: Erro na atualização com data:', error);
          return false;
        }

        return true;
      }
      
      // Usar atualização direta para casos onde precisamos limpar data de assinatura
      if (status === 'pendente' || status === 'desistiu') {
        console.log('🗑️ FastUpdateService: Limpando data de assinatura para status:', status);
        
        const updateData = {
          status,
          data_assinatura_contrato: null,
          data_aprovacao: null,
          pontuacao_validada: pontuacaoValidada || null,
          motivo_pendencia: motivoPendencia || null,
          atualizado_em: new Date().toISOString()
        };
        
        console.log('📝 FastUpdateService: Dados da atualização:', updateData);
        
        const { error } = await supabase
          .from('form_entries')
          .update(updateData)
          .eq('id', vendaId);

        if (error) {
          console.error('❌ FastUpdateService: Erro ao limpar data:', error);
          return false;
        }

        // Verificar se a atualização foi aplicada
        const { data: vendaVerificada, error: verifyError } = await supabase
          .from('form_entries')
          .select('id, status, data_assinatura_contrato, data_aprovacao')
          .eq('id', vendaId)
          .single();
        
        if (verifyError) {
          console.error('❌ FastUpdateService: Erro na verificação:', verifyError);
          return false;
        }
        
        console.log('✅ FastUpdateService: Verificação após limpeza:', {
          status: vendaVerificada.status,
          dataAssinatura: vendaVerificada.data_assinatura_contrato,
          dataAprovacao: vendaVerificada.data_aprovacao
        });

        return true;
      }
      
      // Para outros casos, usar RPC
      const { data, error } = await supabase.rpc('update_venda_status_fast', {
        venda_id_param: vendaId,
        novo_status: status,
        pontuacao_param: pontuacaoValidada || null,
        motivo_param: motivoPendencia || null
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (error) {
        console.error('❌ FastUpdateService: Erro na função RPC', error);
        console.log(`⏱️ Tempo até erro: ${duration.toFixed(2)}ms`);
        return false;
      }

      if (!data) {
        console.warn('⚠️ FastUpdateService: Função retornou false (sem permissão ou venda não encontrada)');
        console.log(`⏱️ Tempo de execução: ${duration.toFixed(2)}ms`);
        return false;
      }

      console.log('✅ FastUpdateService: Atualização concluída com sucesso!', {
        vendaId: vendaId.substring(0, 8),
        novoStatus: status,
        duracao: `${duration.toFixed(2)}ms`
      });

      return true;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error('💥 FastUpdateService: Erro inesperado', {
        error,
        vendaId: vendaId.substring(0, 8),
        duracao: `${duration.toFixed(2)}ms`
      });
      return false;
    }
  }

  // Método para atualização em lote (se necessário)
  static async updateMultipleVendas(
    updates: Array<{
      vendaId: string;
      status: 'pendente' | 'matriculado' | 'desistiu';
      pontuacaoValidada?: number;
      motivoPendencia?: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    console.log('⚡ FastUpdateService: Iniciando atualização em lote', { 
      quantidade: updates.length 
    });

    const results = await Promise.all(
      updates.map(async (update) => {
        const success = await this.updateVendaStatus(
          update.vendaId,
          update.status,
          update.pontuacaoValidada,
          update.motivoPendencia
        );
        return { vendaId: update.vendaId, success };
      })
    );

    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('📊 FastUpdateService: Resultado do lote', { success, failed });
    
    return { success, failed };
  }
}