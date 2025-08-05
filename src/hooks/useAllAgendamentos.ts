import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { toast } from 'sonner';
import { AgendamentoSDR } from './useAgendamentosSDR';

export const useAllAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoSDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchAllAgendamentos = async () => {
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
          )
        `)
        .in('status', ['agendado', 'atrasado', 'finalizado', 'finalizado_venda', 'cancelado'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar todos os agendamentos:', error);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      setAgendamentos((data || []) as AgendamentoSDR[]);
    } catch (error) {
      console.error('Erro ao buscar todos os agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAgendamentos();
  }, [profile?.id]);

  return {
    agendamentos,
    isLoading,
    fetchAllAgendamentos
  };
};