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
  const { profile } = useAuthStore();

  // Buscar meta semanal específica do SDR baseada no tipo de usuário
  const getMetaSemanalSDR = (vendedorId: string, ano: number, semana: number): MetaSemanalSDR | undefined => {
    if (!profile?.user_type) return undefined;
    
    const metaAgendamentos = getMetaPadraoSDR(profile.user_type);
    
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
    const nivelConfig = niveis.find(n => n.nivel === nivel);
    
    if (nivel.includes('inbound')) {
      return nivelConfig?.meta_semanal_inbound || 0;
    } else if (nivel.includes('outbound')) {
      return nivelConfig?.meta_semanal_outbound || 0;
    }
    
    return 0;
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