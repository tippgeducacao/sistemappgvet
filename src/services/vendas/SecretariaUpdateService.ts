
import { supabase } from '@/integrations/supabase/client';

export class SecretariaUpdateService {
  static async updateVendaStatus(
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<boolean> {
    console.log('🎯 SecretariaUpdateService: Iniciando atualização de venda:', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      pontuacaoValidada,
      motivoPendencia 
    });

    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      console.log('👤 Usuário autenticado:', user.id);

      // Chamar a função SQL que foi corrigida
      const { data, error } = await supabase.rpc('update_venda_status', {
        venda_id: vendaId,
        new_status: status,
        pontuacao_validada_param: pontuacaoValidada || null,
        motivo_pendencia_param: motivoPendencia || null
      });

      if (error) {
        console.error('❌ Erro ao chamar função update_venda_status:', error);
        return false;
      }

      console.log('✅ Resultado da função update_venda_status:', data);
      
      // Verificar se a atualização foi bem-sucedida
      if (data === true) {
        console.log('✅ Venda atualizada com sucesso!');
        return true;
      } else {
        console.warn('⚠️ Função retornou false - nenhuma linha foi atualizada');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro inesperado no SecretariaUpdateService:', error);
      return false;
    }
  }
}
