import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';

interface AgendamentoComparativo {
  hoje: number;
  ontem: number;
  diferenca: number;
  percentual: number;
  metaAgendamentos: number;
  metaBatida: boolean;
  metaSemanalCursos: number;
  metaSemanalAgendamentos: number;
}

export const useSDRAgendamentosMetas = () => {
  const [dados, setDados] = useState<AgendamentoComparativo>({
    hoje: 0,
    ontem: 0,
    diferenca: 0,
    percentual: 0,
    metaAgendamentos: 0,
    metaBatida: false,
    metaSemanalCursos: 0,
    metaSemanalAgendamentos: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();
  const { getMetaSemanalSDR, getSemanaAtual } = useMetasSemanaisSDR();

  const fetchComparativo = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);

      const hoje = new Date();
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);

      const inicioHoje = new Date(hoje);
      inicioHoje.setHours(0, 0, 0, 0);
      const fimHoje = new Date(hoje);
      fimHoje.setHours(23, 59, 59, 999);

      const inicioOntem = new Date(ontem);
      inicioOntem.setHours(0, 0, 0, 0);
      const fimOntem = new Date(ontem);
      fimOntem.setHours(23, 59, 59, 999);

      // Buscar agendamentos de hoje que tiveram resultado positivo
      const { data: agendamentosHoje, error: errorHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', inicioHoje.toISOString())
        .lte('data_agendamento', fimHoje.toISOString())
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']); // Apenas comparecimentos válidos

      if (errorHoje) throw errorHoje;

      // Buscar agendamentos de ontem que tiveram resultado positivo
      const { data: agendamentosOntem, error: errorOntem } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', inicioOntem.toISOString())
        .lte('data_agendamento', fimOntem.toISOString())
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']); // Apenas comparecimentos válidos

      if (errorOntem) throw errorOntem;

      // Buscar meta usando a mesma lógica da tabela
      const semanaAtual = getSemanaAtual();
      const meta = getMetaSemanalSDR(profile.id, new Date().getFullYear(), semanaAtual);
      
      const metaSemanalCursos = meta?.meta_vendas_cursos || 8;
      
      // Para agendamentos, buscar o nível correto do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nivel')
        .eq('id', profile.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      const nivelUsuario = profileData?.nivel || 'junior';
      
      console.log('🔍 Buscando meta de agendamentos para SDR:', { nivel: nivelUsuario, userType: profile.user_type });

      // Buscar meta de agendamentos na tabela niveis_vendedores
      const { data: nivelData, error: nivelError } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_outbound, nivel')
        .eq('nivel', nivelUsuario)
        .eq('tipo_usuario', 'sdr')
        .maybeSingle();

      if (nivelError) {
        console.error('Erro ao buscar nível para metas:', nivelError);
        throw nivelError;
      }

      console.log('📊 Dados do nível para metas:', nivelData);

      const metaSemanalAgendamentos = nivelData?.meta_semanal_outbound || 30; // Meta padrão de 30 para SDRs

      console.log('🎯 Meta semanal de agendamentos:', metaSemanalAgendamentos);
      
      const metaDiariaAgendamentos = Math.ceil(metaSemanalAgendamentos / 7);

      const qtdHoje = agendamentosHoje?.length || 0;
      const qtdOntem = agendamentosOntem?.length || 0;
      const diferenca = qtdHoje - qtdOntem;
      const percentual = qtdOntem > 0 ? ((diferenca / qtdOntem) * 100) : (qtdHoje > 0 ? 100 : 0);

      setDados({
        hoje: qtdHoje,
        ontem: qtdOntem,
        diferenca,
        percentual: Math.round(percentual),
        metaAgendamentos: metaDiariaAgendamentos,
        metaBatida: qtdHoje >= metaDiariaAgendamentos,
        metaSemanalCursos,
        metaSemanalAgendamentos
      });

    } catch (error) {
      console.error('Erro ao buscar dados comparativos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparativo();
  }, [profile?.id]);

  return {
    dados,
    isLoading,
    fetchComparativo
  };
};