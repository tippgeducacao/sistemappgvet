import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isVendaInPeriod, getMesAnoSemanaAtual } from '@/utils/semanaUtils';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

interface VendedorProfile {
  id: string;
  name: string;
  photo_url: string;
  user_type: string;
  nivel: string;
  ativo: boolean;
}

interface MetaSemanal {
  vendedor_id: string;
  meta_vendas: number;
  ano: number;
  semana: number;
}

interface VendedoresMetas {
  vendedores: VendedorProfile[];
  metas: MetaSemanal[];
}

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
  yesterdayProgress?: number;
  todayProgress?: number;
}

interface SmartTVRankingData {
  vendedoresData: VendedorData[];
  isLoading: boolean;
  error: any;
  lastUpdated: string;
  weekSummary: {
    totalSales: number;
    totalMeetings: number;
    monthSales: number;
    monthMeetings: number;
  };
}

/**
 * Hook inteligente otimizado para TV 40 polegadas
 * - Cache de 30 minutos para dados estáticos (vendedores, metas)
 * - Cache de 15 minutos para dados dinâmicos (vendas, agendamentos)
 * - Invalidação automática apenas em eventos críticos
 * - Otimizado para performance 24/7 em TV
 */
export const useSmartTVRankingData = (semanaOffset: number = 0): SmartTVRankingData => {
  const { mes: currentMonth, ano: currentYear } = getMesAnoSemanaAtual();
  
  // Calcular a semana baseada no offset
  const targetWeek = Math.max(1, 1 + semanaOffset);

  // Query otimizada para vendedores e metas (cache longo - dados estáticos)
  const { data: vendedoresData, isLoading: vendedoresLoading } = useQuery({
    queryKey: ['smart-tv-vendedores-metas', currentYear, targetWeek],
    queryFn: async (): Promise<VendedoresMetas> => {
      // Buscar vendedores ativos
      const { data: vendedores, error: vendedoresError } = await supabase
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

      if (vendedoresError) throw vendedoresError;

      // Buscar metas semanais
      const { data: metas, error: metasError } = await supabase
        .from('metas_semanais_vendedores')
        .select(`
          vendedor_id,
          meta_vendas,
          ano,
          semana
        `)
        .eq('ano', currentYear)
        .eq('semana', targetWeek);

      if (metasError) throw metasError;

      return { vendedores: vendedores || [], metas: metas || [] };
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - dados raramente mudam
    gcTime: 60 * 60 * 1000, // 1 hora no cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query otimizada para vendas (cache médio - dados dinâmicos)
  const { data: vendas = [], isLoading: vendasLoading } = useQuery({
    queryKey: ['smart-tv-vendas', currentYear, currentMonth, targetWeek],
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
        .eq('status', 'matriculado')
        .order('data_aprovacao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - invalidado via realtime
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Query otimizada para agendamentos (cache médio - dados dinâmicos)
  const { data: agendamentos = [], isLoading: agendamentosLoading } = useQuery({
    queryKey: ['smart-tv-agendamentos', currentYear, targetWeek],
    queryFn: async () => {
      // Calcular período da semana (quarta a terça)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 3 + (semanaOffset * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          sdr_id,
          vendedor_id,
          data_agendamento,
          resultado_reuniao,
          status,
          lead_id
        `)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - invalidado via realtime  
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Processamento inteligente dos dados para TV
  const processedData: VendedorData[] = vendedoresData ? vendedoresData.vendedores.map(vendedor => {
    const isSDR = ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(vendedor.user_type);
    
    // Vendas da semana/período atual
    const vendasSemana = vendas.filter(venda => {
      if (venda.vendedor_id !== vendedor.id) return false;
      const dataEfetiva = getDataEfetivaVenda(venda);
      return isVendaInPeriod(dataEfetiva, currentMonth, currentYear);
    });

    const weeklySales = vendasSemana.reduce((sum, venda) => sum + (venda.pontuacao_validada || 0), 0);
    
    // Meta semanal
    const metaSemanal = vendedoresData.metas.find(meta => meta.vendedor_id === vendedor.id);
    const weeklyTarget = metaSemanal?.meta_vendas || 0;

    // Progresso ontem vs hoje (para display TV)
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    const vendasHoje = vendasSemana.filter(venda => {
      const dataVenda = new Date(getDataEfetivaVenda(venda));
      return dataVenda.toDateString() === hoje.toDateString();
    }).length;

    const vendasOntem = vendasSemana.filter(venda => {
      const dataVenda = new Date(getDataEfetivaVenda(venda));
      return dataVenda.toDateString() === ontem.toDateString();
    }).length;

    // Para SDRs, calcular reuniões
    let reunioesSemana = 0;
    let metaReunioesSemanais = 0;
    let taxaConversaoSemanal = 0;

    if (isSDR) {
      const reunioesRealizadas = agendamentos.filter(ag => 
        (ag.sdr_id === vendedor.id || ag.vendedor_id === vendedor.id) &&
        ag.resultado_reuniao && 
        ['presente', 'compareceu', 'realizada'].includes(ag.resultado_reuniao)
      );
      
      reunioesSemana = reunioesRealizadas.length;
      
      // Meta baseada no nível do SDR
      metaReunioesSemanais = vendedor.nivel === 'senior' ? 40 : 
                           vendedor.nivel === 'pleno' ? 30 : 25;

      // Taxa de conversão: vendas / reuniões
      taxaConversaoSemanal = reunioesSemana > 0 ? (vendasSemana.length / reunioesSemana) * 100 : 0;
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
      yesterdayProgress: vendasOntem,
      todayProgress: vendasHoje,
    };
  }) : [];

  // Resumo para painel lateral
  const weekSummary = {
    totalSales: vendas.filter(venda => {
      const dataEfetiva = getDataEfetivaVenda(venda);
      return isVendaInPeriod(dataEfetiva, currentMonth, currentYear);
    }).length,
    totalMeetings: agendamentos.filter(ag => 
      ag.resultado_reuniao && ['presente', 'compareceu', 'realizada'].includes(ag.resultado_reuniao)
    ).length,
    monthSales: vendas.length,
    monthMeetings: agendamentos.length,
  };

  const isLoading = vendedoresLoading || vendasLoading || agendamentosLoading;
  const error = null;

  const lastUpdated = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    vendedoresData: processedData,
    isLoading,
    error,
    lastUpdated,
    weekSummary,
  };
};