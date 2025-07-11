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

  // Função para obter a semana atual do mês (não do ano)
  const getSemanaAtual = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Usar a mesma lógica do admin para calcular semanas do mês
    const semanas = getSemanasDoMes(currentYear, currentMonth);
    
    // Encontrar em qual semana do mês estamos
    for (let i = 0; i < semanas.length; i++) {
      const semana = semanas[i];
      const inicioSemana = getDataInicioSemana(currentYear, currentMonth, semana);
      const fimSemana = getDataFimSemana(currentYear, currentMonth, semana);
      
      if (now >= inicioSemana && now <= fimSemana) {
        return semana;
      }
    }
    
    return 1; // fallback para primeira semana
  };

  // Função para obter todas as semanas de um mês (semanas do mês, não do ano)
  const getSemanasDoMes = (ano: number, mes: number) => {
    const firstDay = new Date(ano, mes - 1, 1);
    const lastDay = new Date(ano, mes, 0);
    
    // Encontrar a primeira quarta-feira
    let firstWednesday = new Date(firstDay);
    while (firstWednesday.getDay() !== 3) { // 3 = Wednesday
      firstWednesday.setDate(firstWednesday.getDate() + 1);
    }
    
    // Contar semanas completas
    const weeks = [];
    let currentWednesday = new Date(firstWednesday);
    let weekNumber = 1;
    
    while (currentWednesday <= lastDay) {
      const weekEnd = new Date(currentWednesday);
      weekEnd.setDate(weekEnd.getDate() + 6); // Próxima terça-feira
      
      weeks.push(weekNumber);
      weekNumber++;
      currentWednesday.setDate(currentWednesday.getDate() + 7);
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