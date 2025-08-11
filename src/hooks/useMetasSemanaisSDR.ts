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
    
    if (!nivelCompleto) {
      console.log('❌ getMetaSemanalSDR: Nível completo não encontrado');
      return undefined;
    }
    
    const metaCursos = getMetaPadraoSDR(nivelCompleto);
    
    const resultado = {
      id: `${vendedorId}-${ano}-${semana}`,
      vendedor_id: vendedorId,
      ano,
      semana,
      meta_vendas_cursos: metaCursos, // Mudança: agora representa vendas de cursos
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

  // Obter semanas do mês (quarta a terça) - só conta semanas que terminam no mês
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    
    console.log(`📅 Calculando semanas para ${mes}/${ano}`);
    
    // Encontrar todas as terças-feiras do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    // Começar pelo primeiro dia do mês e encontrar todas as terças
    let dataAtual = new Date(primeiroDia);
    let numeroSemana = 1;
    
    // Percorrer todos os dias do mês
    while (dataAtual <= ultimoDia) {
      // Se for terça-feira (dia 2)
      if (dataAtual.getDay() === 2) {
        semanas.push(numeroSemana);
        console.log(`✅ Semana ${numeroSemana} termina em ${dataAtual.toLocaleDateString('pt-BR')}`);
        numeroSemana++;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    console.log(`📅 Semanas válidas para ${mes}/${ano}:`, semanas);
    return semanas;
  };

  // Obter data de início da semana (quarta-feira)
  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    // Encontrar a terça-feira correspondente à semana
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    let tercaEncontrada = 0;
    let dataAtual = new Date(primeiroDia);
    
    // Encontrar a terça-feira da semana especificada
    while (dataAtual <= ultimoDia) {
      if (dataAtual.getDay() === 2) { // Terça-feira
        tercaEncontrada++;
        if (tercaEncontrada === numeroSemana) {
          // Encontrou a terça correta, agora calcular a quarta anterior
          const inicioSemana = new Date(dataAtual);
          inicioSemana.setDate(inicioSemana.getDate() - 6); // Voltar 6 dias para a quarta anterior
          inicioSemana.setHours(0, 0, 0, 0);
          return inicioSemana;
        }
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Fallback se não encontrar
    return new Date(ano, mes - 1, 1);
  };

  // Obter data de fim da semana (terça-feira)
  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    // Encontrar a terça-feira correspondente à semana
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    let tercaEncontrada = 0;
    let dataAtual = new Date(primeiroDia);
    
    // Encontrar a terça-feira da semana especificada
    while (dataAtual <= ultimoDia) {
      if (dataAtual.getDay() === 2) { // Terça-feira
        tercaEncontrada++;
        if (tercaEncontrada === numeroSemana) {
          // Encontrou a terça correta
          const fimSemana = new Date(dataAtual);
          fimSemana.setHours(23, 59, 59, 999);
          return fimSemana;
        }
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    // Fallback se não encontrar
    return new Date(ano, mes, 0);
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