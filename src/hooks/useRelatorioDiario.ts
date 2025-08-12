import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface RelatorioDiario {
  id: string;
  vendedor_id: string;
  data: string;
  reunioes_realizadas: number;
  vendas_fechadas: number;
  taxa_fechamento: number;
  principais_objecoes?: string;
  acoes_proximo_dia?: string;
  created_at: string;
  updated_at: string;
}

export interface DadosDiarios {
  reunioesRealizadas: number;
  vendasFechadas: number;
  taxaFechamento: number;
}

// Hook para buscar dados automáticos do dia
export const useDadosDiarios = (data: string) => {
  const { currentUser } = useAuthStore();

  return useQuery({
    queryKey: ['dados-diarios', currentUser?.id, data],
    queryFn: async (): Promise<DadosDiarios> => {
      if (!currentUser?.id || !data) {
        return { reunioesRealizadas: 0, vendasFechadas: 0, taxaFechamento: 0 };
      }

      const dataFormatada = format(new Date(data), 'yyyy-MM-dd');

      // Buscar reuniões do dia (exceto não compareceu)
      const { data: reunioes, error: reunioesError } = await supabase
        .from('agendamentos')
        .select('id, resultado_reuniao')
        .eq('vendedor_id', currentUser.id)
        .gte('data_agendamento', `${dataFormatada} 00:00:00`)
        .lt('data_agendamento', `${dataFormatada} 23:59:59`)
        .neq('resultado_reuniao', 'nao_compareceu')
        .not('resultado_reuniao', 'is', null);

      if (reunioesError) {
        console.error('Erro ao buscar reuniões:', reunioesError);
        throw reunioesError;
      }

      // Buscar vendas fechadas no dia
      const { data: vendas, error: vendasError } = await supabase
        .from('form_entries')
        .select('id, status, data_aprovacao')
        .eq('vendedor_id', currentUser.id)
        .eq('status', 'matriculado')
        .gte('data_aprovacao', `${dataFormatada} 00:00:00`)
        .lt('data_aprovacao', `${dataFormatada} 23:59:59`);

      if (vendasError) {
        console.error('Erro ao buscar vendas:', vendasError);
        throw vendasError;
      }

      const reunioesRealizadas = reunioes?.length || 0;
      const vendasFechadas = vendas?.length || 0;
      const taxaFechamento = reunioesRealizadas > 0 ? (vendasFechadas / reunioesRealizadas) * 100 : 0;

      return {
        reunioesRealizadas,
        vendasFechadas,
        taxaFechamento: Math.round(taxaFechamento * 100) / 100
      };
    },
    enabled: !!currentUser?.id && !!data
  });
};

// Hook para buscar relatório diário existente
export const useRelatorioDiario = (data: string) => {
  const { currentUser } = useAuthStore();

  return useQuery({
    queryKey: ['relatorio-diario', currentUser?.id, data],
    queryFn: async (): Promise<RelatorioDiario | null> => {
      if (!currentUser?.id || !data) return null;

      const dataFormatada = format(new Date(data), 'yyyy-MM-dd');

      const { data: relatorio, error } = await supabase
        .from('relatorios_diarios')
        .select('*')
        .eq('vendedor_id', currentUser.id)
        .eq('data', dataFormatada)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar relatório:', error);
        throw error;
      }

      return relatorio || null;
    },
    enabled: !!currentUser?.id && !!data
  });
};

// Hook para salvar/atualizar relatório diário
export const useSalvarRelatorioDiario = () => {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: {
      data: string;
      reunioesRealizadas: number;
      vendasFechadas: number;
      taxaFechamento: number;
      principaisObjecoes?: string;
      acoesProximoDia?: string;
    }) => {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado');
      }

      const dataFormatada = format(new Date(dados.data), 'yyyy-MM-dd');

      const dadosRelatorio = {
        vendedor_id: currentUser.id,
        data: dataFormatada,
        reunioes_realizadas: dados.reunioesRealizadas,
        vendas_fechadas: dados.vendasFechadas,
        taxa_fechamento: dados.taxaFechamento,
        principais_objecoes: dados.principaisObjecoes,
        acoes_proximo_dia: dados.acoesProximoDia
      };

      const { data, error } = await supabase
        .from('relatorios_diarios')
        .upsert(dadosRelatorio)
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar relatório:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['relatorio-diario'] });
      toast.success('Relatório diário salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar relatório:', error);
      toast.error('Erro ao salvar relatório diário');
    }
  });
};