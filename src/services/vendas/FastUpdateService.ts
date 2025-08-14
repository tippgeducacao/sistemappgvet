import { supabase } from '@/integrations/supabase/client';

export class FastUpdateService {
  static async updateVendaStatus(
    vendaId: string,
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('⚡ FastUpdateService: Iniciando atualização otimizada', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();

    try {
      // Usar RPC otimizada para todas as atualizações
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