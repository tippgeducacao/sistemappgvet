import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MetasSemanaisService } from '@/services/metas/MetasSemanaisService';

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

  const syncMetasWithNivel = async (vendedorId: string, ano: number, mes: number) => {
    try {
      console.log(`🔄 Sincronizando metas com nível atual para vendedor ${vendedorId}, período: ${mes}/${ano}`);
      const metasAtualizadas = await MetasSemanaisService.criarMetasSemanaisAutomaticamente(vendedorId, ano, mes);
      
      // Atualizar estado local com as metas sincronizadas
      setMetasSemanais(prev => {
        const metasFiltered = prev.filter(meta => 
          !(meta.vendedor_id === vendedorId && meta.ano === ano && 
            MetasSemanaisService.getSemanasDoMes(ano, mes).includes(meta.semana))
        );
        return [...metasFiltered, ...metasAtualizadas];
      });
      
      console.log(`✅ Metas sincronizadas: ${metasAtualizadas.length} metas`);
      return metasAtualizadas;
    } catch (error) {
      console.error('Erro ao sincronizar metas:', error);
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
    console.log(`🗓️ Dia da semana: ${now.getDay()} (0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)`);
    
    // USAR A MESMA LÓGICA DE getMesAnoSemanaAtual: próxima terça que encerra a semana
    let tercaQueEncerra = new Date(now);
    
    if (tercaQueEncerra.getDay() === 2) {
      // Hoje é terça-feira - a semana termina hoje
      console.log(`📅 Hoje é terça-feira, semana termina hoje: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    } else {
      // Encontrar a próxima terça-feira (que encerra a semana atual)
      const diasAteTerca = (2 - tercaQueEncerra.getDay() + 7) % 7;
      const diasParaSomar = diasAteTerca === 0 ? 7 : diasAteTerca;
      tercaQueEncerra.setDate(tercaQueEncerra.getDate() + diasParaSomar);
      console.log(`📅 Próxima terça que encerra semana: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    }
    
    // O mês/ano da semana é baseado na terça-feira que encerra a semana
    const mesReferencia = tercaQueEncerra.getMonth() + 1;
    const anoReferencia = tercaQueEncerra.getFullYear();
    
    console.log(`📅 Mês/Ano de referência baseado na terça que encerra: ${mesReferencia}/${anoReferencia}`);
    
    // Verificar período da semana para validação
    const inicioSemana = new Date(tercaQueEncerra);
    inicioSemana.setDate(inicioSemana.getDate() - 6); // Quarta-feira anterior
    const fimSemana = new Date(tercaQueEncerra);
    fimSemana.setHours(23, 59, 59, 999);
    
    console.log(`🔍 Período da semana: ${inicioSemana.toLocaleDateString('pt-BR')} até ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    console.log(`🔍 Data atual está no período? ${now >= inicioSemana && now <= fimSemana}`);
    
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
    const diffTime = tercaQueEncerra.getTime() - primeiraTerca.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const semanaNumero = Math.floor(diffDays / 7) + 1;
    
    console.log(`🔢 Diferença em dias: ${diffDays}, Semana calculada: ${semanaNumero}`);
    console.log(`✅ Semana ${semanaNumero} do mês ${mesReferencia}/${anoReferencia}`);
    
    return semanaNumero;
  };

  // Função para obter todas as semanas de um mês (baseado no término da semana - terça-feira)
  const getSemanasDoMes = (ano: number, mes: number) => {
    // Encontrar a primeira terça-feira do mês
    let primeiraTerca = new Date(ano, mes - 1, 1);
    while (primeiraTerca.getDay() !== 2) { // 2 = Tuesday
      primeiraTerca.setDate(primeiraTerca.getDate() + 1);
    }
    
    // Para agosto 2025: primeira terça é dia 5, que é uma data OK (não > 7)
    // Então não vamos ajustar para semana anterior
    const weeks = [];
    let currentTuesday = new Date(primeiraTerca);
    let weekNumber = 1;
    
    // Incluir semanas que terminam no mês
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
    
    // Calcular a terça-feira da semana desejada (fim da semana)
    const fimSemana = new Date(primeiraTerca);
    fimSemana.setDate(fimSemana.getDate() + (numeroSemana - 1) * 7);
    
    return fimSemana;
  };

  // Função para obter o mês e ano da semana atual (baseado na terça-feira que encerra a semana)
  const getMesAnoSemanaAtual = () => {
    const now = new Date();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    console.log(`🔥 TESTE CRÍTICO - Data exata agora:`, now);
    console.log(`🔥 TESTE CRÍTICO - Dia da semana: ${now.getDay()} (${diasSemana[now.getDay()]})`);
    
    // Encontrar a terça-feira que encerra a semana atual
    let tercaQueEncerra = new Date(now);
    
    if (tercaQueEncerra.getDay() === 2) {
      // Hoje é terça-feira - a semana termina hoje
      console.log(`🔥 HOJE É TERÇA - Semana termina hoje: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    } else {
      // Encontrar a próxima terça-feira (que encerra a semana atual)
      const diasAteTerca = (2 - tercaQueEncerra.getDay() + 7) % 7;
      const diasParaSomar = diasAteTerca === 0 ? 7 : diasAteTerca;
      
      console.log(`🔥 CÁLCULO - Dias até próxima terça: ${diasParaSomar}`);
      console.log(`🔥 ANTES - Data antes de somar: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
      
      tercaQueEncerra.setDate(tercaQueEncerra.getDate() + diasParaSomar);
      
      console.log(`🔥 DEPOIS - Próxima terça que encerra: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    }
    
    // O mês/ano da semana é determinado pela terça-feira (fim da semana)
    const mesReferencia = tercaQueEncerra.getMonth() + 1;
    const anoReferencia = tercaQueEncerra.getFullYear();
    
    console.log(`🔥 RESULTADO FINAL - Mês: ${mesReferencia}, Ano: ${anoReferencia}`);
    console.log(`🔥 VERIFICAÇÃO - Terça que encerra está em: ${tercaQueEncerra.toLocaleDateString('pt-BR')}`);
    
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
    syncMetasWithNivel,
    getMetaSemanalVendedor,
    getSemanaAtual,
    getMesAnoSemanaAtual,
    getSemanasDoMes,
    getDataInicioSemana,
    getDataFimSemana
  };
};