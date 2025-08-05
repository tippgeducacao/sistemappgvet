import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/AuthStore';

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

      // Buscar agendamentos de hoje
      const { data: agendamentosHoje, error: errorHoje } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('created_at', inicioHoje.toISOString())
        .lte('created_at', fimHoje.toISOString());

      if (errorHoje) throw errorHoje;

      // Buscar agendamentos de ontem
      const { data: agendamentosOntem, error: errorOntem } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('created_at', inicioOntem.toISOString())
        .lte('created_at', fimOntem.toISOString());

      if (errorOntem) throw errorOntem;

      // Buscar o nível do perfil e depois a meta semanal do SDR
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nivel')
        .eq('id', profile.id)
        .maybeSingle();

      const nivel = profileData?.nivel || 'junior';

      const { data: nivelData } = await supabase
        .from('niveis_vendedores')
        .select('meta_vendas_cursos, meta_semanal_inbound, meta_semanal_outbound')
        .eq('nivel', nivel)
        .eq('tipo_usuario', profile.user_type)
        .maybeSingle();

      const metaSemanalCursos = nivelData?.meta_vendas_cursos || 0;
      const metaSemanalAgendamentos = profile.user_type === 'sdr_inbound' 
        ? (nivelData?.meta_semanal_inbound || 0)
        : (nivelData?.meta_semanal_outbound || 0);
      
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