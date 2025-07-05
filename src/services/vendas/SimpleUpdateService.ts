
import { supabase } from '@/integrations/supabase/client';

export class SimpleUpdateService {
  static async updateVendaStatus(
    vendaId: string,
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ): Promise<void> {
    console.log('🔥 SimpleUpdateService: Atualizando venda', { vendaId: vendaId.substring(0, 8), status });
    
    const updateData: any = {
      status,
      atualizado_em: new Date().toISOString()
    };

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
      console.error('❌ Erro na atualização:', error);
      throw new Error(`Erro ao atualizar venda: ${error.message}`);
    }

    console.log('✅ Venda atualizada com sucesso!');
  }
}
