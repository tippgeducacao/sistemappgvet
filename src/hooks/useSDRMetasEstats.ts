import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SDRMetaEstat {
  sdr_id: string;
  sdr_name: string;
  meta_semanal: number;
  agendamentos_feitos: number;
  conversoes: number;
  percentual_atingido: number;
}

export const useSDRMetasEstats = (sdrIds: string[] = []) => {
  const [stats, setStats] = useState<SDRMetaEstat[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    if (sdrIds.length === 0) {
      setStats([]);
      return;
    }

    try {
      setLoading(true);
      
      // Calcular o MÊS COMPLETO (como mostrado na planilha)
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // Janeiro = 1
      const currentYear = today.getFullYear();
      
      // Calcular início e fim do MÊS INTEIRO (primeira quarta até última terça)
      const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
      
      // Encontrar a primeira quarta-feira do mês (início do ciclo)
      let startOfMonth = new Date(firstDayOfMonth);
      while (startOfMonth.getDay() !== 3) { // 3 = quarta-feira
        startOfMonth.setDate(startOfMonth.getDate() - 1);
      }
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Encontrar a última terça-feira do mês (fim do ciclo)
      let endOfMonth = new Date(lastDayOfMonth);
      while (endOfMonth.getDay() !== 2) { // 2 = terça-feira
        endOfMonth.setDate(endOfMonth.getDate() + 1);
      }
      endOfMonth.setHours(23, 59, 59, 999);

      console.log(`🔍 SDR METAS STATS - Calculando MÊS COMPLETO:`, {
        mes: currentMonth,
        ano: currentYear,
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
        periodo: `${startOfMonth.toLocaleDateString('pt-BR')} - ${endOfMonth.toLocaleDateString('pt-BR')}`
      });

      // Buscar agendamentos do MÊS COMPLETO para os SDRs
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          sdr_id,
          resultado_reuniao,
          data_agendamento
        `)
        .in('sdr_id', sdrIds)
        .gte('data_agendamento', startOfMonth.toISOString())
        .lte('data_agendamento', endOfMonth.toISOString());

      if (agendamentosError) throw agendamentosError;

      console.log(`📊 SDR METAS STATS - Agendamentos encontrados:`, {
        total: agendamentos?.length || 0
      });

      // Buscar perfis dos SDRs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, nivel')
        .in('id', sdrIds);

      if (profilesError) throw profilesError;

      // Buscar metas semanais dos SDRs baseadas no nível
      const niveisUnicos = [...new Set(profiles?.map(p => p.nivel) || [])];
      const { data: niveis, error: niveisError } = await supabase
        .from('niveis_vendedores')
        .select('nivel, meta_semanal_inbound')
        .in('nivel', niveisUnicos)
        .eq('tipo_usuario', 'sdr');

      if (niveisError) throw niveisError;

      // Processar dados
      const statsData: SDRMetaEstat[] = sdrIds.map(sdrId => {
        const profile = profiles?.find(p => p.id === sdrId);
        const nivelConfig = niveis?.find(n => n.nivel === profile?.nivel);
        
        // Mesma lógica do painel TV: compareceu_nao_comprou OU comprou
        const sdrAgendamentos = agendamentos?.filter(a => {
          const isDoSDR = a.sdr_id === sdrId;
          const compareceu = a.resultado_reuniao === 'compareceu_nao_comprou' || 
                             a.resultado_reuniao === 'comprou';
          return isDoSDR && compareceu;
        }) || [];
        
        const agendamentosFeitos = sdrAgendamentos.length;
        const conversoes = sdrAgendamentos.filter(a => 
          a.resultado_reuniao === 'comprou'
        ).length;
        
        const metaSemanal = nivelConfig?.meta_semanal_inbound || 0;
        
        // Calcular quantas semanas tem no mês (para meta mensal)
        const weeksInMonth = Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const metaMensal = metaSemanal * weeksInMonth;
        
        const percentualAtingido = metaMensal > 0 ? (agendamentosFeitos / metaMensal) * 100 : 0;

        const resultado = {
          sdr_id: sdrId,
          sdr_name: profile?.name || 'SDR',
          meta_semanal: metaSemanal,
          agendamentos_feitos: agendamentosFeitos,
          conversoes,
          percentual_atingido: Math.round(percentualAtingido * 10) / 10
        };

        console.log(`👤 SDR ${profile?.name}: ${agendamentosFeitos} agendamentos (meta: ${metaSemanal}) = ${percentualAtingido.toFixed(1)}%`);

        return resultado;
      });

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos SDRs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas dos SDRs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [sdrIds.join(',')]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};