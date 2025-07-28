import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentosStatsAdmin {
  sdr_id: string;
  sdr_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  total: number;
}

export const useAgendamentosStatsAdmin = (selectedSDR?: string) => {
  const [statsData, setStatsData] = useState<AgendamentosStatsAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAdmin = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('agendamentos')
        .select(`
          sdr_id,
          resultado_reuniao,
          sdr:profiles!sdr_id (
            name
          )
        `)
        .not('resultado_reuniao', 'is', null);

      // Se um SDR específico foi selecionado
      if (selectedSDR && selectedSDR !== 'todos') {
        query = query.eq('sdr_id', selectedSDR);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas admin:', error);
        return;
      }

      // Agrupar dados por SDR
      const statsMap = new Map<string, AgendamentosStatsAdmin>();

      data?.forEach((agendamento: any) => {
        const sdrId = agendamento.sdr_id;
        const sdrName = agendamento.sdr?.name || 'SDR Desconhecido';

        if (!statsMap.has(sdrId)) {
          statsMap.set(sdrId, {
            sdr_id: sdrId,
            sdr_name: sdrName,
            convertidas: 0,
            compareceram: 0,
            naoCompareceram: 0,
            total: 0
          });
        }

        const stats = statsMap.get(sdrId)!;
        stats.total++;

        switch (agendamento.resultado_reuniao) {
          case 'comprou':
            stats.convertidas++;
            break;
          case 'compareceu_nao_comprou':
            stats.compareceram++;
            break;
          case 'nao_compareceu':
            stats.naoCompareceram++;
            break;
        }
      });

      setStatsData(Array.from(statsMap.values()));
    } catch (error) {
      console.error('Erro ao buscar estatísticas admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAdmin();
  }, [selectedSDR]);

  return {
    statsData,
    isLoading,
    fetchStatsAdmin
  };
};