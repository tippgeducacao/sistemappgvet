import { useState, useEffect } from 'react';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';

export interface MetaSemanalSDR {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas_cursos: number; // Para SDRs: representa meta de reuniões semanais (inbound/outbound)
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useMetasSemanaisSDR = () => {
  const [loading, setLoading] = useState(false);
  const [metasPersonalizadas, setMetasPersonalizadas] = useState<any[]>([]);
  const { niveis } = useNiveis();
  const { profile, currentUser } = useAuthStore();

  // Buscar metas personalizadas da tabela
  useEffect(() => {
    const fetchMetasPersonalizadas = async () => {
      try {
        const { data, error } = await supabase
          .from('metas_semanais_vendedores')
          .select('*');
        
        if (error) throw error;
        setMetasPersonalizadas(data || []);
      } catch (error) {
        console.error('Erro ao buscar metas personalizadas:', error);
      }
    };

    fetchMetasPersonalizadas();
  }, []);

  // Buscar meta semanal específica do SDR baseada primeiro na tabela, depois no nível
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
    
    // PRIMEIRO: Verificar se existe meta personalizada na tabela
    const metaPersonalizada = metasPersonalizadas.find(meta => 
      meta.vendedor_id === vendedorId && 
      meta.ano === ano && 
      meta.semana === semana
    );
    
    if (metaPersonalizada) {
      console.log('✅ Meta personalizada encontrada na tabela:', metaPersonalizada.meta_vendas);
      const resultado = {
        id: metaPersonalizada.id,
        vendedor_id: vendedorId,
        ano,
        semana,
        meta_vendas_cursos: metaPersonalizada.meta_vendas, // Esta é a meta de reuniões na tabela personalizada
        created_at: metaPersonalizada.created_at,
        updated_at: metaPersonalizada.updated_at,
      };
      
      console.log('✅ getMetaSemanalSDR: Meta personalizada retornada', resultado);
      return resultado;
    }
    
    // SEGUNDO: Se não tem meta personalizada, usar padrão do nível (META DE REUNIÕES)
    const nivel = (profile as any)?.nivel || 'junior';
    console.log('🔍 Buscando meta padrão de REUNIÕES para SDR nível:', nivel);
    
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    
    // Para SDRs, usar meta de reuniões baseada no tipo
    let metaReunioes = 0;
    if (userType?.includes('inbound') || userType === 'sdr') {
      metaReunioes = nivelConfig?.meta_semanal_inbound || 55; // Meta padrão para inbound
      console.log('📊 Meta padrão de reuniões INBOUND encontrada:', metaReunioes, 'para nível:', nivel);
    } else if (userType?.includes('outbound')) {
      metaReunioes = nivelConfig?.meta_semanal_outbound || 50; // Meta padrão para outbound
      console.log('📊 Meta padrão de reuniões OUTBOUND encontrada:', metaReunioes, 'para nível:', nivel);
    } else {
      // SDR genérico - usar inbound como padrão
      metaReunioes = nivelConfig?.meta_semanal_inbound || 55;
      console.log('📊 Meta padrão de reuniões (genérico) encontrada:', metaReunioes, 'para nível:', nivel);
    }
    
    const resultado = {
      id: `${vendedorId}-${ano}-${semana}`,
      vendedor_id: vendedorId,
      ano,
      semana,
      meta_vendas_cursos: metaReunioes, // Usando este campo para armazenar meta de reuniões
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('✅ getMetaSemanalSDR: Meta padrão de REUNIÕES retornada', resultado);
    return resultado;
  };

  // Obter a meta padrão baseada no nível do SDR (agora para reuniões)
  const getMetaPadraoSDR = (nivel: string): number => {
    console.log('🔍 Buscando meta de reuniões para nível:', nivel);
    console.log('📊 Níveis disponíveis:', niveis);
    
    // Primeiro tentar buscar exato (ex: sdr_junior)
    let nivelConfig = niveis.find(n => n.nivel === nivel);
    
    // Se não encontrar, tentar com o nível base (sem sdr_)
    if (!nivelConfig && nivel.includes('sdr_')) {
      const nivelBase = nivel.replace('sdr_', '');
      nivelConfig = niveis.find(n => n.nivel === nivelBase && n.tipo_usuario === 'sdr');
      console.log('⚙️ Tentando buscar nível base:', nivelBase, 'resultado:', nivelConfig);
    }
    
    console.log('⚙️ Configuração do nível encontrada:', nivelConfig);
    
    if (!nivelConfig) {
      console.log('❌ Nível não encontrado:', nivel);
      return 55; // Meta padrão de reuniões se não encontrar
    }
    
    // Para SDRs, usar meta de reuniões (inbound por padrão):
    // - SDR inbound: meta_semanal_inbound (para agendamentos/reuniões)
    // - SDR outbound: meta_semanal_outbound (para agendamentos/reuniões)
    const meta = nivelConfig.meta_semanal_inbound || 55;
    console.log('📈 Meta de reuniões encontrada:', meta);
    
    return meta;
  };

  // Calcular a semana atual
  const getSemanaAtual = (): number => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), 0, 1);
    const diasDoAno = Math.floor((hoje.getTime() - primeiroDia.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((diasDoAno + primeiroDia.getDay() + 1) / 7);
  };

  // Obter semanas do mês - REGRA: semana pertence ao mês onde sua TERÇA-FEIRA FINAL cai
  const getSemanasDoMes = (ano: number, mes: number): number[] => {
    const semanas: number[] = [];
    
    console.log(`📅 Calculando semanas para ${mes}/${ano} - REGRA: semana pertence ao mês da terça final`);
    
    // Encontrar todas as terças-feiras que estão DENTRO do mês selecionado
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    console.log(`📅 Analisando período: ${primeiroDia.toLocaleDateString('pt-BR')} - ${ultimoDia.toLocaleDateString('pt-BR')}`);
    
    // Começar da primeira terça-feira do mês (ela será o fim da primeira semana)
    let tercaAtual = new Date(primeiroDia);
    while (tercaAtual.getDay() !== 2) { // 2 = terça-feira
      tercaAtual.setDate(tercaAtual.getDate() + 1);
    }
    
    let numeroSemana = 1;
    
    // Para cada terça-feira que está no mês, criar uma semana
    while (tercaAtual.getMonth() === mes - 1 && tercaAtual <= ultimoDia) {
      semanas.push(numeroSemana);
      
      // Calcular a quarta-feira que inicia esta semana (6 dias antes da terça)
      const quartaInicio = new Date(tercaAtual);
      quartaInicio.setDate(quartaInicio.getDate() - 6);
      
      console.log(`✅ Semana ${numeroSemana} do mês ${mes}/${ano}: ${quartaInicio.toLocaleDateString('pt-BR')} (quarta) até ${tercaAtual.toLocaleDateString('pt-BR')} (terça)`);
      
      numeroSemana++;
      
      // Próxima terça-feira (7 dias depois)
      tercaAtual.setDate(tercaAtual.getDate() + 7);
    }
    
    console.log(`📅 Total de semanas válidas para ${mes}/${ano}:`, semanas.length);
    return semanas;
  };

  // Obter data de início da semana (quarta-feira) - LÓGICA ORIGINAL RESTAURADA
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
      // Se saiu do mês, usar a última terça do mês
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

  // Obter data de fim da semana (terça-feira) - LÓGICA ORIGINAL RESTAURADA
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
      // Se saiu do mês, usar a última terça do mês
      dataAtual = new Date(ultimoDia);
      while (dataAtual.getDay() !== 2) {
        dataAtual.setDate(dataAtual.getDate() - 1);
      }
    }
    
    dataAtual.setHours(23, 59, 59, 999);
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