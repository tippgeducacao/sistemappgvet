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
      
      // Calcular o início e fim da semana (quarta a terça)
      const dayOfWeek = weekDate.getDay();
      let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
      
      const startOfWeek = new Date(weekDate);
      startOfWeek.setDate(weekDate.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('🔍 Buscando agendamentos detalhados:', {
        vendedorId,
        periodo: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
      });

      // Buscar agendamentos com resultado na semana (baseado em data_resultado se houver, senão data_agendamento)
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
        .or(`and(data_resultado.gte.${startOfWeek.toISOString()},data_resultado.lte.${endOfWeek.toISOString()},not.resultado_reuniao.is.null),and(data_resultado.is.null,data_agendamento.gte.${startOfWeek.toISOString()},data_agendamento.lte.${endOfWeek.toISOString()})`)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos detalhados:', error);
        return;
      }

      console.log('📅 Agendamentos encontrados:', {
        total: data?.length || 0,
        periodo: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`,
        vendedor: vendedorId
      });
      
      // Filtrar localmente para garantir que apenas reuniões da semana sejam mostradas
      const agendamentosFiltrados = data?.filter(agendamento => {
        if (agendamento.data_resultado) {
          // Se tem resultado, usar a data do resultado
          const dataResultado = new Date(agendamento.data_resultado);
          return dataResultado >= startOfWeek && dataResultado <= endOfWeek;
        } else {
          // Se não tem resultado, usar a data do agendamento
          const dataAgendamento = new Date(agendamento.data_agendamento);
          return dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        }
      }) || [];
      
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