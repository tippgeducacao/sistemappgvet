import { supabase } from '@/integrations/supabase/client';

export interface LinkingResult {
  agendamento_id: string;
  form_entry_id?: string;
  vendedor_nome: string;
  lead_email: string;
  success: boolean;
  message: string;
}

export class AgendamentoLinkingService {
  /**
   * Executa a função do banco para vincular automaticamente agendamentos às vendas
   */
  static async vincularAgendamentosVendas(): Promise<LinkingResult[]> {
    console.log('🔗 Executando vinculação automática de agendamentos às vendas');

    const { data, error } = await supabase.rpc('vincular_agendamentos_vendas');

    if (error) {
      console.error('❌ Erro ao executar vinculação automática:', error);
      throw error;
    }

    console.log(`✅ Vinculação concluída. ${data?.length || 0} registros processados`);
    return data || [];
  }

  /**
   * Busca agendamentos "comprou" que não têm venda vinculada
   */
  static async buscarAgendamentosSemVinculo(): Promise<any[]> {
    console.log('🔍 Buscando agendamentos "comprou" sem vinculação');

    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        resultado_reuniao,
        form_entry_id,
        vendedor_id,
        sdr_id,
        lead:leads!agendamentos_lead_id_fkey (
          nome,
          email,
          whatsapp
        ),
        vendedor:profiles!agendamentos_vendedor_id_fkey (
          name,
          email
        ),
        sdr:profiles!agendamentos_sdr_id_fkey (
          name,
          email
        )
      `)
      .eq('resultado_reuniao', 'comprou')
      .is('form_entry_id', null)
      .order('data_agendamento', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar agendamentos sem vinculação:', error);
      throw error;
    }

    console.log(`📊 Encontrados ${data?.length || 0} agendamentos sem vinculação`);
    return data || [];
  }

  /**
   * Busca vendas que podem ser vinculadas a um agendamento específico
   * Utiliza função SQL com SECURITY DEFINER para contornar RLS
   */
  static async buscarVendasCandidatas(agendamentoId: string): Promise<any[]> {
    console.log('🔍 Buscando vendas candidatas para agendamento:', agendamentoId);

    const { data, error } = await supabase
      .rpc('buscar_vendas_candidatas_para_agendamento', {
        p_agendamento_id: agendamentoId
      });

    if (error) {
      console.error('❌ Erro ao buscar vendas candidatas:', error);
      throw error;
    }

    const candidatas = (data || []).map((venda: any) => ({
      id: venda.form_entry_id,
      created_at: venda.created_at,
      status: venda.status,
      pontuacao_validada: venda.pontuacao_validada,
      data_aprovacao: venda.data_aprovacao,
      alunos: {
        nome: venda.aluno_nome,
        email: venda.aluno_email,
        telefone: venda.aluno_telefone
      },
      cursos: {
        nome: venda.curso_nome
      }
    }));

    console.log(`🎯 ${candidatas.length} vendas candidatas encontradas`);
    return candidatas;
  }

  /**
   * Vincula manualmente um agendamento a uma venda específica usando RPC para garantir permissões
   */
  static async vincularManualmente(agendamentoId: string, formEntryId: string): Promise<void> {
    console.log('🔗 Vinculando manualmente agendamento à venda:', { agendamentoId, formEntryId });

    const { data, error } = await supabase
      .rpc('vincular_agendamento_especifico', {
        p_agendamento_id: agendamentoId,
        p_form_entry_id: formEntryId
      });

    if (error) {
      console.error('❌ Erro ao vincular manualmente:', error);
      throw new Error(`Erro ao vincular agendamento: ${error.message}`);
    }

    if (!data) {
      throw new Error('Sem permissão para vincular agendamento ou IDs inválidos');
    }

    console.log('✅ Vinculação manual realizada com sucesso');
  }

  /**
   * Atualiza o SDR ID de uma venda baseado no agendamento vinculado
   */
  static async atualizarSDRVenda(formEntryId: string, sdrId: string): Promise<void> {
    console.log('🔄 Atualizando SDR da venda:', { formEntryId, sdrId });

    const { error } = await supabase
      .from('form_entries')
      .update({ 
        sdr_id: sdrId,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', formEntryId);

    if (error) {
      console.error('❌ Erro ao atualizar SDR da venda:', error);
      throw error;
    }

    console.log('✅ SDR da venda atualizado com sucesso');
  }
}