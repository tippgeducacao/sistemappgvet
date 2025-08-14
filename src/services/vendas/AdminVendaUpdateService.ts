
import { supabase } from '@/integrations/supabase/client';

export class AdminVendaUpdateService {
  static async updateVendaStatus(
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🔄 AdminVendaUpdateService: INICIANDO ATUALIZAÇÃO:', { 
      vendaId: vendaId.substring(0, 8), 
      status, 
      pontuacaoValidada, 
      motivoPendencia,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Preparar dados para atualização
      const updateData: any = {
        status,
        atualizado_em: new Date().toISOString()
      };

      // Se estiver aprovando (matriculando), definir data de aprovação e data de assinatura de contrato
      if (status === 'matriculado') {
        updateData.data_aprovacao = new Date().toISOString();
        updateData.data_assinatura_contrato = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (status === 'pendente' || status === 'desistiu') {
        // Limpar data de assinatura e aprovação quando voltar para pendente ou rejeitar
        updateData.data_assinatura_contrato = null;
        updateData.data_aprovacao = null;
      }

      if (pontuacaoValidada !== undefined && pontuacaoValidada !== null) {
        updateData.pontuacao_validada = pontuacaoValidada;
      }

      if (motivoPendencia) {
        updateData.motivo_pendencia = motivoPendencia;
      }

      console.log('📊 DADOS PARA UPDATE:', updateData);

      // Executar atualização
      console.log('🚀 EXECUTANDO UPDATE...');
      const { error: updateError } = await supabase
        .from('form_entries')
        .update(updateData)
        .eq('id', vendaId);

      if (updateError) {
        console.error('❌ ERRO NO UPDATE:', updateError);
        throw new Error(`Falha na atualização: ${updateError.message}`);
      }

      console.log('✅ UPDATE EXECUTADO COM SUCESSO!');

      // Verificação pós-update
      console.log('🔍 VERIFICANDO SE A ATUALIZAÇÃO FOI PERSISTIDA...');
      
      const { data: vendaVerificada, error: verifyError } = await supabase
        .from('form_entries')
        .select('id, status, pontuacao_validada, atualizado_em')
        .eq('id', vendaId)
        .single();

      if (verifyError) {
        console.error('❌ Erro na verificação:', verifyError);
        throw new Error(`Erro na verificação: ${verifyError.message}`);
      }

      console.log('✅ VENDA VERIFICADA:', {
        id: vendaVerificada.id.substring(0, 8),
        statusFinal: vendaVerificada.status,
        statusEsperado: status,
        statusIgual: vendaVerificada.status === status,
        pontuacaoValidada: vendaVerificada.pontuacao_validada,
        ultimaAtualizacao: vendaVerificada.atualizado_em
      });

      if (vendaVerificada.status !== status) {
        console.error('💥 FALHA: Status não foi atualizado corretamente!');
        console.error('Status esperado:', status);
        console.error('Status atual:', vendaVerificada.status);
        throw new Error(`Status não foi atualizado. Esperado: ${status}, Atual: ${vendaVerificada.status}`);
      }

      console.log('🏆 SUCESSO COMPLETO! Venda atualizada e verificada!');
      return true;

    } catch (error) {
      console.error('💥💥💥 ERRO CRÍTICO na atualização:', error);
      throw error;
    }
  }
}
