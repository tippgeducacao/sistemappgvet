import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { isAfter } from 'date-fns';

interface AgendamentoAtrasado {
  id: string;
  data_agendamento: string;
  data_fim_agendamento?: string;
  pos_graduacao_interesse: string;
  observacoes?: string;
  link_reuniao: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
}

export const useReuniaoAtrasada = () => {
  const [agendamentosAtrasados, setAgendamentosAtrasados] = useState<AgendamentoAtrasado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuthStore();

  const verificarAgendamentosAtrasados = async () => {
    if (!profile?.id || profile.user_type !== 'vendedor') return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          data_fim_agendamento,
          pos_graduacao_interesse,
          observacoes,
          link_reuniao,
          lead:leads(nome, email, whatsapp)
        `)
        .eq('vendedor_id', profile.id)
        .eq('status', 'atrasado') // Buscar apenas agendamentos com status atrasado
        .order('data_agendamento', { ascending: true });

      if (error) throw error;

      setAgendamentosAtrasados(data || []);

    } catch (error) {
      console.error('Erro ao verificar agendamentos atrasados:', error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    // Verificar imediatamente
    verificarAgendamentosAtrasados();

    // Verificar a cada 30 minutos em vez de 2 minutos (15x menos)
    const interval = setInterval(verificarAgendamentosAtrasados, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.id]);

  return {
    agendamentosAtrasados,
    isLoading,
    verificarAgendamentosAtrasados
  };
};