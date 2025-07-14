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
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(currentYear, currentMonth - 1, 1);
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // verificar se existe uma semana anterior que termina neste mês
    if (primeiraTerca.getDate() > 7) {
      const tercaAnterior = new Date(primeiraTerca);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      
      // Se a terça anterior está no mês anterior, ela conta para este mês
      if (tercaAnterior.getMonth() !== currentMonth - 1) {
        primeiraTerca = tercaAnterior;
      }
    }
    
    // Encontrar em qual semana estamos baseado na terça-feira
    let currentTuesday = new Date(primeiraTerca);
    let weekNumber = 1;
    
    while (currentTuesday.getMonth() === currentMonth - 1 && currentTuesday.getFullYear() === currentYear) {
      const inicioSemana = new Date(currentTuesday);
      inicioSemana.setDate(inicioSemana.getDate() - 6); // Quarta-feira anterior
      
      const fimSemana = new Date(currentTuesday); // Terça-feira (fim da semana)
      
      if (now >= inicioSemana && now <= fimSemana) {
        return weekNumber;
      }
      
      weekNumber++;
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return 1; // fallback para primeira semana
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
    
    // Só incluir semanas que terminam no mês, excluindo aquelas muito próximas do fim
    while (currentTuesday.getMonth() === mes - 1 && currentTuesday.getFullYear() === ano) {
      // Aplicar a mesma lógica do backend: excluir se sobram menos de 3 dias ou está muito próximo do fim
      const diasRestantes = (ultimaDataMes.getTime() - currentTuesday.getTime()) / (1000 * 60 * 60 * 24);
      const seisAntes = new Date(ultimaDataMes);
      seisAntes.setDate(seisAntes.getDate() - 6);
      
      if (diasRestantes >= 3 || currentTuesday < seisAntes) {
        weeks.push(weekNumber);
        weekNumber++;
      }
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
    getSemanasDoMes,
    getDataInicioSemana,
    getDataFimSemana
  };
};