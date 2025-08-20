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

  // Funções para calcular semanas - IGUAL ao sistema
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    // Começar da primeira terça-feira do mês
    let tercaAtual = new Date(primeiroDia);
    while (tercaAtual.getDay() !== 2) { // 2 = terça-feira
      tercaAtual.setDate(tercaAtual.getDate() + 1);
    }
    
    let numeroSemana = 1;
    
    // Para cada terça-feira que está no mês, criar uma semana
    while (tercaAtual.getMonth() === mes - 1 && tercaAtual <= ultimoDia) {
      semanas.push(numeroSemana);
      numeroSemana++;
      tercaAtual.setDate(tercaAtual.getDate() + 7);
    }
    
    return semanas;
  };

  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    // Encontrar a primeira terça-feira do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    let dataAtual = new Date(primeiroDia);
    while (dataAtual.getDay() !== 2) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Avançar para a terça-feira da semana especificada
    dataAtual.setDate(dataAtual.getDate() + (numeroSemana - 1) * 7);
    
    // Verificar se ainda está no mês correto
    if (dataAtual.getMonth() !== mes - 1) {
      dataAtual = new Date(ultimoDia);
      while (dataAtual.getDay() !== 2) {
        dataAtual.setDate(dataAtual.getDate() - 1);
      }
    }
    
    // Calcular a quarta-feira anterior (início da semana)
    const inicioSemana = new Date(dataAtual);
    inicioSemana.setDate(inicioSemana.getDate() - 6); // Voltar 6 dias para a quarta anterior
    inicioSemana.setHours(0, 0, 0, 0);
    return inicioSemana;
  };

  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    // Encontrar a primeira terça-feira do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    let dataAtual = new Date(primeiroDia);
    while (dataAtual.getDay() !== 2) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Avançar para a terça-feira da semana especificada
    dataAtual.setDate(dataAtual.getDate() + (numeroSemana - 1) * 7);
    
    // Verificar se ainda está no mês correto
    if (dataAtual.getMonth() !== mes - 1) {
      dataAtual = new Date(ultimoDia);
      while (dataAtual.getDay() !== 2) {
        dataAtual.setDate(dataAtual.getDate() - 1);
      }
    }
    
    dataAtual.setHours(23, 59, 59, 999);
    return dataAtual;
  };

  const fetchStats = async () => {
    if (sdrIds.length === 0) {
      setStats([]);
      return;
    }

    try {
      setLoading(true);
      
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // Janeiro = 1
      const currentYear = today.getFullYear();
      
      console.log(`🚀 SDR METAS STATS INICIADO - ${currentMonth}/${currentYear} para SDRs:`, sdrIds);
      console.log(`🔍 Data atual:`, today.toISOString());

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

      // Obter semanas do mês atual
      const semanasDoMes = getSemanasDoMes(currentYear, currentMonth);
      console.log(`📅 Semanas do mês ${currentMonth}/${currentYear}:`, semanasDoMes);

      // Para cada SDR, calcular o total de reuniões somando todas as semanas
      const statsData: SDRMetaEstat[] = [];
      
      for (const sdrId of sdrIds) {
        const profile = profiles?.find(p => p.id === sdrId);
        const nivelConfig = niveis?.find(n => n.nivel === profile?.nivel);
        
        let totalAgendamentosFeitos = 0;
        let totalConversoes = 0;
        
        console.log(`\n👤 Processando SDR: ${profile?.name}`);
        
        // Para cada semana do mês, buscar as reuniões
        for (const numeroSemana of semanasDoMes) {
          const inicioSemana = getDataInicioSemana(currentYear, currentMonth, numeroSemana);
          const fimSemana = getDataFimSemana(currentYear, currentMonth, numeroSemana);
          
          console.log(`📊 Semana ${numeroSemana}: ${inicioSemana.toLocaleDateString('pt-BR')} - ${fimSemana.toLocaleDateString('pt-BR')}`);
          
          // Buscar agendamentos desta semana específica - FILTRAR POR STATUS REALIZADO
          const { data: agendamentosSemana, error: agendamentosError } = await supabase
            .from('agendamentos')
            .select('sdr_id, resultado_reuniao, data_agendamento, status')
            .eq('sdr_id', sdrId)
            .gte('data_agendamento', inicioSemana.toISOString())
            .lte('data_agendamento', fimSemana.toISOString())
            .eq('status', 'realizado')  // CRÍTICO: só reuniões finalizadas
            .in('resultado_reuniao', ['compareceu_nao_comprou', 'comprou']);

          if (agendamentosError) {
            console.error('❌ Erro ao buscar agendamentos da semana:', agendamentosError);
            continue;
          }

          const reunioesSemana = agendamentosSemana?.length || 0;
          const conversoesSemana = agendamentosSemana?.filter(a => a.resultado_reuniao === 'comprou').length || 0;
          
          totalAgendamentosFeitos += reunioesSemana;
          totalConversoes += conversoesSemana;
          
           console.log(`   ✅ Semana ${numeroSemana}: ${reunioesSemana} reuniões, ${conversoesSemana} vendas`);
           
           // Log detalhado das reuniões encontradas (especialmente para Ricael)
           if (profile?.name?.toLowerCase().includes('ricael') && reunioesSemana > 0) {
             console.log(`   📋 Detalhes das reuniões do Ricael na semana ${numeroSemana}:`, 
               agendamentosSemana?.map(a => ({
                 data: new Date(a.data_agendamento).toLocaleDateString('pt-BR'),
                 resultado: a.resultado_reuniao
               }))
             );
           }
        }
        
        const metaSemanal = nivelConfig?.meta_semanal_inbound || 0;
        const metaMensal = metaSemanal * semanasDoMes.length;
        const percentualAtingido = metaMensal > 0 ? (totalAgendamentosFeitos / metaMensal) * 100 : 0;

        const resultado = {
          sdr_id: sdrId,
          sdr_name: profile?.name || 'SDR',
          meta_semanal: metaSemanal,
          agendamentos_feitos: totalAgendamentosFeitos,
          conversoes: totalConversoes,
          percentual_atingido: Math.round(percentualAtingido * 10) / 10
        };

        console.log(`🎯 RESULTADO FINAL - ${profile?.name}: ${totalAgendamentosFeitos} reuniões totais (meta mensal: ${metaMensal}) = ${percentualAtingido.toFixed(1)}%`);

        statsData.push(resultado);
      }

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
    console.log('🔄 useEffect disparado - forçando nova busca');
    fetchStats();
  }, [sdrIds.join(',')]); // Removido Date.now() que causava loop

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};