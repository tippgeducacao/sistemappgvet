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
      
      // Calcular o início e fim da semana atual (quarta a terça)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = domingo, 3 = quarta
      
      // Calcular quantos dias subtrair para chegar na quarta-feira
      let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      let query = supabase
        .from('agendamentos')
        .select(`
          sdr_id,
          resultado_reuniao,
          data_agendamento,
          profiles!sdr_id (
            name
          )
        `)
        .not('resultado_reuniao', 'is', null)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

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
        const sdrName = agendamento.profiles?.name || 'SDR Desconhecido';

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