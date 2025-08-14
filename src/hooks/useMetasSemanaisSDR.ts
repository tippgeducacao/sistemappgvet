import { useState, useEffect } from 'react';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';

export interface MetaSemanalSDR {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas_cursos: number; // Mudança: agora representa vendas de cursos
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useMetasSemanaisSDR = () => {
  const [loading, setLoading] = useState(false);
  const { niveis } = useNiveis();
  const { profile, currentUser } = useAuthStore();

  // Buscar meta semanal específica do SDR baseada no nível do usuário
  const getMetaSemanalSDR = (vendedorId: string, ano: number, semana: number): MetaSemanalSDR | undefined => {
    // Buscar o nível do usuário
    const userType = profile?.user_type;
    const nivelRaw = (currentUser as any)?.nivel || (profile as any)?.nivel || 'junior';
    
    // Se o nível já contém sdr_ (ex: sdr_junior), usar direto
    // Se não, construir o nível completo baseado no user_type
    let nivelCompleto = '';
    if (nivelRaw.includes('sdr_')) {
      nivelCompleto = nivelRaw;
    } else {
      // Compor o nível baseado no tipo de usuário
      nivelCompleto = `sdr_${nivelRaw}`;
    }
    
    console.log('🔍 getMetaSemanalSDR: Buscando meta', { 
      vendedorId, 
      ano, 
      semana, 
      userType,
      nivelRaw,
      nivelCompleto,
      currentUser: currentUser ? { id: currentUser.id, user_type: (currentUser as any).user_type } : null,
      profile: profile ? { id: profile.id, user_type: profile.user_type, nivel: (profile as any).nivel } : null 
    });
    
    // Para SDRs, buscar meta direto do banco baseado no nível atual
    const nivel = (profile as any)?.nivel || 'junior';
    console.log('🔍 Buscando meta para SDR nível:', nivel);
    
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const metaCursos = nivelConfig?.meta_vendas_cursos || 8;
    
    console.log('📊 Meta de cursos encontrada:', metaCursos, 'para nível:', nivel);
    
    const resultado = {
      id: `${vendedorId}-${ano}-${semana}`,
      vendedor_id: vendedorId,
      ano,
      semana,
      meta_vendas_cursos: metaCursos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ getMetaSemanalSDR: Meta encontrada', resultado);
    return resultado;
  };

  // Obter a meta padrão baseada no nível do SDR (agora para vendas de cursos)
  const getMetaPadraoSDR = (nivel: string): number => {
    console.log('🔍 Buscando meta de cursos para nível:', nivel);
    console.log('📊 Níveis disponíveis:', niveis);
    
    // Primeiro tentar buscar exato (ex: sdr_junior)
    let nivelConfig = niveis.find(n => n.nivel === nivel);
    
    // Se não encontrar, tentar com o nível base (sem sdr_)
    if (!nivelConfig && nivel.includes('sdr_')) {
      const nivelBase = nivel.replace('sdr_', '');
      nivelConfig = niveis.find(n => n.nivel === nivelBase && n.tipo_usuario === 'vendedor');
      console.log('⚙️ Tentando buscar nível base:', nivelBase, 'resultado:', nivelConfig);
    }
    
    console.log('⚙️ Configuração do nível encontrada:', nivelConfig);
    
    if (!nivelConfig) {
      console.log('❌ Nível não encontrado:', nivel);
      return 8; // Meta padrão se não encontrar
    }
    
    // Para SDRs, usar meta_vendas_cursos. Para verificar qual campo usar:
    // - SDR inbound: meta_semanal_inbound (para agendamentos) e meta_vendas_cursos (para vendas)
    // - SDR outbound: meta_semanal_outbound (para agendamentos) e meta_vendas_cursos (para vendas)
    const meta = nivelConfig.meta_vendas_cursos || 8;
    console.log('📈 Meta de vendas de cursos encontrada:', meta);
    
    return meta;
  };

  // Calcular a semana atual
  const getSemanaAtual = (): number => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
    const diasDoAno = Math.floor((hoje.getTime() - primeiroDia.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((diasDoAno + primeiroDia.getDay() + 1) / 7);
  };

  // Obter semanas do mês (quarta a terça) - só conta semanas cuja terça-feira final está no mês
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    
    console.log(`📅 Calculando semanas para ${mes}/${ano} - regra: semana pertence ao mês da terça-feira final`);
    
    // Primeiro e último dia do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    console.log(`📅 Período do mês: ${primeiroDia.toLocaleDateString('pt-BR')} - ${ultimoDia.toLocaleDateString('pt-BR')}`);
    
    // Encontrar todas as terças-feiras do mês (fins de semana)
    let dataAtual = new Date(primeiroDia);
    
    // Encontrar a primeira terça-feira do mês
    while (dataAtual.getDay() !== 2) { // 2 = terça-feira
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    let numeroSemana = 1;
    
    // Percorrer todas as terças-feiras que estão no mês
    while (dataAtual.getMonth() === mes - 1 && dataAtual <= ultimoDia) {
      semanas.push(numeroSemana);
      console.log(`✅ Semana ${numeroSemana} pertence ao mês ${mes}/${ano} - termina na terça ${dataAtual.toLocaleDateString('pt-BR')}`);
      numeroSemana++;
      
      // Ir para a próxima terça-feira (7 dias depois)
      dataAtual.setDate(dataAtual.getDate() + 7);
    }
    
    console.log(`📅 Semanas válidas para ${mes}/${ano}:`, semanas);
    return semanas;
  };

  // Obter data de início da semana (quarta-feira) - baseado na terça-feira final do mês
  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    console.log(`📅 Calculando início da semana ${numeroSemana} para ${mes}/${ano} - baseado na terça final`);
    
    // Encontrar a terça-feira final da semana especificada no mês
    let dataAtual = new Date(ano, mes - 1, 1);
    
    // Encontrar a primeira terça-feira do mês
    while (dataAtual.getDay() !== 2) { // 2 = terça-feira
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Avançar para a terça-feira da semana especificada
    dataAtual.setDate(dataAtual.getDate() + (numeroSemana - 1) * 7);
    
    // Garantir que a terça-feira está no mês correto
    if (dataAtual.getMonth() !== mes - 1) {
      console.log(`⚠️ Terça da semana ${numeroSemana} sai do mês ${mes}, usando última semana válida`);
      // Se passou do mês, voltar para a última semana válida
      dataAtual.setDate(dataAtual.getDate() - 7);
    }
    
    // Calcular a quarta-feira anterior (6 dias antes da terça)
    const inicioSemana = new Date(dataAtual);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);
    
    console.log(`📅 Semana ${numeroSemana}: Quarta ${inicioSemana.toLocaleDateString('pt-BR')} até Terça ${dataAtual.toLocaleDateString('pt-BR')}`);
    
    return inicioSemana;
  };

  // Obter data de fim da semana (terça-feira) - baseado na terça-feira final do mês
  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    console.log(`📅 Calculando fim da semana ${numeroSemana} para ${mes}/${ano} - terça final`);
    
    // Encontrar a terça-feira final da semana especificada no mês
    let dataAtual = new Date(ano, mes - 1, 1);
    
    // Encontrar a primeira terça-feira do mês
    while (dataAtual.getDay() !== 2) { // 2 = terça-feira
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Avançar para a terça-feira da semana especificada
    dataAtual.setDate(dataAtual.getDate() + (numeroSemana - 1) * 7);
    
    // Garantir que a terça-feira está no mês correto
    if (dataAtual.getMonth() !== mes - 1) {
      console.log(`⚠️ Terça da semana ${numeroSemana} sai do mês ${mes}, usando última semana válida`);
      // Se passou do mês, voltar para a última semana válida
      dataAtual.setDate(dataAtual.getDate() - 7);
    }
    
    dataAtual.setHours(23, 59, 59, 999);
    
    console.log(`📅 Fim da semana ${numeroSemana}: ${dataAtual.toLocaleDateString('pt-BR')} (terça-feira final)`);
    return dataAtual;
  };

  return {
    loading,
    getMetaSemanalSDR,
    getMetaPadraoSDR,
    getSemanaAtual,
    getSemanasDoMes,
    getDataInicioSemana,
    getDataFimSemana,
  };
};