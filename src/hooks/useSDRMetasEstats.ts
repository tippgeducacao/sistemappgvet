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
      
      // Usar a mesma lógica da planilha detalhada
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // Janeiro = 1
      const currentYear = now.getFullYear();
      
      console.log(`🔍 SDR METAS STATS - Buscando para mês atual: ${currentMonth}/${currentYear}`);
      
      // Encontrar semana atual do mês (baseada na terça que encerra)
      let tercaQueEncerra = new Date(now);
      if (tercaQueEncerra.getDay() !== 2) {
        const diasAteTerca = (2 - tercaQueEncerra.getDay() + 7) % 7;
        if (diasAteTerca === 0) {
          tercaQueEncerra.setDate(tercaQueEncerra.getDate() + 7);
        } else {
          tercaQueEncerra.setDate(tercaQueEncerra.getDate() + diasAteTerca);
        }
      }
      
      // Encontrar qual semana do mês é esta terça
      let primeiraTerca = new Date(currentYear, currentMonth - 1, 1);
      while (primeiraTerca.getDay() !== 2) {
        primeiraTerca.setDate(primeiraTerca.getDate() + 1);
      }
      
      const semanaAtual = Math.floor((tercaQueEncerra.getDate() - primeiraTerca.getDate()) / 7) + 1;
      
      // Calcular datas da semana atual (quarta a terça)
      const startOfWeek = new Date(tercaQueEncerra);
      startOfWeek.setDate(tercaQueEncerra.getDate() - 6); // Quarta anterior
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(tercaQueEncerra);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log(`🗓️ SDR METAS STATS - Período semana ${semanaAtual}:`, {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        periodo: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`
      });

      // Buscar agendamentos da semana para os SDRs (mesma lógica da planilha)
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          sdr_id,
          resultado_reuniao,
          data_agendamento,
          status
        `)
        .in('sdr_id', sdrIds)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString())
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

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
        const sdrAgendamentos = agendamentos?.filter(a => a.sdr_id === sdrId) || [];
        
        // Agora já filtramos apenas as reuniões realizadas na query
        const agendamentosFeitos = sdrAgendamentos.length;
        const conversoes = sdrAgendamentos.filter(a => 
          a.resultado_reuniao === 'comprou'
        ).length;
        
        const metaSemanal = nivelConfig?.meta_semanal_inbound || 0;
        const percentualAtingido = metaSemanal > 0 ? (agendamentosFeitos / metaSemanal) * 100 : 0;

        const resultado = {
          sdr_id: sdrId,
          sdr_name: profile?.name || 'SDR',
          meta_semanal: metaSemanal,
          agendamentos_feitos: agendamentosFeitos,
          conversoes,
          percentual_atingido: Math.round(percentualAtingido * 10) / 10
        };

        console.log(`👤 SDR ${profile?.name}: ${agendamentosFeitos} agendamentos de meta ${metaSemanal}`);

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