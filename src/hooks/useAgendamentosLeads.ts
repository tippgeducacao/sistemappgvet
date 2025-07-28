import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentoLead {
  id: string;
  lead_id: string;
  vendedor_id: string;
  sdr_id: string;
  pos_graduacao_interesse: string;
  data_agendamento: string;
  link_reuniao: string;
  status: string;
  observacoes?: string;
  created_at: string;
  vendedor_nome?: string;
  sdr_nome?: string;
  resultado_reuniao?: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null;
  data_resultado?: string;
}

const fetchAgendamentosLeads = async (): Promise<AgendamentoLead[]> => {
  console.log('🔍 Buscando agendamentos com dados de leads...');
  
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
      id,
      lead_id,
      vendedor_id,
      sdr_id,
      pos_graduacao_interesse,
      data_agendamento,
      link_reuniao,
      status,
      observacoes,
      created_at,
      resultado_reuniao,
      data_resultado,
      vendedor:profiles!vendedor_id(name),
      sdr:profiles!sdr_id(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar agendamentos:', error);
    throw error;
  }

  const agendamentos = data?.map(agendamento => ({
    ...agendamento,
    vendedor_nome: agendamento.vendedor?.name,
    sdr_nome: agendamento.sdr?.name,
    resultado_reuniao: agendamento.resultado_reuniao as 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null
  })) || [];

  console.log('✅ Agendamentos encontrados:', agendamentos.length);
  return agendamentos;
};

export const useAgendamentosLeads = () => {
  return useQuery({
    queryKey: ['agendamentos-leads'],
    queryFn: fetchAgendamentosLeads,
    staleTime: 30000, // 30 seconds
  });
};