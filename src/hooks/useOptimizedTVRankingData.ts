import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isVendaInPeriod, getMesAnoSemanaAtual } from '@/utils/semanaUtils';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

interface VendedorData {
  id: string;
  name: string;
  weeklySales: number;
  weeklyTarget: number;
  avatar: string;
  points: number;
  isSDR: boolean;
  nivel?: string;
  reunioesSemana?: number;
  metaReunioesSemanais?: number;
  taxaConversaoSemanal?: number;
}

interface OptimizedTVRankingData {
  vendedoresData: VendedorData[];
  isLoading: boolean;
  error: any;
  lastUpdated: string;
}

/**
 * Hook otimizado para dados do TV Ranking público
 * - Cache agressivo de 5 minutos (staleTime)
 * - Apenas dados essenciais para reduzir egress
 * - Queries simplificadas sem JOINs complexos
 */
export const useOptimizedTVRankingData = (): OptimizedTVRankingData => {
  const { mes: currentMonth, ano: currentYear } = getMesAnoSemanaAtual();
  const currentWeek = 1; // Semana simplificada para TV público

  // Query otimizada para vendas matriculadas apenas
  const { data: vendas = [], isLoading: vendasLoading } = useQuery({
    queryKey: ['optimized-tv-vendas', currentYear, currentMonth, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_entries')
        .select(`
          id,
          vendedor_id,
          pontuacao_validada,
          data_aprovacao,
          data_assinatura_contrato,
          enviado_em,
          status,
          curso_id
        `)
        .eq('status', 'matriculado') // Apenas matriculados para reduzir dados
        .order('data_aprovacao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos de cache ultra-agressivo para TV
    gcTime: 30 * 60 * 1000, // 30 minutos no cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query otimizada para vendedores ativos apenas
  const { data: vendedores = [], isLoading: vendedoresLoading } = useQuery({
    queryKey: ['optimized-tv-vendedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          photo_url,
          user_type,
          nivel,
          ativo
        `)
        .eq('ativo', true)
        .in('user_type', ['vendedor', 'sdr', 'sdr_inbound', 'sdr_outbound']);

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos de cache ultra-agressivo
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query otimizada para metas semanais apenas da semana atual
  const { data: metasSemanais = [], isLoading: metasLoading } = useQuery({
    queryKey: ['optimized-tv-metas', currentYear, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_semanais_vendedores')
        .select(`
          vendedor_id,
          meta_vendas,
          ano,
          semana
        `)
        .eq('ano', currentYear)
        .eq('semana', currentWeek);

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos de cache ultra-agressivo
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query simplificada para agendamentos apenas da semana atual
  const { data: agendamentos = [], isLoading: agendamentosLoading } = useQuery({
    queryKey: ['optimized-tv-agendamentos', currentYear, currentWeek],
    queryFn: async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 3); // Quarta-feira
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Terça-feira

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          sdr_id,
          vendedor_id,
          data_agendamento,
          resultado_reuniao,
          status
        `)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString())
        .in('resultado_reuniao', ['presente', 'compareceu', 'realizada']);

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos de cache ultra-agressivo
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Processamento otimizado dos dados
  const vendedoresData: VendedorData[] = vendedores.map(vendedor => {
    const isSDR = ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(vendedor.user_type);
    
    // Vendas da semana atual
    const vendasSemana = vendas.filter(venda => {
      if (venda.vendedor_id !== vendedor.id) return false;
      const dataEfetiva = getDataEfetivaVenda(venda);
      return isVendaInPeriod(dataEfetiva, currentMonth, currentYear);
    });

    const weeklySales = vendasSemana.reduce((sum, venda) => sum + (venda.pontuacao_validada || 0), 0);
    
    // Meta semanal
    const metaSemanal = metasSemanais.find(meta => meta.vendedor_id === vendedor.id);
    const weeklyTarget = metaSemanal?.meta_vendas || 0;

    // Para SDRs, calcular reuniões da semana
    let reunioesSemana = 0;
    let metaReunioesSemanais = 0;
    let taxaConversaoSemanal = 0;

    if (isSDR) {
      reunioesSemana = agendamentos.filter(ag => 
        ag.sdr_id === vendedor.id || ag.vendedor_id === vendedor.id
      ).length;

      // Meta simplificada baseada no nível
      metaReunioesSemanais = vendedor.nivel === 'senior' ? 15 : 
                           vendedor.nivel === 'pleno' ? 12 : 10;

      // Taxa de conversão simplificada
      const totalReunioes = Math.max(reunioesSemana, 1);
      taxaConversaoSemanal = (vendasSemana.length / totalReunioes) * 100;
    }

    return {
      id: vendedor.id,
      name: vendedor.name,
      weeklySales: isSDR ? vendasSemana.length : weeklySales,
      weeklyTarget,
      avatar: vendedor.photo_url || '',
      points: weeklySales,
      isSDR,
      nivel: vendedor.nivel,
      reunioesSemana,
      metaReunioesSemanais,
      taxaConversaoSemanal: isSDR ? taxaConversaoSemanal : undefined,
    };
  });

  const isLoading = vendasLoading || vendedoresLoading || metasLoading || agendamentosLoading;
  const error = null; // Simplificado para TV público

  const lastUpdated = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    vendedoresData,
    isLoading,
    error,
    lastUpdated,
  };
};