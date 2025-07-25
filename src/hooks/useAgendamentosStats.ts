import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';

export interface AgendamentosStats {
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  total: number;
}

export const useAgendamentosStats = () => {
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
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('resultado_reuniao')
        .eq('vendedor_id', profile.id)
        .not('resultado_reuniao', 'is', null); // Apenas reuniões com resultado

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
  }, [profile?.id]);

  return {
    stats,
    isLoading,
    fetchStats
  };
};