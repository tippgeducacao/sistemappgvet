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
      
      // Calcular início e fim da semana atual (quarta a terça)
      const now = new Date();
      const dayOfWeek = now.getDay();
      let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Buscar agendamentos da semana para os SDRs
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          sdr_id,
          resultado_reuniao,
          data_agendamento
        `)
        .in('sdr_id', sdrIds)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      if (agendamentosError) throw agendamentosError;

      // Buscar perfis dos SDRs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', sdrIds);

      if (profilesError) throw profilesError;

      // Buscar metas semanais dos SDRs (semana atual)
      const currentWeek = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
      
      const { data: metas, error: metasError } = await supabase
        .from('metas_semanais_vendedores')
        .select('vendedor_id, meta_vendas')
        .in('vendedor_id', sdrIds)
        .eq('ano', now.getFullYear())
        .eq('semana', currentWeek);

      if (metasError) throw metasError;

      // Processar dados
      const statsData: SDRMetaEstat[] = sdrIds.map(sdrId => {
        const profile = profiles?.find(p => p.id === sdrId);
        const meta = metas?.find(m => m.vendedor_id === sdrId);
        const sdrAgendamentos = agendamentos?.filter(a => a.sdr_id === sdrId) || [];
        
        const agendamentosFeitos = sdrAgendamentos.length;
        const conversoes = sdrAgendamentos.filter(a => 
          a.resultado_reuniao === 'presente' || 
          a.resultado_reuniao === 'compareceu' || 
          a.resultado_reuniao === 'realizada'
        ).length;
        
        const metaSemanal = meta?.meta_vendas || 0;
        const percentualAtingido = metaSemanal > 0 ? (agendamentosFeitos / metaSemanal) * 100 : 0;

        return {
          sdr_id: sdrId,
          sdr_name: profile?.name || 'SDR',
          meta_semanal: metaSemanal,
          agendamentos_feitos: agendamentosFeitos,
          conversoes,
          percentual_atingido: Math.round(percentualAtingido * 10) / 10
        };
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