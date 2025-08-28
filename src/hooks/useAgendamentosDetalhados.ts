import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';
import { findContactMatches } from '@/utils/contactMatchingUtils';

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
      
      // Usar getWeekRange para consistência com o gráfico
      const { start: startOfWeek, end: endOfWeek } = getWeekRange(weekDate);

      console.log('🎯 Modal - Buscando reuniões categorizadas (ALINHADO COM GRÁFICO):', {
        vendedorId,
        weekDate: weekDate.toLocaleDateString('pt-BR'),
        startOfWeek: startOfWeek.toLocaleDateString('pt-BR'),
        endOfWeek: endOfWeek.toLocaleDateString('pt-BR'),
        periodo: `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`
      });

      // 1. Buscar agendamentos com resultado na semana (IGUAL AO GRÁFICO)
      // Filtra por data_resultado, não por data_agendamento
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          lead_id,
          data_agendamento,
          data_resultado,
          resultado_reuniao,
          status,
          link_reuniao,
          pos_graduacao_interesse,
          observacoes_resultado,
          form_entry_id
        `)
        .eq('vendedor_id', vendedorId)
        .not('resultado_reuniao', 'is', null)
        .gte('data_resultado', startOfWeek.toISOString())
        .lte('data_resultado', endOfWeek.toISOString())
        .order('data_resultado', { ascending: false });

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      // 2. Buscar vendas convertidas da semana (IGUAL AO GRÁFICO)
      const { data: vendas, error: vendasError } = await supabase
        .from('form_entries')
        .select(`
          id,
          data_assinatura_contrato
        `)
        .eq('vendedor_id', vendedorId)
        .eq('status', 'matriculado')
        .not('data_assinatura_contrato', 'is', null)
        .gte('data_assinatura_contrato', startOfWeek.toISOString().split('T')[0])
        .lte('data_assinatura_contrato', endOfWeek.toISOString().split('T')[0]);

      if (vendasError) {
        console.error('Erro ao buscar vendas:', vendasError);
        return;
      }

      // 3. Buscar dados dos leads para os agendamentos (separadamente para evitar RLS)
      const leadIds = agendamentos?.map(a => a.lead_id).filter(Boolean) || [];
      let leadsData: any[] = [];
      
      if (leadIds.length > 0) {
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('id, nome, whatsapp, email')
          .in('id', leadIds);
        
        if (!leadsError) {
          leadsData = leads || [];
        }
      }

      // 4. Buscar dados de alunos e cursos para as vendas (separadamente)
      let alunosMap = new Map();
      let cursosMap = new Map();
      
      if (vendas && vendas.length > 0) {
        const vendaIds = vendas.map(v => v.id);
        
        const { data: alunos } = await supabase
          .from('alunos')
          .select('form_entry_id, nome')
          .in('form_entry_id', vendaIds);
        
        const { data: formEntries } = await supabase
          .from('form_entries')
          .select('id, curso_id')
          .in('id', vendaIds);
        
        if (alunos) {
          alunos.forEach(aluno => {
            alunosMap.set(aluno.form_entry_id, aluno.nome);
          });
        }
        
        if (formEntries) {
          const cursoIds = formEntries.map(fe => fe.curso_id).filter(Boolean);
          if (cursoIds.length > 0) {
            const { data: cursos } = await supabase
              .from('cursos')
              .select('id, nome')
              .in('id', cursoIds);
            
            if (cursos) {
              cursos.forEach(curso => {
                cursosMap.set(curso.id, curso.nome);
              });
            }
            
            formEntries.forEach(fe => {
              if (fe.curso_id) {
                const vendaId = fe.id;
                const cursoNome = cursosMap.get(fe.curso_id);
                cursosMap.set(vendaId, cursoNome);
              }
            });
          }
        }
      }

      // 5. Buscar vendas convertidas globalmente para filtrar "comprou" já assinados
      const agendamentosComprou = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && a.form_entry_id) || [];
      const formEntryIds = agendamentosComprou.map(a => a.form_entry_id).filter(Boolean);
      
      // Também buscar "comprou" sem form_entry_id para matching por lead
      const agendamentosComprouSemFormEntry = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && !a.form_entry_id) || [];
      
      console.log('🎯 DEBUG MODAL - Agendamentos "comprou":', {
        totalComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').length || 0,
        comprouComFormEntry: agendamentosComprou.length,
        comprouSemFormEntry: agendamentosComprouSemFormEntry.length,
        formEntryIds: formEntryIds,
        detalhesComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').map(a => ({
          id: a.id,
          data_resultado: a.data_resultado,
          form_entry_id: a.form_entry_id
        }))
      });
      
      let convertidasGlobal = new Set<string>();
      if (formEntryIds.length > 0) {
        const { data: vendasGlobal } = await supabase
          .from('form_entries')
          .select('id, status, data_assinatura_contrato')
          .in('id', formEntryIds)
          .eq('status', 'matriculado')
          .not('data_assinatura_contrato', 'is', null);
        
        console.log('🎯 DEBUG MODAL - Vendas convertidas globalmente:', {
          vendasEncontradas: vendasGlobal?.length || 0,
          detalhesVendas: vendasGlobal?.map(v => ({
            id: v.id,
            status: v.status,
            data_assinatura_contrato: v.data_assinatura_contrato
          }))
        });
        
        vendasGlobal?.forEach(v => convertidasGlobal.add(v.id));
      }

      // Buscar agendamentos "comprou" sem form_entry_id e fazer matching por lead usando utilitário unificado
      let agendamentosMatchingLeads = new Set<string>();
      let vendasComAgendamento = new Map<string, { agendamento_id: string; data_agendamento: string }>();
      
      if (agendamentosComprouSemFormEntry.length > 0 && vendas && vendas.length > 0) {
        // Buscar dados dos alunos das vendas da semana
        const vendaIds = vendas.map(v => v.id);
        const { data: alunosVendas } = await supabase
          .from('alunos')
          .select('form_entry_id, nome, email, telefone')
          .in('form_entry_id', vendaIds);
        
        console.log('🎯 MODAL - Dados para matching unificado:', {
          agendamentosComprouSemFormEntry: agendamentosComprouSemFormEntry.length,
          alunosVendas: alunosVendas?.length || 0,
          leadsData: leadsData.length
        });
        
        if (alunosVendas && alunosVendas.length > 0) {
          // Usar utilitário unificado para matching
          const alunosData = alunosVendas.map(aluno => ({
            form_entry_id: aluno.form_entry_id,
            nome: aluno.nome,
            email: aluno.email || '',
            telefone: aluno.telefone || ''
          }));
          
          const agendamentosComLeads = agendamentosComprouSemFormEntry.map(a => ({
            id: a.id,
            lead_id: a.lead_id
          }));
          
          const matches = findContactMatches(agendamentosComLeads, leadsData, alunosData);
          
          // Converter matches para os Sets/Maps existentes
          matches.forEach((alunoData, agendamentoId) => {
            agendamentosMatchingLeads.add(agendamentoId);
            const agendamento = agendamentosComprouSemFormEntry.find(a => a.id === agendamentoId);
            if (agendamento) {
              vendasComAgendamento.set(alunoData.form_entry_id, {
                agendamento_id: agendamentoId,
                data_agendamento: agendamento.data_agendamento
              });
            }
          });
          
          console.log('🎯 MODAL - Resultado do matching unificado:', {
            agendamentosComMatching: agendamentosMatchingLeads.size,
            vendasComAgendamento: vendasComAgendamento.size
          });
        }
      }

      console.log('📊 Modal - Dados coletados:', {
        agendamentos: agendamentos?.length || 0,
        vendas: vendas?.length || 0,
        leads: leadsData.length,
        comprouTotal: agendamentosComprou.length,
        comprouJaConvertidos: convertidasGlobal.size,
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString()
      });

      // 6. Categorizar agendamentos - agora filtrando "comprou" já convertidos
      const pendentes: AgendamentoDetalhado[] = [];
      const compareceram: AgendamentoDetalhado[] = [];
      const naoCompareceram: AgendamentoDetalhado[] = [];

      agendamentos?.forEach(agendamento => {
        // Encontrar dados do lead
        const leadData = leadsData.find(l => l.id === agendamento.lead_id);
        
        const agendamentoDetalhado: AgendamentoDetalhado = {
          ...agendamento,
          leads: leadData ? {
            nome: leadData.nome,
            whatsapp: leadData.whatsapp,
            email: leadData.email
          } : undefined
        };

        // Categorização CORRIGIDA: "comprou" só fica pendente se não foi convertido globalmente OU por matching
        switch (agendamento.resultado_reuniao) {
          case 'comprou':
            // Só vai para pendentes se NÃO foi convertido globalmente OU por matching de lead
            const jaConvertidoPorFormEntry = agendamento.form_entry_id && convertidasGlobal.has(agendamento.form_entry_id);
            const jaConvertidoPorLead = agendamentosMatchingLeads.has(agendamento.id);
            const jaConvertido = jaConvertidoPorFormEntry || jaConvertidoPorLead;
            
            console.log('🎯 DEBUG MODAL COMPROU - Processando agendamento:', {
              agendamento_id: agendamento.id,
              form_entry_id: agendamento.form_entry_id,
              jaConvertidoPorFormEntry,
              jaConvertidoPorLead,
              jaConvertido,
              data_resultado: agendamento.data_resultado
            });
            
            if (!jaConvertido) {
              pendentes.push(agendamentoDetalhado);
              console.log('✅ MODAL: Adicionando como PENDENTE');
            } else {
              console.log('❌ MODAL: NÃO adicionando como pendente (já convertido via form_entry ou matching)');
            }
            break;
          case 'compareceu_nao_comprou':
          case 'presente':
          case 'compareceu':
            compareceram.push(agendamentoDetalhado);
            break;
          case 'nao_compareceu':
          case 'ausente':
            naoCompareceram.push(agendamentoDetalhado);
            break;
        }
      });

      // 6. Processar vendas convertidas com assinatura de contrato na semana + vincular com agendamentos
      const convertidas: VendaConvertida[] = vendas?.map(venda => {
        const agendamentoData = vendasComAgendamento.get(venda.id);
        
        return {
          id: venda.id,
          data_assinatura_contrato: venda.data_assinatura_contrato,
          aluno_nome: alunosMap.get(venda.id) || 'Nome não informado',
          curso_nome: cursosMap.get(venda.id) || 'Curso não informado',
          agendamento_id: agendamentoData?.agendamento_id,
          data_agendamento: agendamentoData?.data_agendamento
        };
      }) || [];

      const resultado = {
        convertidas,
        pendentes,
        compareceram,
        naoCompareceram
      };

      console.log('✅ MODAL - Reuniões categorizadas UNIFICADAS:', {
        convertidas: resultado.convertidas.length,
        pendentes: resultado.pendentes.length,
        compareceram: resultado.compareceram.length,
        naoCompareceram: resultado.naoCompareceram.length,
        total: resultado.convertidas.length + resultado.pendentes.length + resultado.compareceram.length + resultado.naoCompareceram.length,
        // Log específico para comparação com resumo
        VALIDACAO_PENDENTES: {
          totalAgendamentosComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').length || 0,
          convertidasGlobal: convertidasGlobal.size,
          matchingLeads: agendamentosMatchingLeads.size,
          PENDENTES_FINAL: resultado.pendentes.length
        },
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