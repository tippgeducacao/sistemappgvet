import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentoDetalhado {
  id: string;
  data_agendamento: string;
  data_resultado?: string;
  resultado_reuniao?: string;
  status: string;
  link_reuniao?: string;
  pos_graduacao_interesse?: string;
  observacoes_resultado?: string;
  leads?: {
    nome: string;
    whatsapp?: string;
    email?: string;
  };
}

export const useAgendamentosDetalhados = (vendedorId: string, weekDate: Date) => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgendamentosDetalhados = async () => {
    try {
      setIsLoading(true);
      
      // Usar a mesma lógica de cálculo de semana do hook de resultados
      const currentDate = new Date(weekDate);
      const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = segunda, etc.
      
      // Calcular quantos dias subtrair para chegar na quarta-feira anterior
      let daysToWednesday;
      if (dayOfWeek === 0) { // Domingo
        daysToWednesday = 4;
      } else if (dayOfWeek === 1) { // Segunda
        daysToWednesday = 5;
      } else if (dayOfWeek === 2) { // Terça
        daysToWednesday = 6;
      } else { // Quarta em diante
        daysToWednesday = dayOfWeek - 3;
      }
      
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - daysToWednesday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Quarta + 6 dias = Terça
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('🔍 Buscando agendamentos detalhados EXATOS:', {
        vendedorId,
        weekDate: weekDate.toLocaleDateString('pt-BR'),
        dayOfWeek,
        daysToWednesday,
        startOfWeek: startOfWeek.toLocaleDateString('pt-BR'),
        endOfWeek: endOfWeek.toLocaleDateString('pt-BR'),
        periodo: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`
      });

      // Buscar agendamentos com query mais específica
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          data_resultado,
          resultado_reuniao,
          status,
          link_reuniao,
          pos_graduacao_interesse,
          observacoes_resultado,
          leads (
            nome,
            whatsapp,
            email
          )
        `)
        .eq('vendedor_id', vendedorId)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString())
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos detalhados:', error);
        return;
      }

      console.log('📅 Query executada:', {
        vendedor: vendedorId,
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
        total_encontrados: data?.length || 0
      });

      // Filtro adicional para garantir precisão
      const agendamentosFiltrados = data?.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const dentroDoIntervalo = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        
        console.log('📋 Verificando agendamento:', {
          id: agendamento.id,
          data_agendamento: dataAgendamento.toLocaleDateString('pt-BR'),
          dentro_intervalo: dentroDoIntervalo,
          resultado: agendamento.resultado_reuniao || 'sem resultado',
          status: agendamento.status
        });
        
        return dentroDoIntervalo;
      }) || [];
      
      console.log('✅ Agendamentos FINAIS:', {
        total_filtrados: agendamentosFiltrados.length,
        vendedor: vendedorId,
        semana: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`
      });
      
      setAgendamentos(agendamentosFiltrados);
    } catch (error) {
      console.error('Erro ao buscar agendamentos detalhados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendedorId) {
      fetchAgendamentosDetalhados();
    }
  }, [vendedorId, weekDate]);

  return {
    agendamentos,
    isLoading,
    fetchAgendamentosDetalhados
  };
};