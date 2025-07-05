
import { supabase } from '@/integrations/supabase/client';

export class SecretariaUpdateService {
  static async updateVendaStatus(
    vendaId: string, 
    novoStatus: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🔄 SecretariaUpdateService: Iniciando atualização de status');
    console.log('📊 Parâmetros:', { vendaId, novoStatus, pontuacaoValidada, motivoPendencia });

    try {
      // Usar a função RPC update_venda_status
      const { data, error } = await supabase
        .rpc('update_venda_status', {
          venda_id_param: vendaId,
          novo_status: novoStatus,
          pontuacao_param: pontuacaoValidada || null,
          motivo_param: motivoPendencia || null
        });

      if (error) {
        console.error('❌ Erro na função RPC:', error);
        return false;
      }

      if (!data) {
        console.error('❌ Função RPC retornou false - sem permissão ou venda não encontrada');
        return false;
      }

      console.log('✅ Status atualizado com sucesso via RPC');
      return true;

    } catch (error) {
      console.error('❌ Erro inesperado na atualização:', error);
      return false;
    }
  }
}
