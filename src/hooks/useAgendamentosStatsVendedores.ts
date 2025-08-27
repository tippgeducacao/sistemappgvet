import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EffectiveSalesService } from '@/services/vendas/EffectiveSalesService';

export interface AgendamentosStatsVendedores {
  vendedor_id: string;
  vendedor_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  pendentes: number;
  total: number;
}

export const useAgendamentosStatsVendedores = (selectedVendedor?: string, weekDate?: Date) => {
  const [statsData, setStatsData] = useState<AgendamentosStatsVendedores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsVendedores = async () => {
    try {
      setIsLoading(true);
      
      // Calcular o início e fim da semana (quarta a terça)
      const targetDate = weekDate || new Date();
      const dayOfWeek = targetDate.getDay(); // 0 = domingo, 3 = quarta
      
      // Calcular quantos dias subtrair para chegar na quarta-feira
      let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
      
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // 1. Buscar agendamentos da semana (para comparecimento/ausência)
      let query = supabase
        .from('agendamentos')
        .select(`
          vendedor_id,
          resultado_reuniao,
          data_agendamento,
          profiles!vendedor_id (
            name
          )
        `)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      // Se um vendedor específico foi selecionado
      if (selectedVendedor && selectedVendedor !== 'todos') {
        query = query.eq('vendedor_id', selectedVendedor);
      }

      const { data: agendamentos, error } = await query;

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return;
      }

      // 2. Buscar vendedores únicos para buscar conversões efetivas
      const vendedoresUnicos = Array.from(
        new Set(agendamentos?.map(a => a.vendedor_id) || [])
      ).filter(id => id); // Remove valores falsy

      // 3. Buscar vendas efetivas (convertidas) por data de assinatura na semana
      const vendasEfetivasMap = new Map<string, number>();
      if (vendedoresUnicos.length > 0) {
        const contadorVendas = await EffectiveSalesService.countMatriculasByVendedor(
          vendedoresUnicos,
          startOfWeek,
          endOfWeek
        );
        contadorVendas.forEach((count, vendedorId) => {
          vendasEfetivasMap.set(vendedorId, count);
        });
      }

      // 4. Agrupar dados por vendedor
      const statsMap = new Map<string, AgendamentosStatsVendedores>();

      agendamentos?.forEach((agendamento: any) => {
        const vendedorId = agendamento.vendedor_id;
        const vendedorName = agendamento.profiles?.name || 'Vendedor Desconhecido';

        if (!statsMap.has(vendedorId)) {
          statsMap.set(vendedorId, {
            vendedor_id: vendedorId,
            vendedor_name: vendedorName,
            convertidas: vendasEfetivasMap.get(vendedorId) || 0, // Usar vendas efetivas por data de assinatura
            compareceram: 0,
            naoCompareceram: 0,
            pendentes: 0,
            total: 0
          });
        }

        const stats = statsMap.get(vendedorId)!;
        
        // Contar apenas se tem resultado definido
        if (agendamento.resultado_reuniao) {
          stats.total++;

          switch (agendamento.resultado_reuniao) {
            case 'compareceu_nao_comprou':
            case 'compareceu':  
            case 'presente':
            case 'realizada':
              stats.compareceram++;
              break;
            case 'nao_compareceu':
            case 'faltou':
              stats.naoCompareceram++;
              break;
          }
        } else {
          // Reunião sem resultado = pendente
          stats.pendentes++;
          stats.total++;
        }
      });

      // 5. Calcular pendentes como reuniões com comparecimento sem conversão efetiva
      statsMap.forEach((stats) => {
        const reunioesComComparecimento = stats.compareceram;
        const conversoesEfetivas = stats.convertidas;
        
        // Pendentes = reuniões com comparecimento que ainda não resultaram em venda efetiva
        const pendentesCalculados = Math.max(0, reunioesComComparecimento - conversoesEfetivas);
        stats.pendentes += pendentesCalculados;
      });

      setStatsData(Array.from(statsMap.values()));
      
      console.log('📊 Stats calculadas:', {
        semana: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`,
        vendedores: statsMap.size,
        vendas_efetivas_total: Array.from(vendasEfetivasMap.values()).reduce((a, b) => a + b, 0)
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas de vendedores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsVendedores();
  }, [selectedVendedor, weekDate]);

  return {
    statsData,
    isLoading,
    fetchStatsVendedores
  };
};