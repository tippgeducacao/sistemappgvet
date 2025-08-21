import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsuarioMetaEstat {
  usuario_id: string;
  nome: string;
  tipo_usuario: string;
  nivel: string;
  agendamentos_feitos: number;
  meta_semanal: number;
  conversoes: number;
  percentual_atingido: number;
}

// Função para calcular as semanas do mês (baseado em terças-feiras)
const getSemanasDoMes = (ano: number, mes: number): number[] => {
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  
  let dataAtual = new Date(primeiroDia);
  while (dataAtual.getDay() !== 2) { // Encontrar primeira terça
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  const semanas: number[] = [];
  let contadorSemana = 1;

  while (dataAtual <= ultimoDia) {
    semanas.push(contadorSemana);
    dataAtual.setDate(dataAtual.getDate() + 7);
    contadorSemana++;
  }

  return semanas;
};

const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number): Date => {
  // Encontrar a primeira terça-feira do mês
  const primeiroDia = new Date(ano, mes - 1, 1);
  
  let dataAtual = new Date(primeiroDia);
  while (dataAtual.getDay() !== 2) {
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  // Avançar para a semana especificada (quarta-feira da semana)
  dataAtual.setDate(dataAtual.getDate() + (numeroSemana - 1) * 7 + 1);
  dataAtual.setHours(0, 0, 0, 0);
  return dataAtual;
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

export const useUsuarioMetasEstats = (usuarioIds: string[] = []) => {
  const [stats, setStats] = useState<UsuarioMetaEstat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (usuarioIds.length === 0) {
      setStats([]);
      return;
    }

    try {
      setLoading(true);
      
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      console.log(`🚀 USUARIO METAS STATS INICIADO - ${currentMonth}/${currentYear} para usuários:`, usuarioIds);

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, nivel, user_type')
        .in('id', usuarioIds)
        .in('user_type', ['sdr', 'sdr_inbound', 'sdr_outbound', 'vendedor']);

      if (profilesError) throw profilesError;

      // Buscar metas semanais baseadas no nível e tipo de usuário
      const niveisUnicos = [...new Set(profiles?.map(p => p.nivel) || [])];
      const tiposUsuario = [...new Set(profiles?.map(p => p.user_type) || [])];
      
      const { data: niveis, error: niveisError } = await supabase
        .from('niveis_vendedores')
        .select('nivel, tipo_usuario, meta_semanal_inbound, meta_semanal_outbound, meta_semanal_vendedor')
        .in('nivel', niveisUnicos)
        .in('tipo_usuario', ['sdr', 'vendedor']);

      if (niveisError) throw niveisError;

      // Obter semanas do mês atual
      const semanasDoMes = getSemanasDoMes(currentYear, currentMonth);
      console.log(`📅 Semanas do mês ${currentMonth}/${currentYear}:`, semanasDoMes);

      // Para cada usuário, calcular o total de reuniões somando todas as semanas
      const statsData: UsuarioMetaEstat[] = [];
      
      for (const usuarioId of usuarioIds) {
        const profile = profiles?.find(p => p.id === usuarioId);
        if (!profile) continue;

        // Determinar qual meta usar baseado no tipo de usuário
        let metaSemanal = 0;
        const nivelConfig = niveis?.find(n => n.nivel === profile.nivel);
        
        if (profile.user_type === 'vendedor') {
          metaSemanal = nivelConfig?.meta_semanal_vendedor || 0;
        } else if (profile.user_type === 'sdr_inbound') {
          metaSemanal = nivelConfig?.meta_semanal_inbound || 0;
        } else if (profile.user_type === 'sdr_outbound') {
          metaSemanal = nivelConfig?.meta_semanal_outbound || 0;
        } else {
          // SDR genérico - usar inbound como padrão
          metaSemanal = nivelConfig?.meta_semanal_inbound || 0;
        }
        
        let totalAgendamentosFeitos = 0;
        let totalConversoes = 0;
        
        console.log(`\n👤 Processando ${profile.user_type}: ${profile.name}`);
        
        // Para cada semana do mês, buscar as reuniões
        for (const numeroSemana of semanasDoMes) {
          const inicioSemana = getDataInicioSemana(currentYear, currentMonth, numeroSemana);
          const fimSemana = getDataFimSemana(currentYear, currentMonth, numeroSemana);
          
          console.log(`📊 Semana ${numeroSemana}: ${inicioSemana.toLocaleDateString('pt-BR')} - ${fimSemana.toLocaleDateString('pt-BR')}`);
          
          // Para SDRs, buscar agendamentos
          if (['sdr', 'sdr_inbound', 'sdr_outbound'].includes(profile.user_type)) {
            const { data: agendamentosSemana, error: agendamentosError } = await supabase
              .from('agendamentos')
              .select('sdr_id, resultado_reuniao, data_agendamento, status')
              .eq('sdr_id', usuarioId)
              .gte('data_agendamento', inicioSemana.toISOString())
              .lte('data_agendamento', fimSemana.toISOString())
              .eq('status', 'realizado')
              .in('resultado_reuniao', ['compareceu_nao_comprou', 'comprou']);

            if (agendamentosError) {
              console.error('❌ Erro ao buscar agendamentos da semana:', agendamentosError);
              continue;
            }

            const reunioesSemana = agendamentosSemana?.length || 0;
            const conversoesSemana = agendamentosSemana?.filter(a => a.resultado_reuniao === 'comprou').length || 0;
            
            totalAgendamentosFeitos += reunioesSemana;
            totalConversoes += conversoesSemana;
            
            console.log(`  📈 Reuniões: ${reunioesSemana}, Conversões: ${conversoesSemana}`);
          } 
          // Para vendedores, buscar vendas realizadas
          else if (profile.user_type === 'vendedor') {
            const { data: vendasSemana, error: vendasError } = await supabase
              .from('form_entries')
              .select('vendedor_id, status, created_at')
              .eq('vendedor_id', usuarioId)
              .gte('created_at', inicioSemana.toISOString())
              .lte('created_at', fimSemana.toISOString());

            if (vendasError) {
              console.error('❌ Erro ao buscar vendas da semana:', vendasError);
              continue;
            }

            const vendasSemana_ = vendasSemana?.length || 0;
            const vendasMatriculadas = vendasSemana?.filter(v => v.status === 'matriculado').length || 0;
            
            totalAgendamentosFeitos += vendasSemana_;
            totalConversoes += vendasMatriculadas;
            
            console.log(`  📈 Vendas: ${vendasSemana_}, Matrículas: ${vendasMatriculadas}`);
          }
        }

        // Calcular percentual atingido para o mês (meta semanal * número de semanas)
        const metaMensal = metaSemanal * semanasDoMes.length;
        const percentualAtingido = metaMensal > 0 ? (totalAgendamentosFeitos / metaMensal) * 100 : 0;
        
        console.log(`📊 Resultado final - ${profile.name}: ${totalAgendamentosFeitos}/${metaMensal} (${percentualAtingido.toFixed(1)}%)`);

        statsData.push({
          usuario_id: usuarioId,
          nome: profile.name,
          tipo_usuario: profile.user_type,
          nivel: profile.nivel || 'N/A',
          agendamentos_feitos: totalAgendamentosFeitos,
          meta_semanal: metaSemanal,
          conversoes: totalConversoes,
          percentual_atingido: percentualAtingido
        });
      }

      setStats(statsData);
      console.log('✅ SDR METAS STATS CONCLUÍDO:', statsData);
      
    } catch (error) {
      console.error('❌ Erro no SDR METAS STATS:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [usuarioIds.join(',')]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};