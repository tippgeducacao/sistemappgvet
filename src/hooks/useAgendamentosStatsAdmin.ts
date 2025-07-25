import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentosStatsAdmin {
  vendedor_id: string;
  vendedor_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  total: number;
}

export const useAgendamentosStatsAdmin = (selectedVendedor?: string) => {
  const [statsData, setStatsData] = useState<AgendamentosStatsAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAdmin = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('agendamentos')
        .select(`
          vendedor_id,
          resultado_reuniao,
          vendedor:profiles!agendamentos_vendedor_id_fkey (
            name
          )
        `)
        .not('resultado_reuniao', 'is', null);

      // Se um vendedor específico foi selecionado
      if (selectedVendedor && selectedVendedor !== 'todos') {
        query = query.eq('vendedor_id', selectedVendedor);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estatísticas admin:', error);
        return;
      }

      // Agrupar dados por vendedor
      const statsMap = new Map<string, AgendamentosStatsAdmin>();

      data?.forEach((agendamento: any) => {
        const vendedorId = agendamento.vendedor_id;
        const vendedorName = agendamento.vendedor?.name || 'Vendedor Desconhecido';

        if (!statsMap.has(vendedorId)) {
          statsMap.set(vendedorId, {
            vendedor_id: vendedorId,
            vendedor_name: vendedorName,
            convertidas: 0,
            compareceram: 0,
            naoCompareceram: 0,
            total: 0
          });
        }

        const stats = statsMap.get(vendedorId)!;
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
  }, [selectedVendedor]);

  return {
    statsData,
    isLoading,
    fetchStatsAdmin
  };
};