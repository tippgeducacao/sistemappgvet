import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { toast } from 'sonner';

export interface AgendamentoSDR {
  id: string;
  lead_id: string;
  sdr_id: string;
  vendedor_id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  link_reuniao: string;
  observacoes?: string;
  status: string;
  resultado_reuniao?: 'nao_compareceu' | 'compareceu_nao_comprou' | 'comprou' | null;
  data_resultado?: string;
  observacoes_resultado?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
  sdr?: {
    name: string;
    email: string;
  };
}

export const useAgendamentosSDR = () => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoSDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchAgendamentos = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
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
        .eq('sdr_id', profile.id)
        .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda', 'remarcado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      setAgendamentos((data || []) as AgendamentoSDR[]);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgendamentosCancelados = async () => {
    if (!profile?.id) return [];

    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
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
        .eq('sdr_id', profile.id)
        .eq('status', 'cancelado')
        .order('updated_at', { ascending: false })
        .limit(20); // Limitar a 20 cancelamentos mais recentes

      if (error) {
        console.error('Erro ao buscar agendamentos cancelados:', error);
        return [];
      }

      return (data || []) as AgendamentoSDR[];
    } catch (error) {
      console.error('Erro ao buscar agendamentos cancelados:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [profile?.id]);

  // Filtrar agendamentos ativos (não cancelados)
  const agendamentosAtivos = agendamentos.filter(ag => 
    ['agendado', 'atrasado', 'finalizado', 'finalizado_venda', 'remarcado'].includes(ag.status)
  );

  return {
    agendamentos: agendamentosAtivos,
    todosAgendamentos: agendamentos,
    isLoading,
    fetchAgendamentos,
    fetchAgendamentosCancelados
  };
};