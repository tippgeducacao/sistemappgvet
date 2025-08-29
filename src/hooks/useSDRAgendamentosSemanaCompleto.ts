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

      // Buscar agendamentos da semana específica que tiveram resultado positivo E já aconteceram
      const agora = new Date();
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', inicioSemana.toISOString())
        .lte('data_agendamento', fimSemana.toISOString())
        .lt('data_agendamento', agora.toISOString()) // Só reuniões que já passaram
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

      if (error) throw error;

      // Buscar meta de agendamentos do perfil usando apenas o nível básico
      const nivelUsuario = (profile as any)?.nivel || 'junior';
      
      console.log('🔍 Buscando meta de agendamentos para SDR:', { nivel: nivelUsuario, userType: profile.user_type });

      const { data: nivelData } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_outbound, nivel')
        .eq('nivel', nivelUsuario)
        .eq('tipo_usuario', 'sdr')
        .maybeSingle();

      console.log('📊 Dados do nível encontrados:', nivelData);

      const metaAgendamentos = nivelData?.meta_semanal_outbound || 30; // Meta padrão de 30 para SDRs

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