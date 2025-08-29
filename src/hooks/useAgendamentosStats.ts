import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { getWeekRange } from '@/utils/semanaUtils';

export interface AgendamentosStats {
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  total: number;
}

export const useAgendamentosStats = (weekDate?: Date) => {
  const [stats, setStats] = useState<AgendamentosStats>({
    convertidas: 0,
    compareceram: 0,
    naoCompareceram: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchStats = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      
      // Calcular o range da semana
      const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);
      
      let query = supabase
        .from('agendamentos')
        .select('resultado_reuniao, data_resultado')
        .eq('sdr_id', profile.id) // SDR que fez o agendamento
        .not('resultado_reuniao', 'is', null) // Apenas reuniões com resultado
        .not('data_resultado', 'is', null); // Apenas reuniões com data de resultado

      // Filtrar pela semana se especificado
      if (weekDate) {
        query = query
          .gte('data_resultado', weekStart.toISOString())
          .lte('data_resultado', weekEnd.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return;
      }

      const stats = data.reduce(
        (acc, agendamento) => {
          acc.total++;
          
          switch (agendamento.resultado_reuniao) {
            case 'comprou':
              acc.convertidas++;
              break;
            case 'compareceu_nao_comprou':
              acc.compareceram++;
              break;
            case 'nao_compareceu':
              acc.naoCompareceram++;
              break;
          }
          
          return acc;
        },
        { convertidas: 0, compareceram: 0, naoCompareceram: 0, total: 0 }
      );

      setStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile?.id, weekDate]);

  return {
    stats,
    isLoading,
    fetchStats
  };
};