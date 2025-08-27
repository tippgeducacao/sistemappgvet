import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';

export interface AgendamentoDetalhado {
  id: string;
  data_agendamento: string;
  data_resultado?: string;
  resultado_reuniao?: string;
  status: string;
  link_reuniao?: string;
  pos_graduacao_interesse?: string;
  observacoes_resultado?: string;
  leads?: {
    nome: string;
    whatsapp?: string;
    email?: string;
  };
}

export interface VendaConvertida {
  id: string;
  data_assinatura_contrato: string;
  aluno_nome: string;
  curso_nome: string;
  agendamento_id?: string;
  data_agendamento?: string;
}

export interface ReunioesCategorizada {
  convertidas: VendaConvertida[];
  pendentes: AgendamentoDetalhado[];
  compareceram: AgendamentoDetalhado[];
  naoCompareceram: AgendamentoDetalhado[];
}

export const useAgendamentosDetalhados = (vendedorId: string, weekDate: Date) => {
  const [reunioesCategorizada, setReunioesCategorizada] = useState<ReunioesCategorizada>({
    convertidas: [],
    pendentes: [],
    compareceram: [],
    naoCompareceram: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgendamentosDetalhados = async () => {
    try {
      setIsLoading(true);
      
      // Usar getWeekRange para consistência
      const { start: startOfWeek, end: endOfWeek } = getWeekRange(weekDate);

      console.log('🎯 Buscando reuniões categorizadas:', {
        vendedorId,
        weekDate: weekDate.toLocaleDateString('pt-BR'),
        startOfWeek: startOfWeek.toLocaleDateString('pt-BR'),
        endOfWeek: endOfWeek.toLocaleDateString('pt-BR'),
        periodo: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`
      });

      // 1. Buscar todos os agendamentos do vendedor na semana
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_agendamento,
          data_resultado,
          resultado_reuniao,
          status,
          link_reuniao,
          pos_graduacao_interesse,
          observacoes_resultado,
          leads (
            nome,
            whatsapp,
            email
          )
        `)
        .eq('vendedor_id', vendedorId)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString())
        .order('data_agendamento', { ascending: false });

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      // 2. Buscar vendas convertidas da semana (baseado na data_assinatura_contrato)
      const { data: vendas, error: vendasError } = await supabase
        .from('form_entries')
        .select(`
          id,
          data_assinatura_contrato,
          alunos (nome),
          cursos (nome),
          agendamentos (
            id,
            data_agendamento
          )
        `)
        .eq('vendedor_id', vendedorId)
        .eq('status', 'matriculado')
        .gte('data_assinatura_contrato', startOfWeek.toISOString().split('T')[0])
        .lte('data_assinatura_contrato', endOfWeek.toISOString().split('T')[0]);

      if (vendasError) {
        console.error('Erro ao buscar vendas:', vendasError);
        return;
      }

      console.log('📊 Dados coletados:', {
        agendamentos: agendamentos?.length || 0,
        vendas: vendas?.length || 0
      });

      // 3. Categorizar agendamentos
      const pendentes: AgendamentoDetalhado[] = [];
      const compareceram: AgendamentoDetalhado[] = [];
      const naoCompareceram: AgendamentoDetalhado[] = [];

      agendamentos?.forEach(agendamento => {
        if (!agendamento.resultado_reuniao || agendamento.status === 'agendado') {
          pendentes.push(agendamento);
        } else if (['compareceu', 'presente', 'compareceu_nao_comprou'].includes(agendamento.resultado_reuniao)) {
          compareceram.push(agendamento);
        } else if (['nao_compareceu', 'ausente'].includes(agendamento.resultado_reuniao)) {
          naoCompareceram.push(agendamento);
        }
      });

      // 4. Processar vendas convertidas
      const convertidas: VendaConvertida[] = vendas?.map(venda => ({
        id: venda.id,
        data_assinatura_contrato: venda.data_assinatura_contrato,
        aluno_nome: venda.alunos?.nome || 'Nome não informado',
        curso_nome: venda.cursos?.nome || 'Curso não informado',
        agendamento_id: venda.agendamentos?.[0]?.id,
        data_agendamento: venda.agendamentos?.[0]?.data_agendamento
      })) || [];

      const resultado = {
        convertidas,
        pendentes,
        compareceram,
        naoCompareceram
      };

      console.log('✅ Reuniões categorizadas:', {
        convertidas: resultado.convertidas.length,
        pendentes: resultado.pendentes.length,
        compareceram: resultado.compareceram.length,
        naoCompareceram: resultado.naoCompareceram.length,
        total: resultado.convertidas.length + resultado.pendentes.length + resultado.compareceram.length + resultado.naoCompareceram.length
      });
      
      setReunioesCategorizada(resultado);
    } catch (error) {
      console.error('Erro ao buscar reuniões categorizadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendedorId) {
      fetchAgendamentosDetalhados();
    }
  }, [vendedorId, weekDate]);

  return {
    reunioesCategorizada,
    isLoading,
    fetchAgendamentosDetalhados
  };
};