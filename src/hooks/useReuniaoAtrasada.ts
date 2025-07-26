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
        .eq('status', 'agendado')
        .order('data_agendamento', { ascending: true });

      if (error) throw error;

      // Filtrar agendamentos que já passaram do horário
      const agora = new Date();
      const atrasados = (data || []).filter(agendamento => {
        const dataFim = agendamento.data_fim_agendamento 
          ? new Date(agendamento.data_fim_agendamento)
          : new Date(new Date(agendamento.data_agendamento).getTime() + 60 * 60 * 1000); // 1 hora depois se não tiver fim
        
        return isAfter(agora, dataFim);
      });

      setAgendamentosAtrasados(atrasados);

      // Se encontrou agendamentos atrasados, atualizar o status no banco
      if (atrasados.length > 0) {
        await atualizarStatusParaAtrasado(atrasados.map(ag => ag.id));
      }

    } catch (error) {
      console.error('Erro ao verificar agendamentos atrasados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarStatusParaAtrasado = async (agendamentoIds: string[]) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'atrasado' })
        .in('id', agendamentoIds);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status para atrasado:', error);
    }
  };

  useEffect(() => {
    // Verificar imediatamente
    verificarAgendamentosAtrasados();

    // Verificar a cada 5 minutos
    const interval = setInterval(verificarAgendamentosAtrasados, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [profile?.id]);

  return {
    agendamentosAtrasados,
    isLoading,
    verificarAgendamentosAtrasados
  };
};