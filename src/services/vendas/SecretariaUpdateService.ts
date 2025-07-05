
import { supabase } from '@/integrations/supabase/client';

export class SecretariaUpdateService {
  static async updateVendaStatus(
    vendaId: string,
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🔄 SecretariaUpdateService: Atualizando status da venda', {
      vendaId: vendaId.substring(0, 8),
      status,
      pontuacaoValidada,
      motivoPendencia
    });

    try {
      // Preparar os campos a serem atualizados
      const updateFields: any = {
        status,
        atualizado_em: new Date().toISOString()
      };

      if (pontuacaoValidada !== undefined) {
        updateFields.pontuacao_validada = pontuacaoValidada;
      }

      if (motivoPendencia) {
        updateFields.motivo_pendencia = motivoPendencia;
      }

      // Atualizar diretamente na tabela form_entries
      const { data, error } = await supabase
        .from('form_entries')
        .update(updateFields)
        .eq('id', vendaId)
        .select('id, status, pontuacao_validada, motivo_pendencia');

      if (error) {
        console.error('❌ Erro na atualização direta:', error);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum registro foi atualizado');
        return false;
      }

      console.log('✅ Venda atualizada com sucesso:', data[0]);
      return true;

    } catch (error) {
      console.error('❌ Erro inesperado na atualização:', error);
      return false;
    }
  }
}
