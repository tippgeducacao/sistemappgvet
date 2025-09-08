import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetaSemanalVendedor {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas: number;
  created_at: string;
  updated_at: string;
}

export const useMetasSemanaisByVendedor = (
  vendedorId: string,
  ano: number,
  mes: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['metas-semanais-vendedor', vendedorId, ano, mes],
    queryFn: async (): Promise<MetaSemanalVendedor[]> => {
      if (!vendedorId) return [];

      console.log(`🎯 Buscando metas semanais: vendedor ${vendedorId} - ${ano}/${mes}`);

      // Calcular as semanas do mês específico
      const firstDay = new Date(ano, mes - 1, 1);
      const lastDay = new Date(ano, mes, 0);
      
      // Função para calcular número da semana (quarta-feira como início)
      const getWeekNumber = (date: Date): number => {
        const firstWednesday = new Date(ano, 0, 1);
        firstWednesday.setDate(firstWednesday.getDate() + (3 - firstWednesday.getDay() + 7) % 7);
        
        const diffTime = date.getTime() - firstWednesday.getTime();
        const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
        return diffWeeks + 1;
      };

      const semanasDoMes: number[] = [];
      const currentDate = new Date(firstDay);
      
      while (currentDate <= lastDay) {
        const weekNum = getWeekNumber(currentDate);
        if (!semanasDoMes.includes(weekNum)) {
          semanasDoMes.push(weekNum);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`📅 Semanas do mês ${mes}/${ano}:`, semanasDoMes);

      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .select('*')
        .eq('vendedor_id', vendedorId)
        .eq('ano', ano)
        .in('semana', semanasDoMes)
        .order('semana', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar metas semanais do vendedor:', error);
        throw error;
      }

      const metas = data || [];
      console.log(`📊 Metas encontradas: ${metas.length} de ${semanasDoMes.length} semanas`);
      
      return metas;
    },
    enabled: enabled && !!vendedorId && !!ano && !!mes,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });
};