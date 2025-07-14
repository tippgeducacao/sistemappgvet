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
    
    // Obter todas as semanas do mês atual
    const semanas = getSemanasDoMes(currentYear, currentMonth);
    
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(currentYear, currentMonth - 1, 1);
    while (primeiraTerca.getDay() !== 2) {
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Verificar se precisamos incluir semana anterior
    if (primeiraTerca.getDate() > 7) {
      const tercaAnterior = new Date(primeiraTerca);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      const quartaAnterior = new Date(tercaAnterior);
      quartaAnterior.setDate(quartaAnterior.getDate() - 6);
      
      if (quartaAnterior.getMonth() !== currentMonth - 1) {
        primeiraTerca = tercaAnterior;
      }
    }
    
    // Encontrar em qual semana estamos baseado na terça-feira
    for (let i = 0; i < semanas.length; i++) {
      const inicioSemana = new Date(primeiraTerca);
      inicioSemana.setDate(inicioSemana.getDate() + (i * 7) - 6); // Quarta-feira
      
      const fimSemana = new Date(primeiraTerca);
      fimSemana.setDate(fimSemana.getDate() + (i * 7)); // Terça-feira
      
      if (now >= inicioSemana && now <= fimSemana) {
        return semanas[i];
      }
    }
    
    return 1; // fallback para primeira semana
  };

  // Função para obter todas as semanas de um mês (baseado no término da semana - terça-feira)
  const getSemanasDoMes = (ano: number, mes: number) => {
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) { // 2 = Tuesday
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Encontrar a última terça-feira do mês
    let ultimaTerca = new Date(ano, mes, 0); // Último dia do mês
    while (ultimaTerca.getDay() !== 2) { // 2 = Tuesday
      ultimaTerca.setDate(ultimaTerca.getDate() - 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // verificar se existe uma semana anterior que termina neste mês
    if (primeiraTerca.getDate() > 7) {
      const tercaAnterior = new Date(primeiraTerca);
      tercaAnterior.setDate(tercaAnterior.getDate() - 7);
      
      // A quarta-feira da semana anterior
      const quartaAnterior = new Date(tercaAnterior);
      quartaAnterior.setDate(quartaAnterior.getDate() - 6);
      
      // Se a quarta anterior não está no mês atual, a semana termina no mês atual
      if (quartaAnterior.getMonth() !== mes - 1) {
        primeiraTerca = tercaAnterior;
      }
    }
    
    const weeks = [];
    let currentTuesday = new Date(primeiraTerca);
    let weekNumber = 1;
    
    // Só incluir semanas que realmente terminam no mês atual
    while (currentTuesday.getMonth() === mes - 1 && currentTuesday.getFullYear() === ano) {
      weeks.push(weekNumber);
      weekNumber++;
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return weeks;
  };

  // Função auxiliar para obter data de início da semana
  const getDataInicioSemana = (ano: number, mes: number, numeroSemana: number) => {
    const firstDay = new Date(ano, mes - 1, 1);
    
    let firstWednesday = new Date(firstDay);
    while (firstWednesday.getDay() !== 3) {
      firstWednesday.setDate(firstWednesday.getDate() + 1);
    }
    
    const targetWednesday = new Date(firstWednesday);
    targetWednesday.setDate(targetWednesday.getDate() + (numeroSemana - 1) * 7);
    
    return targetWednesday;
  };

  // Função auxiliar para obter data de fim da semana
  const getDataFimSemana = (ano: number, mes: number, numeroSemana: number) => {
    const inicioSemana = getDataInicioSemana(ano, mes, numeroSemana);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);
    
    const lastDay = new Date(ano, mes, 0);
    return fimSemana > lastDay ? lastDay : fimSemana;
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
    getSemanasDoMes
  };
};