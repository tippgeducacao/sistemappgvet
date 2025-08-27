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

      // Buscar todos os agendamentos do vendedor e filtrar localmente
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
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const dataResultado = agendamento.data_resultado ? new Date(agendamento.data_resultado) : null;
        
        // Se tem resultado, a reunião conta na semana do resultado
        // Se não tem resultado, conta na semana do agendamento
        const dataReferencia = dataResultado || dataAgendamento;
        const naSemanaSelecionada = dataReferencia >= startOfWeek && dataReferencia <= endOfWeek;
        
        console.log('📋 Verificando agendamento:', {
          id: agendamento.id,
          data_agendamento: dataAgendamento.toLocaleDateString('pt-BR'),
          data_resultado: dataResultado?.toLocaleDateString('pt-BR') || 'sem resultado',
          data_referencia: dataReferencia.toLocaleDateString('pt-BR'),
          periodo_semana: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`,
          na_semana: naSemanaSelecionada,
          resultado: agendamento.resultado_reuniao || 'sem resultado'
        });
        
        return naSemanaSelecionada;
      }) || [];
      
      console.log('✅ Agendamentos filtrados:', {
        total_encontrados: data?.length || 0,
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