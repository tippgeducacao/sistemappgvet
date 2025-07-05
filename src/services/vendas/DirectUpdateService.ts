
import { supabase } from '@/integrations/supabase/client';

export class DirectUpdateService {
  static async updateVendaStatusDirect(
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🚀 DirectUpdateService: ATUALIZAÇÃO SIMPLES E DIRETA');
    console.log('📋 Parâmetros:', { vendaId: vendaId.substring(0, 8), status, pontuacaoValidada });
    
    try {
      // Preparar dados para atualização
      const updateData: any = {
        status,
        atualizado_em: new Date().toISOString()
      };

      if (pontuacaoValidada !== undefined && pontuacaoValidada !== null) {
        updateData.pontuacao_validada = pontuacaoValidada;
      }

      if (motivoPendencia) {
        updateData.motivo_pendencia = motivoPendencia;
      }

      console.log('📊 DADOS PARA UPDATE:', updateData);

      // Executar atualização simples
      console.log('🎯 EXECUTANDO UPDATE SIMPLES...');
      const { error: updateError } = await supabase
        .from('form_entries')
        .update(updateData)
        .eq('id', vendaId);

      if (updateError) {
        console.error('❌ ERRO NO UPDATE:', updateError);
        throw new Error(`Falha na atualização: ${updateError.message}`);
      }

      console.log('✅ UPDATE EXECUTADO COM SUCESSO!');
      return true;

    } catch (error) {
      console.error('💥💥💥 ERRO CRÍTICO no DirectUpdateService:', error);
      throw error;
    }
  }
}
