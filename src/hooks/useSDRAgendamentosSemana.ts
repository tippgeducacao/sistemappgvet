import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';

export const useSDRAgendamentosSemana = () => {
  const [agendamentosSemana, setAgendamentosSemana] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchAgendamentosSemana = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);

      // Calcular início e fim da semana (quarta a terça)
      const hoje = new Date();
      const inicioSemana = new Date();
      inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 4) % 7)); // Última quarta-feira
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6); // Próxima terça-feira
      fimSemana.setHours(23, 59, 59, 999);

      // Buscar agendamentos da semana atual que tiveram resultado positivo E já aconteceram
      const agora = new Date();
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', inicioSemana.toISOString())
        .lte('data_agendamento', fimSemana.toISOString())
        .lt('data_agendamento', agora.toISOString()) // Só reuniões que já passaram
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']); // Apenas comparecimentos válidos

      if (error) throw error;

      setAgendamentosSemana(agendamentos?.length || 0);

    } catch (error) {
      console.error('Erro ao buscar agendamentos da semana:', error);
      setAgendamentosSemana(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendamentosSemana();
  }, [profile?.id]);

  return {
    agendamentosSemana,
    isLoading,
    fetchAgendamentosSemana
  };
};