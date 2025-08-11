import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';

export const useSDRAgendamentosSemanaCompleto = () => {
  const [dadosSemana, setDadosSemana] = useState<{
    agendamentosRealizados: number;
    metaAgendamentos: number;
    percentualAgendamentos: number;
  }>({
    agendamentosRealizados: 0,
    metaAgendamentos: 0,
    percentualAgendamentos: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();
  const { getDataInicioSemana, getDataFimSemana } = useMetasSemanaisSDR();

  const fetchAgendamentosSemanaCompleto = async (ano: number, semana: number) => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);

      // Calcular início e fim da semana específica
      const inicioSemana = getDataInicioSemana(ano, new Date().getMonth() + 1, semana);
      const fimSemana = getDataFimSemana(ano, new Date().getMonth() + 1, semana);

      // Buscar agendamentos da semana específica que tiveram resultado positivo
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', inicioSemana.toISOString())
        .lte('data_agendamento', fimSemana.toISOString())
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

      if (error) throw error;

      // Buscar meta de agendamentos do perfil
      const nivelRaw = (profile as any)?.nivel || 'junior';
      let nivelCompleto = '';
      
      // Se o nível já contém o prefixo, usar direto, senão construir
      if (nivelRaw.includes('sdr_')) {
        nivelCompleto = nivelRaw;
      } else {
        nivelCompleto = `sdr_${nivelRaw}`;
      }

      console.log('🔍 Buscando meta de agendamentos para:', { nivelRaw, nivelCompleto, userType: profile.user_type });

      const { data: nivelData } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_inbound, meta_semanal_outbound, nivel')
        .eq('nivel', nivelCompleto)
        .eq('tipo_usuario', 'sdr')
        .maybeSingle();

      console.log('📊 Dados do nível encontrados:', nivelData);

      const metaAgendamentos = nivelCompleto?.includes('inbound') 
        ? (nivelData?.meta_semanal_inbound || 55) // Meta padrão de 55 para SDR inbound junior
        : (nivelData?.meta_semanal_outbound || 30); // Meta padrão de 30 para SDR outbound junior

      const agendamentosRealizados = agendamentos?.length || 0;
      const percentualAgendamentos = metaAgendamentos > 0 
        ? (agendamentosRealizados / metaAgendamentos) * 100 
        : 0;

      setDadosSemana({
        agendamentosRealizados,
        metaAgendamentos,
        percentualAgendamentos: Math.round(percentualAgendamentos)
      });

    } catch (error) {
      console.error('Erro ao buscar agendamentos da semana:', error);
      setDadosSemana({
        agendamentosRealizados: 0,
        metaAgendamentos: 0,
        percentualAgendamentos: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dadosSemana,
    isLoading,
    fetchAgendamentosSemanaCompleto
  };
};