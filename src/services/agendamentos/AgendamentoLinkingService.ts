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
   */
  static async buscarVendasCandidatas(agendamentoId: string): Promise<any[]> {
    console.log('🔍 Buscando vendas candidatas para agendamento:', agendamentoId);

    // Primeiro buscar o agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .select(`
        vendedor_id,
        lead:leads!agendamentos_lead_id_fkey (
          nome,
          email,
          whatsapp
        )
      `)
      .eq('id', agendamentoId)
      .single();

    if (agendamentoError) {
      console.error('❌ Erro ao buscar agendamento:', agendamentoError);
      throw agendamentoError;
    }

    if (!agendamento || !agendamento.lead) {
      return [];
    }

    const leadEmail = agendamento.lead.email?.toLowerCase().trim();
    const leadNome = agendamento.lead.nome?.toLowerCase().trim();
    const leadPhone = (agendamento.lead.whatsapp || '').replace(/\D/g, '');
    const phoneTail = leadPhone.length >= 8 ? leadPhone.slice(-8) : undefined;

    // 1) Buscar vendas do mesmo vendedor (mais provável e respeita RLS do vendedor)
    const { data: vendasMesmoVendedor, error: vendasError } = await supabase
      .from('form_entries')
      .select(`
        id,
        created_at,
        status,
        pontuacao_esperada,
        pontuacao_validada,
        curso_id,
        alunos (
          nome,
          email,
          telefone
        ),
        cursos (
          nome
        )
      `)
      .eq('vendedor_id', agendamento.vendedor_id)
      .in('status', ['matriculado', 'pendente'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas do vendedor:', vendasError);
    }

    let candidatas: any[] = (vendasMesmoVendedor || []).filter((venda) => {
      if (!venda.alunos) return false;
      const alunoEmail = venda.alunos.email?.toLowerCase().trim();
      const alunoNome = venda.alunos.nome?.toLowerCase().trim();
      const alunoPhone = (venda.alunos.telefone || '').replace(/\D/g, '');

      if (leadEmail && alunoEmail && leadEmail === alunoEmail) return true;
      if (leadNome && alunoNome && leadNome === alunoNome) return true;
      if (phoneTail && alunoPhone && alunoPhone.endsWith(phoneTail)) return true;
      return false;
    });

    if (candidatas.length > 0) {
      console.log(`🎯 ${candidatas.length} vendas correspondem ao lead (mesmo vendedor)`);
      return candidatas;
    }

    // 2) Fallback: procurar por ALUNO (email/nome/telefone) sem restringir por vendedor
    //    A tabela alunos possui SELECT público para ranking, então conseguimos achar o form_entry_id
    let alunosQuery = supabase
      .from('alunos')
      .select('id, nome, email, telefone, form_entry_id, vendedor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(40);

    const orFilters: string[] = [];
    if (leadEmail) orFilters.push(`email.ilike.${leadEmail}`);
    if (leadNome) orFilters.push(`nome.ilike.${leadNome}`);
    if (phoneTail) orFilters.push(`telefone.ilike.%${phoneTail}`);

    if (orFilters.length > 0) {
      alunosQuery = alunosQuery.or(orFilters.join(','));
    }

    const { data: alunosEncontrados, error: alunosError } = await alunosQuery;
    if (alunosError) {
      console.error('❌ Erro ao buscar alunos por dados do lead:', alunosError);
    }

    const formEntryIds = (alunosEncontrados || [])
      .map((a: any) => a.form_entry_id)
      .filter((id: string | null | undefined): id is string => !!id);

    if (formEntryIds.length === 0) {
      console.log('⚠️ Nenhum aluno com form_entry_id correspondente encontrado.');
      return [];
    }

    // 3) Trazer as vendas pelos IDs coletados (sem filtrar por vendedor)
    const { data: vendasPorAluno, error: vendasPorAlunoError } = await supabase
      .from('form_entries')
      .select(`
        id,
        created_at,
        status,
        pontuacao_esperada,
        pontuacao_validada,
        curso_id,
        alunos (
          nome,
          email,
          telefone
        ),
        cursos (
          nome
        )
      `)
      .in('id', formEntryIds)
      .in('status', ['matriculado', 'pendente'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (vendasPorAlunoError) {
      console.error('❌ Erro ao buscar vendas pelos IDs de alunos:', vendasPorAlunoError);
      // Mesmo que falhe por RLS, retornamos vazio
      return [];
    }

    // Fazer novamente a checagem de correspondência (proteção)
    candidatas = (vendasPorAluno || []).filter((venda) => {
      if (!venda.alunos) return false;
      const alunoEmail = venda.alunos.email?.toLowerCase().trim();
      const alunoNome = venda.alunos.nome?.toLowerCase().trim();
      const alunoPhone = (venda.alunos.telefone || '').replace(/\D/g, '');

      if (leadEmail && alunoEmail && leadEmail === alunoEmail) return true;
      if (leadNome && alunoNome && leadNome === alunoNome) return true;
      if (phoneTail && alunoPhone && alunoPhone.endsWith(phoneTail)) return true;
      return false;
    });

    console.log(`🎯 ${candidatas.length} vendas correspondem ao lead (fallback por aluno)`);
    return candidatas;
  }

  /**
   * Vincula manualmente um agendamento a uma venda específica
   */
  static async vincularManualmente(agendamentoId: string, formEntryId: string): Promise<void> {
    console.log('🔗 Vinculando manualmente agendamento à venda:', { agendamentoId, formEntryId });

    const { error } = await supabase
      .from('agendamentos')
      .update({ 
        form_entry_id: formEntryId,
        updated_at: new Date().toISOString()
      })
      .eq('id', agendamentoId);

    if (error) {
      console.error('❌ Erro ao vincular manualmente:', error);
      throw error;
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