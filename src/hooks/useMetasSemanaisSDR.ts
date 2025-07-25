import { useState, useEffect } from 'react';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';

export interface MetaSemanalSDR {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_agendamentos: number;
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
    const userNivel = (currentUser as any)?.nivel;
    if (!userNivel) return undefined;
    
    const metaAgendamentos = getMetaPadraoSDR(userNivel);
    
    return {
      id: `${vendedorId}-${ano}-${semana}`,
      vendedor_id: vendedorId,
      ano,
      semana,
      meta_agendamentos: metaAgendamentos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  // Obter a meta padrão baseada no nível do SDR
  const getMetaPadraoSDR = (nivel: string): number => {
    console.log('🔍 Buscando meta para nível:', nivel);
    console.log('📊 Níveis disponíveis:', niveis);
    
    const nivelConfig = niveis.find(n => n.nivel === nivel);
    console.log('⚙️ Configuração do nível encontrada:', nivelConfig);
    
    if (!nivelConfig) {
      console.log('❌ Nível não encontrado:', nivel);
      return 0;
    }
    
    let meta = 0;
    
    if (nivel.includes('inbound')) {
      meta = nivelConfig.meta_semanal_inbound || 0;
      console.log('📈 Meta inbound encontrada:', meta);
    } else if (nivel.includes('outbound')) {
      meta = nivelConfig.meta_semanal_outbound || 0;
      console.log('📈 Meta outbound encontrada:', meta);
    } else {
      // Para vendedores normais, usar meta_semanal_vendedor
      meta = nivelConfig.meta_semanal_vendedor || 0;
      console.log('📈 Meta vendedor encontrada:', meta);
    }
    
    return meta;
  };

  // Calcular a semana atual
  const getSemanaAtual = (): number => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
    const diasDoAno = Math.floor((hoje.getTime() - primeiroDia.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((diasDoAno + primeiroDia.getDay() + 1) / 7);
  };

  // Obter semanas do mês (quarta a terça)
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    // Encontrar a primeira quarta-feira do mês
    let primeiraQuarta = new Date(primeiroDia);
    while (primeiraQuarta.getDay() !== 3) { // 3 = quarta-feira
      primeiraQuarta.setDate(primeiraQuarta.getDate() + 1);
    }
    
    // Se a primeira quarta-feira é depois do dia 7, voltar uma semana
    if (primeiraQuarta.getDate() > 7) {
      primeiraQuarta.setDate(primeiraQuarta.getDate() - 7);
    }
    
    let semanaAtual = new Date(primeiraQuarta);
    let numeroSemana = 1;
    
    while (semanaAtual.getMonth() === mes - 1 || 
           (semanaAtual.getMonth() === mes && semanaAtual.getDate() <= 6)) {
      semanas.push(numeroSemana);
      numeroSemana++;
      semanaAtual.setDate(semanaAtual.getDate() + 7);
    }
    
    return semanas;
  };

  // Obter data de início da semana (quarta-feira)
  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    const primeiroDia = new Date(ano, mes - 1, 1);
    let primeiraQuarta = new Date(primeiroDia);
    
    while (primeiraQuarta.getDay() !== 3) {
      primeiraQuarta.setDate(primeiraQuarta.getDate() + 1);
    }
    
    if (primeiraQuarta.getDate() > 7) {
      primeiraQuarta.setDate(primeiraQuarta.getDate() - 7);
    }
    
    const dataInicio = new Date(primeiraQuarta);
    dataInicio.setDate(dataInicio.getDate() + (numeroSemana - 1) * 7);
    dataInicio.setHours(0, 0, 0, 0);
    
    return dataInicio;
  };

  // Obter data de fim da semana (terça-feira)
  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number): Date => {
    const dataInicio = getDataInicioSemana(ano, mes, numeroSemana);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 6);
    dataFim.setHours(23, 59, 59, 999);
    
    return dataFim;
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