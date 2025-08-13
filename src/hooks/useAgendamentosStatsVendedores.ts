import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentosStatsVendedores {
  vendedor_id: string;
  vendedor_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  total: number;
}

export const useAgendamentosStatsVendedores = (selectedVendedor?: string) => {
  const [statsData, setStatsData] = useState<AgendamentosStatsVendedores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsVendedores = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('agendamentos')
        .select(`
          vendedor_id,
          resultado_reuniao,
          profiles!vendedor_id (
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
        console.error('Erro ao buscar estatísticas de vendedores:', error);
        return;
      }

      // Agrupar dados por vendedor
      const statsMap = new Map<string, AgendamentosStatsVendedores>();

      data?.forEach((agendamento: any) => {
        const vendedorId = agendamento.vendedor_id;
        const vendedorName = agendamento.profiles?.name || 'Vendedor Desconhecido';

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
      console.error('Erro ao buscar estatísticas de vendedores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsVendedores();
  }, [selectedVendedor]);

  return {
    statsData,
    isLoading,
    fetchStatsVendedores
  };
};