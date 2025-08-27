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

      // 1. Buscar TODOS os agendamentos do vendedor (simplificado)
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

      console.log('📊 Dados coletados (TODOS OS AGENDAMENTOS):', {
        agendamentos: agendamentos?.length || 0,
        vendas: vendas?.length || 0,
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        todosAgendamentos: agendamentos?.map(a => ({
          id: a.id,
          data_agendamento: a.data_agendamento,
          data_resultado: a.data_resultado,
          resultado_reuniao: a.resultado_reuniao,
          status: a.status,
          lead_nome: a.leads?.nome
        }))
      });

      // 3. Filtrar e categorizar agendamentos pela SEMANA
      const agendamentosDaSemana = agendamentos?.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        const dataResultado = agendamento.data_resultado ? new Date(agendamento.data_resultado) : null;
        
        // Incluir se foi agendado na semana OU se teve resultado na semana
        const agendadoNaSemana = dataAgendamento >= startOfWeek && dataAgendamento <= endOfWeek;
        const resultadoNaSemana = dataResultado && dataResultado >= startOfWeek && dataResultado <= endOfWeek;
        
        return agendadoNaSemana || resultadoNaSemana;
      }) || [];

      console.log('🎯 Agendamentos filtrados para a semana:', {
        total: agendamentosDaSemana.length,
        agendamentosFiltrados: agendamentosDaSemana.map(a => ({
          id: a.id,
          data_agendamento: a.data_agendamento,
          data_resultado: a.data_resultado,
          resultado_reuniao: a.resultado_reuniao,
          lead_nome: a.leads?.nome
        }))
      });

      // 4. Categorizar agendamentos (IGUAL AO GRÁFICO)
      const pendentes: AgendamentoDetalhado[] = [];
      const compareceram: AgendamentoDetalhado[] = [];
      const naoCompareceram: AgendamentoDetalhado[] = [];

      agendamentosDaSemana.forEach(agendamento => {
        // Se não tem resultado_reuniao = PENDENTE
        if (!agendamento.resultado_reuniao) {
          pendentes.push(agendamento);
        } else if (['compareceu', 'presente', 'compareceu_nao_comprou'].includes(agendamento.resultado_reuniao)) {
          compareceram.push(agendamento);
        } else if (['nao_compareceu', 'ausente'].includes(agendamento.resultado_reuniao)) {
          naoCompareceram.push(agendamento);
        }
      });

      // 5. Processar vendas convertidas
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

      console.log('✅ Reuniões categorizadas (ALINHADO COM GRÁFICO):', {
        convertidas: resultado.convertidas.length,
        pendentes: resultado.pendentes.length,
        compareceram: resultado.compareceram.length,
        naoCompareceram: resultado.naoCompareceram.length,
        total: resultado.convertidas.length + resultado.pendentes.length + resultado.compareceram.length + resultado.naoCompareceram.length,
        detalhes: {
          pendentesList: resultado.pendentes.map(r => ({ 
            id: r.id, 
            data_agendamento: r.data_agendamento, 
            data_resultado: r.data_resultado,
            resultado: r.resultado_reuniao 
          })),
          compareceramList: resultado.compareceram.map(r => ({ 
            id: r.id, 
            data_resultado: r.data_resultado,
            resultado: r.resultado_reuniao 
          })),
          naoCompareceramList: resultado.naoCompareceram.map(r => ({ 
            id: r.id, 
            data_resultado: r.data_resultado,
            resultado: r.resultado_reuniao 
          }))
        }
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