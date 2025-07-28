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
    // Combinar user_type e nivel para formar o nível completo
    const userType = profile?.user_type;
    const nivel = (currentUser as any)?.nivel || (profile as any)?.nivel || 'junior';
    
    let nivelCompleto = '';
    if (userType === 'sdr_inbound') {
      nivelCompleto = `sdr_inbound_${nivel}`;
    } else if (userType === 'sdr_outbound') {
      nivelCompleto = `sdr_outbound_${nivel}`;
    } else {
      nivelCompleto = nivel; // Para vendedores normais
    }
    
    console.log('🔍 getMetaSemanalSDR: Buscando meta', { 
      vendedorId, 
      ano, 
      semana, 
      userType,
      nivel,
      nivelCompleto,
      currentUser: currentUser ? { id: currentUser.id, user_type: (currentUser as any).user_type } : null,
      profile: profile ? { id: profile.id, user_type: profile.user_type, nivel: (profile as any).nivel } : null 
    });
    
    if (!nivelCompleto) {
      console.log('❌ getMetaSemanalSDR: Nível completo não encontrado');
      return undefined;
    }
    
    const metaAgendamentos = getMetaPadraoSDR(nivelCompleto);
    
    const resultado = {
      id: `${vendedorId}-${ano}-${semana}`,
      vendedor_id: vendedorId,
      ano,
      semana,
      meta_agendamentos: metaAgendamentos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ getMetaSemanalSDR: Meta encontrada', resultado);
    return resultado;
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

  // Obter semanas do mês (quarta a terça) - só conta semanas que terminam no mês
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    const ultimoDia = new Date(ano, mes, 0); // Último dia do mês
    
    console.log(`📅 Calculando semanas para ${mes}/${ano}`);
    
    // Encontrar a primeira terça-feira do mês
    let primeiraSegunda = new Date(ano, mes - 1, 1);
    while (primeiraSegunda.getDay() !== 1) { // 1 = segunda-feira
      primeiraSegunda.setDate(primeiraSegunda.getDate() + 1);
    }
    
    // A semana vai da quarta anterior à terça
    let inicioSemana = new Date(primeiraSegunda);
    inicioSemana.setDate(inicioSemana.getDate() - 5); // Voltar para a quarta anterior
    
    let numeroSemana = 1;
    
    while (true) {
      // Calcular o fim da semana (terça-feira)
      let fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6); // Terça-feira
      
      console.log(`📅 Semana ${numeroSemana}: ${inicioSemana.toLocaleDateString('pt-BR')} - ${fimSemana.toLocaleDateString('pt-BR')} (fim no mês ${fimSemana.getMonth() + 1})`);
      
      // A semana só conta se terminar no mês especificado
      if (fimSemana.getMonth() + 1 === mes && fimSemana.getFullYear() === ano) {
        semanas.push(numeroSemana);
        console.log(`✅ Semana ${numeroSemana} incluída (termina em ${mes}/${ano})`);
      } else if (fimSemana.getMonth() + 1 > mes || fimSemana.getFullYear() > ano) {
        console.log(`❌ Semana ${numeroSemana} não incluída (termina em ${fimSemana.getMonth() + 1}/${fimSemana.getFullYear()})`);
        break; // Parar quando a semana terminar em mês posterior
      }
      
      numeroSemana++;
      inicioSemana.setDate(inicioSemana.getDate() + 7);
      
      // Proteção contra loop infinito
      if (numeroSemana > 10) break;
    }
    
    console.log(`📅 Semanas válidas para ${mes}/${ano}:`, semanas);
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