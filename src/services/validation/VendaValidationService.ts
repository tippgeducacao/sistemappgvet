
import { supabase } from '@/integrations/supabase/client';
import { ErrorService } from '@/services/error/ErrorService';

export class VendaValidationService {
  static async aprovarVenda(vendaId: string, pontuacaoValidada?: number): Promise<void> {
    try {
      console.log('🔄 Aprovando venda:', vendaId, 'com pontuação:', pontuacaoValidada);

      const updateData: any = {
        status: 'matriculado',
        atualizado_em: new Date().toISOString()
      };

      // Se foi informada uma pontuação validada, incluir no update
      if (pontuacaoValidada !== undefined && pontuacaoValidada !== null) {
        updateData.pontuacao_validada = pontuacaoValidada;
      }

      const { data, error } = await supabase
        .from('form_entries')
        .update(updateData)
        .eq('id', vendaId)
        .select();

      if (error) {
        console.error('❌ Erro ao aprovar venda:', error);
        throw error;
      }

      console.log('✅ Venda aprovada com sucesso:', data);
    } catch (error) {
      console.error('💥 Erro ao aprovar venda:', error);
      ErrorService.logError(error as Error, 'VendaValidationService.aprovarVenda');
      throw error;
    }
  }

  static async rejeitarVenda(vendaId: string, motivo?: string): Promise<void> {
    try {
      console.log('🔄 Rejeitando venda:', vendaId, 'motivo:', motivo);

      const updateData: any = {
        status: 'desistiu',
        atualizado_em: new Date().toISOString()
      };

      // Se foi informado um motivo, incluir no update
      if (motivo) {
        updateData.motivo_pendencia = motivo;
      }

      const { data, error } = await supabase
        .from('form_entries')
        .update(updateData)
        .eq('id', vendaId)
        .select();

      if (error) {
        console.error('❌ Erro ao rejeitar venda:', error);
        throw error;
      }

      console.log('✅ Venda rejeitada com sucesso:', data);
    } catch (error) {
      console.error('💥 Erro ao rejeitar venda:', error);
      ErrorService.logError(error as Error, 'VendaValidationService.rejeitarVenda');
      throw error;
    }
  }
}
