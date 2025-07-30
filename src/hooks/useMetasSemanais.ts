import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MetaSemanal {
  id: string;
  vendedor_id: string;
  ano: number;
  semana: number;
  meta_vendas: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useMetasSemanais = () => {
  const [metasSemanais, setMetasSemanais] = useState<MetaSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMetasSemanais = async () => {
    try {
      console.log('📋 useMetasSemanais - Iniciando busca de metas semanais...');
      setLoading(true);
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .select('*')
        .order('ano', { ascending: false })
        .order('semana', { ascending: false });

      if (error) throw error;
      console.log('✅ useMetasSemanais - Metas semanais carregadas:', data?.length || 0, 'metas encontradas');
      setMetasSemanais(data || []);
    } catch (error) {
      console.error('Error fetching metas semanais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar metas semanais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMetaSemanal = async (vendedorId: string, ano: number, semana: number, metaVendas: number) => {
    try {
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .insert({
          vendedor_id: vendedorId,
          ano,
          semana,
          meta_vendas: metaVendas,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setMetasSemanais(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating meta semanal:', error);
      throw error;
    }
  };

  const updateMetaSemanal = async (metaId: string, metaVendas: number) => {
    try {
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .update({ meta_vendas: metaVendas })
        .eq('id', metaId)
        .select()
        .single();

      if (error) throw error;
      
      setMetasSemanais(prev => prev.map(meta => 
        meta.id === metaId ? { ...meta, meta_vendas: metaVendas } : meta
      ));
      return data;
    } catch (error) {
      console.error('Error updating meta semanal:', error);
      throw error;
    }
  };

  const getMetaSemanalVendedor = (vendedorId: string, ano: number, semana: number) => {
    return metasSemanais.find(meta => 
      meta.vendedor_id === vendedorId && 
      meta.ano === ano && 
      meta.semana === semana
    );
  };

  // Função para obter a semana atual do mês baseada no término da semana (terça-feira)
  const getSemanaAtual = () => {
    const now = new Date();
    console.log(`🗓️ Data atual: ${now.toLocaleDateString('pt-BR')} (${now.toISOString()})`);
    
    // ESTRATÉGIA: Primeiro encontrar a qual semana a data atual pertence,
    // depois determinar o mês/ano dessa semana baseado na terça-feira (fim da semana)
    
    // Encontrar a terça-feira mais próxima (pode ser anterior ou posterior à data atual)
    let tercaAtual = new Date(now);
    const diasParaTerca = (2 - tercaAtual.getDay() + 7) % 7; // Dias para próxima terça
    const diasDesdeTerca = (tercaAtual.getDay() - 2 + 7) % 7; // Dias desde última terça
    
    // Se hoje é terça-feira, usar hoje. Senão, encontrar a terça mais próxima
    if (tercaAtual.getDay() === 2) {
      // Hoje é terça-feira - usar hoje
      console.log(`📅 Hoje é terça-feira: ${tercaAtual.toLocaleDateString('pt-BR')}`);
    } else if (diasDesdeTerca <= diasParaTerca) {
      // Última terça está mais próxima
      tercaAtual.setDate(tercaAtual.getDate() - diasDesdeTerca);
      console.log(`📅 Terça da semana atual (anterior): ${tercaAtual.toLocaleDateString('pt-BR')}`);
    } else {
      // Próxima terça está mais próxima
      tercaAtual.setDate(tercaAtual.getDate() + diasParaTerca);
      console.log(`📅 Terça da semana atual (posterior): ${tercaAtual.toLocaleDateString('pt-BR')}`);
    }
    
    // Determinar o mês/ano baseado na terça-feira (fim da semana)
    const mesReferencia = tercaAtual.getMonth() + 1;
    const anoReferencia = tercaAtual.getFullYear();
    
    console.log(`📅 Mês/Ano de referência baseado na terça: ${mesReferencia}/${anoReferencia}`);
    
    // Agora calcular qual semana do mês esta terça representa
    // Encontrar a primeira terça-feira do mês de referência
    let primeiraTerca = new Date(anoReferencia, mesReferencia - 1, 1);
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    console.log(`🎯 Primeira terça do mês ${mesReferencia}: ${primeiraTerca.toLocaleDateString('pt-BR')}`);
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // incluir a semana anterior que termina neste mês
    if (primeiraTerca.getDate() > 7) {
      const tercaAnterior = new Date(primeiraTerca);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      console.log(`⏪ Primeira terça está tarde (dia ${primeiraTerca.getDate()}), incluindo terça anterior: ${tercaAnterior.toLocaleDateString('pt-BR')}`);
      primeiraTerca = tercaAnterior;
    }
    
    // Calcular qual semana é a terça atual
    const diffTime = tercaAtual.getTime() - primeiraTerca.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const semanaNumero = Math.floor(diffDays / 7) + 1;
    
    console.log(`🔢 Diferença em dias: ${diffDays}, Semana calculada: ${semanaNumero}`);
    
    // Validar o período da semana
    const inicioSemana = new Date(tercaAtual);
    inicioSemana.setDate(inicioSemana.getDate() - 6); // Quarta-feira anterior
    const fimSemana = new Date(tercaAtual);
    fimSemana.setHours(23, 59, 59, 999);
    
    console.log(`🔍 Validação - Semana ${semanaNumero}: ${inicioSemana.toLocaleDateString('pt-BR')} - ${tercaAtual.toLocaleDateString('pt-BR')}`);
    console.log(`   📋 Data atual (${now.toLocaleDateString('pt-BR')}) está no período? ${now >= inicioSemana && now <= fimSemana}`);
    
    if (now >= inicioSemana && now <= fimSemana) {
      console.log(`✅ Confirmado: Data atual está na semana ${semanaNumero} do mês ${mesReferencia}/${anoReferencia}`);
      return semanaNumero;
    }
    
    console.log(`⚠️ Erro na validação, usando fallback para semana 1`);
    return 1;
  };

  // Função para obter todas as semanas de um mês (baseado no término da semana - terça-feira)
  const getSemanasDoMes = (ano: number, mes: number) => {
    // Último dia do mês
    const ultimaDataMes = new Date(ano, mes, 0);
    
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) { // 2 = Tuesday
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // verificar se existe uma semana anterior que termina neste mês
    if (primeiraTerca.getDate() > 7) {
      const tercaAnterior = new Date(primeiraTerca);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      primeiraTerca = tercaAnterior;
    }
    
    const weeks = [];
    let currentTuesday = new Date(primeiraTerca);
    let weekNumber = 1;
    
    // Só incluir semanas que terminam no mês (todas as terças do mês)
    while (currentTuesday.getMonth() === mes - 1 && currentTuesday.getFullYear() === ano) {
      weeks.push(weekNumber);
      weekNumber++;
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return weeks;
  };

  // Função auxiliar para obter data de início da semana (quarta-feira)
  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number) => {
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês, usar a anterior
    if (primeiraTerca.getDate() > 7) {
      primeiraTerca.setDate(primeiraTerca.getDate() - 7);
    }
    
    // Calcular a terça-feira da semana desejada
    const tercaSemana = new Date(primeiraTerca);
    tercaSemana.setDate(tercaSemana.getDate() + (numeroSemana - 1) * 7);
    
    // Início da semana é a quarta-feira anterior à terça
    const inicioSemana = new Date(tercaSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    
    return inicioSemana;
  };

  // Função auxiliar para obter data de fim da semana (terça-feira)
  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number) => {
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês, usar a anterior
    if (primeiraTerca.getDate() > 7) {
      primeiraTerca.setDate(primeiraTerca.getDate() - 7);
    }
    
    // Calcular a terça-feira da semana desejada (fim da semana)
    const fimSemana = new Date(primeiraTerca);
    fimSemana.setDate(fimSemana.getDate() + (numeroSemana - 1) * 7);
    
    return fimSemana;
  };

  // Função para obter o mês e ano da semana atual (baseado na terça-feira que encerra a semana)
  const getMesAnoSemanaAtual = () => {
    const now = new Date();
    console.log(`🗓️ getMesAnoSemanaAtual - Data atual: ${now.toLocaleDateString('pt-BR')}`);
    
    // Usar a mesma lógica da getSemanaAtual para encontrar a terça-feira de referência
    let tercaAtual = new Date(now);
    const diasParaTerca = (2 - tercaAtual.getDay() + 7) % 7; // Dias para próxima terça
    const diasDesdeTerca = (tercaAtual.getDay() - 2 + 7) % 7; // Dias desde última terça
    
    // Se hoje é terça-feira, usar hoje. Senão, encontrar a terça mais próxima
    if (tercaAtual.getDay() === 2) {
      // Hoje é terça-feira - usar hoje
      console.log(`📅 getMesAnoSemanaAtual - Hoje é terça-feira: ${tercaAtual.toLocaleDateString('pt-BR')}`);
    } else if (diasDesdeTerca <= diasParaTerca) {
      // Última terça está mais próxima
      tercaAtual.setDate(tercaAtual.getDate() - diasDesdeTerca);
      console.log(`📅 getMesAnoSemanaAtual - Terça da semana atual (anterior): ${tercaAtual.toLocaleDateString('pt-BR')}`);
    } else {
      // Próxima terça está mais próxima
      tercaAtual.setDate(tercaAtual.getDate() + diasParaTerca);
      console.log(`📅 getMesAnoSemanaAtual - Terça da semana atual (posterior): ${tercaAtual.toLocaleDateString('pt-BR')}`);
    }
    
    // O mês/ano da semana é determinado pela terça-feira (fim da semana)
    const mesReferencia = tercaAtual.getMonth() + 1;
    const anoReferencia = tercaAtual.getFullYear();
    
    console.log(`📅 getMesAnoSemanaAtual - Mês/Ano baseado na terça: ${mesReferencia}/${anoReferencia}`);
    
    return {
      mes: mesReferencia,
      ano: anoReferencia
    };
  };

  useEffect(() => {
    fetchMetasSemanais();
  }, []);

  return {
    metasSemanais,
    loading,
    fetchMetasSemanais,
    createMetaSemanal,
    updateMetaSemanal,
    getMetaSemanalVendedor,
    getSemanaAtual,
    getMesAnoSemanaAtual,
    getSemanasDoMes,
    getDataInicioSemana,
    getDataFimSemana
  };
};