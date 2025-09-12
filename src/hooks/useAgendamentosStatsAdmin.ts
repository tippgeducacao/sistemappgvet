import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { findContactMatches } from '@/utils/contactMatchingUtils';
import { getWeekRange } from '@/utils/semanaUtils';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

export interface MeetingDetail {
  id: string;
  data_agendamento: string;
  resultado_reuniao: string;
  status: 'convertida' | 'pendente' | 'compareceu' | 'nao_compareceu';
  lead_name: string;
  vendedor_name: string;
  data_assinatura?: string;
  curso_nome?: string;
}

export interface AgendamentosStatsAdmin {
  sdr_id: string;
  sdr_name: string;
  convertidas: number;
  compareceram: number;
  pendentes: number;
  naoCompareceram: number;
  total: number;
  meetings: MeetingDetail[];
}

export const useAgendamentosStatsAdmin = (selectedSDR?: string, weekDate?: Date) => {
  const [statsData, setStatsData] = useState<AgendamentosStatsAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAdmin = async () => {
    try {
      setIsLoading(true);
      
      // Usar a função utilitária para calcular o range da semana
      const targetDate = weekDate || new Date();
      const { start: startOfWeek, end: endOfWeek } = getWeekRange(targetDate);

      console.log('🗓️ Buscando dados da semana:', { 
        startOfWeek: startOfWeek.toISOString(), 
        endOfWeek: endOfWeek.toISOString() 
      });
      
      // Buscar todos os agendamentos com resultado OU remarcados para SDRs ativos
      let agendamentosQuery = supabase
        .from('agendamentos')
        .select(`
          id,
          sdr_id,
          vendedor_id,
          lead_id,
          resultado_reuniao,
          data_agendamento,
          form_entry_id,
          status,
          profiles!sdr_id (
            name,
            user_type,
            ativo
          ),
          vendedor:profiles!vendedor_id (
            name
          ),
          leads (
            nome
          )
        `)
        .or('resultado_reuniao.not.is.null,status.eq.remarcado');

      // Se um SDR específico foi selecionado
      if (selectedSDR && selectedSDR !== 'todos') {
        agendamentosQuery = agendamentosQuery.eq('sdr_id', selectedSDR);
      }

      const { data: agendamentosData, error: agendamentosError } = await agendamentosQuery;

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      // Buscar TODAS as vendas aprovadas (matriculadas) - não filtrar por sdr_id
      const { data: todasVendasAprovadas, error: vendasError } = await supabase
        .from('form_entries')
        .select(`
          id,
          vendedor_id,
          sdr_id,
          status,
          data_assinatura_contrato,
          data_aprovacao,
          curso_id,
          enviado_em,
          cursos (
            nome
          )
        `)
        .eq('status', 'matriculado');

      if (vendasError) {
        console.error('Erro ao buscar vendas aprovadas:', vendasError);
        return;
      }

      // Buscar dados dos alunos para matching
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select(`
          form_entry_id,
          nome,
          telefone,
          email
        `);

      if (alunosError) {
        console.error('Erro ao buscar alunos:', alunosError);
        return;
      }

      // Buscar dados dos leads para matching
      const leadIds = agendamentosData?.map(a => a.lead_id).filter(Boolean) || [];
      let leadsData: any[] = [];
      if (leadIds.length > 0) {
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('id, nome, whatsapp, email')
          .in('id', leadIds);
        
        if (!leadsError && leads) {
          leadsData = leads;
        }
      }

      // Filtrar vendas aprovadas que foram assinadas na semana atual (data efetiva)
      const vendasAprovadasNaSemana = todasVendasAprovadas?.filter(venda => {
        const dataEfetiva = getDataEfetivaVenda(venda);
        return dataEfetiva >= startOfWeek && dataEfetiva <= endOfWeek;
      }) || [];

      console.log('💰 Vendas convertidas na semana (por data de assinatura):', {
        total_aprovadas: todasVendasAprovadas?.length || 0,
        assinadas_na_semana: vendasAprovadasNaSemana.length
      });

      // Buscar vendas pendentes (com form_entry_id direto e por matching de contato)
      const agendamentosWithSales = agendamentosData?.filter(a => a.form_entry_id) || [];
      const agendamentosWithoutSales = agendamentosData?.filter(a => 
        !a.form_entry_id && a.resultado_reuniao === 'comprou'
      ) || [];
      
      console.log('🔍 PENDENTES - Análise de agendamentos:', {
        total: agendamentosData?.length,
        comFormEntry: agendamentosWithSales.length,
        semFormEntry: agendamentosWithoutSales.length,
        comprou: agendamentosData?.filter(a => a.resultado_reuniao === 'comprou').length
      });
      
      const formEntryIds = agendamentosWithSales.map(a => a.form_entry_id).filter(Boolean);
      
      let vendasPendentes: any[] = [];
      
      // 1. Buscar vendas pendentes via form_entry_id direto
      if (formEntryIds.length > 0) {
        const { data: pendentesData, error: pendentesError } = await supabase
          .from('form_entries')
          .select(`
            id,
            status,
            data_assinatura_contrato,
            curso_id,
            sdr_id,
            cursos (
              nome
            )
          `)
          .in('id', formEntryIds)
          .eq('status', 'pendente');

        if (pendentesError) {
          console.error('Erro ao buscar vendas pendentes:', pendentesError);
        } else {
          vendasPendentes = pendentesData || [];
          console.log('📋 PENDENTES - Via form_entry_id:', vendasPendentes.length);
        }
      }
      
      // 2. Buscar vendas pendentes via matching de contato (para agendamentos 'comprou' sem form_entry_id)
      let vendasPendentesPorMatching: any[] = [];
      if (agendamentosWithoutSales.length > 0) {
        const leadIds = agendamentosWithoutSales.map(a => a.lead_id).filter(Boolean);
        
        if (leadIds.length > 0) {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('id, whatsapp, email')
            .in('id', leadIds);
          
          if (!leadsError && leadsData) {
            const { data: alunosData, error: alunosError } = await supabase
              .from('alunos')
              .select(`
                form_entry_id,
                nome,
                telefone,
                email,
                form_entries (
                  id,
                  status,
                  curso_id,
                  sdr_id,
                  cursos (
                    nome
                  )
                )
              `)
              .eq('form_entries.status', 'pendente');
            
            if (!alunosError && alunosData) {
              console.log('🔍 MATCHING - Iniciando matching para agendamentos sem form_entry_id:', {
                agendamentos: agendamentosWithoutSales.length,
                leads: leadsData.length,
                alunosPendentes: alunosData.length
              });
              
              const matches = findContactMatches(
                agendamentosWithoutSales.map(a => ({ id: a.id, lead_id: a.lead_id })),
                leadsData,
                alunosData.map(a => ({
                  form_entry_id: a.form_entry_id,
                  nome: a.nome,
                  telefone: a.telefone,
                  email: a.email
                }))
              );
              
              vendasPendentesPorMatching = Array.from(matches.entries()).map(([agendamentoId, aluno]) => ({
                id: aluno.form_entry_id,
                status: 'pendente',
                agendamento_id: agendamentoId,
                curso_id: null,
                sdr_id: null,
                cursos: null
              }));
              
              console.log('📋 PENDENTES - Via matching:', vendasPendentesPorMatching.length);
            }
          }
        }
      }
      
      console.log('📊 Dados coletados:', {
        agendamentos: agendamentosData?.length,
        vendasAprovadasNaSemana: vendasAprovadasNaSemana?.length,
        vendasPendentesDiretas: vendasPendentes?.length,
        vendasPendentesMatching: vendasPendentesPorMatching?.length
      });

      // Combinar todas as vendas pendentes
      const todasVendasPendentes = [...vendasPendentes, ...vendasPendentesPorMatching];

      // Agrupar dados por SDR
      const statsMap = new Map<string, AgendamentosStatsAdmin>();

      // Função auxiliar para garantir que um SDR está no map
      const ensureSDRInMap = (sdrId: string, sdrName: string, isActive: boolean = true) => {
        if (!isActive) return false;
        
        if (!statsMap.has(sdrId)) {
          statsMap.set(sdrId, {
            sdr_id: sdrId,
            sdr_name: sdrName,
            convertidas: 0,
            compareceram: 0,
            pendentes: 0,
            naoCompareceram: 0,
            total: 0,
            meetings: []
          });
        }
        return true;
      };

      // Mapear IDs de agendamentos que já foram processados como convertidos
      const agendamentosConvertidosIds = new Set();

      // NOVA LÓGICA: Primeiro processar reuniões da semana, depois vendas assinadas na semana
      
      // 1. PRIMEIRO: Processar todos os agendamentos da semana atual
      agendamentosData?.forEach((agendamento: any) => {
        const sdrId = agendamento.sdr_id;
        const profile = agendamento.profiles;
        const sdrName = profile?.name || 'SDR Desconhecido';
        
        // Filtrar apenas usuários ativos e com tipo SDR
        const isActiveSDR = profile?.ativo === true && 
          ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(profile?.user_type);
        
        if (!ensureSDRInMap(sdrId, sdrName, isActiveSDR)) return;

        const stats = statsMap.get(sdrId)!;
        
        // Verificar se esta reunião está na semana (data da reunião)
        const agendamentoDate = new Date(agendamento.data_agendamento);
        const isInWeek = agendamentoDate >= startOfWeek && agendamentoDate <= endOfWeek;
        
        if (!isInWeek) {
          return; // Só processar reuniões da semana atual
        }

        stats.total++;

        // Criar objeto de detalhe da reunião
        const meetingDetail: MeetingDetail = {
          id: agendamento.id,
          data_agendamento: agendamento.data_agendamento,
          resultado_reuniao: agendamento.resultado_reuniao,
          status: 'compareceu', // Default, será ajustado abaixo
          lead_name: agendamento.leads?.nome || 'Lead desconhecido',
          vendedor_name: agendamento.vendedor?.name || 'Vendedor desconhecido'
        };

        // Determinar status e contagem baseado no resultado da reunião e status
        if (agendamento.status === 'remarcado') {
          // Reuniões remarcadas continuam contando para o SDR
          stats.compareceram++;
          meetingDetail.status = 'compareceu';
          meetingDetail.resultado_reuniao = 'Remarcada pelo vendedor';
        } else if (agendamento.resultado_reuniao === 'nao_compareceu') {
          stats.naoCompareceram++;
          meetingDetail.status = 'nao_compareceu';
        } else if (agendamento.resultado_reuniao === 'comprou') {
          // Verificar se existe venda APROVADA correspondente a esta reunião
          let vendaAprovadaCorrespondente = null;
          
          // Primeiro tentar por form_entry_id direto
          if (agendamento.form_entry_id) {
            vendaAprovadaCorrespondente = todasVendasAprovadas?.find(v => v.id === agendamento.form_entry_id);
          }
          
          // Se não encontrou por form_entry_id, tentar matching por contato
          if (!vendaAprovadaCorrespondente && agendamento.lead_id) {
            const leadDoAgendamento = leadsData?.find(lead => lead.id === agendamento.lead_id);
            if (leadDoAgendamento) {
              vendaAprovadaCorrespondente = todasVendasAprovadas?.find(venda => {
                const alunoCorrespondente = alunosData?.find(aluno => aluno.form_entry_id === venda.id);
                if (alunoCorrespondente) {
                  const leadWhatsapp = leadDoAgendamento.whatsapp?.replace(/\D/g, '');
                  const alunoTelefone = alunoCorrespondente.telefone?.replace(/\D/g, '');
                  
                  if (leadWhatsapp && alunoTelefone && leadWhatsapp === alunoTelefone) {
                    return true;
                  }
                  if (leadDoAgendamento.email && alunoCorrespondente.email && 
                      leadDoAgendamento.email.toLowerCase() === alunoCorrespondente.email.toLowerCase()) {
                    return true;
                  }
                }
                return false;
              });
            }
          }

          if (vendaAprovadaCorrespondente) {
            // Esta reunião tem uma venda aprovada, mas só conta como convertida se foi assinada nesta semana
            const dataEfetivaVenda = getDataEfetivaVenda(vendaAprovadaCorrespondente);
            const foiAssinadaNaSemana = dataEfetivaVenda >= startOfWeek && dataEfetivaVenda <= endOfWeek;
            
            if (foiAssinadaNaSemana) {
              // Venda foi assinada nesta semana - conta como convertida
              stats.convertidas++;
              meetingDetail.status = 'convertida';
              meetingDetail.curso_nome = vendaAprovadaCorrespondente.cursos?.nome;
              meetingDetail.data_assinatura = vendaAprovadaCorrespondente.data_assinatura_contrato || 
                                             vendaAprovadaCorrespondente.data_aprovacao?.split('T')[0];
              agendamentosConvertidosIds.add(agendamento.id);
            } else {
              // Venda existe mas foi assinada em outra semana - não conta como convertida nesta semana
              // Mas também não conta como pendente pois já foi aprovada
              stats.compareceram++;
              meetingDetail.status = 'compareceu';
              meetingDetail.resultado_reuniao = 'Venda aprovada em outra semana';
            }
          } else {
            // Verificar se existe venda pendente
            const vendaPendente = todasVendasPendentes.find(v => 
              v.id === agendamento.form_entry_id || 
              v.agendamento_id === agendamento.id
            );
            
            if (vendaPendente) {
              stats.pendentes++;
              meetingDetail.status = 'pendente';
              meetingDetail.curso_nome = vendaPendente.cursos?.nome;
            } else {
              // Se marcada como "comprou" mas não tem venda pendente nem aprovada, 
              // ainda é pendente (aguardando aprovação)
              stats.pendentes++;
              meetingDetail.status = 'pendente';
              meetingDetail.curso_nome = 'Aguardando aprovação';
            }
          }
        } else if (!agendamento.resultado_reuniao && agendamento.status !== 'remarcado') {
          // Reunião sem resultado definido
          stats.compareceram++;
          meetingDetail.status = 'compareceu';
          meetingDetail.resultado_reuniao = 'Participou';
        } else {
          // Outros casos (nao_comprou, etc)
          stats.compareceram++;
          meetingDetail.status = 'compareceu';
        }

        stats.meetings.push(meetingDetail);
      });

      // 2. SEGUNDO: Processar vendas assinadas nesta semana que não foram processadas acima
      vendasAprovadasNaSemana?.forEach((venda: any) => {
        // Buscar agendamento relacionado que NÃO foi processado acima
        let agendamentoRelacionado = agendamentosData?.find(a => 
          a.form_entry_id === venda.id && !agendamentosConvertidosIds.has(a.id)
        );
        
        // Se não encontrou por form_entry_id, tentar matching por contato
        if (!agendamentoRelacionado) {
          const alunoCorrespondente = alunosData?.find(aluno => aluno.form_entry_id === venda.id);
          if (alunoCorrespondente) {
            agendamentoRelacionado = agendamentosData?.find(agendamento => {
              if (!agendamento.lead_id || agendamentosConvertidosIds.has(agendamento.id)) return false;
              
              const leadDoAgendamento = leadsData?.find(lead => lead.id === agendamento.lead_id);
              if (!leadDoAgendamento) return false;
              
              const leadWhatsapp = leadDoAgendamento.whatsapp?.replace(/\D/g, '');
              const alunoTelefone = alunoCorrespondente.telefone?.replace(/\D/g, '');
              
              if (leadWhatsapp && alunoTelefone && leadWhatsapp === alunoTelefone) {
                return true;
              }
              if (leadDoAgendamento.email && alunoCorrespondente.email && 
                  leadDoAgendamento.email.toLowerCase() === alunoCorrespondente.email.toLowerCase()) {
                return true;
              }
              return false;
            });
          }
        }

        // Se encontrou um agendamento relacionado de uma semana anterior, atribuir a conversão ao SDR
        if (agendamentoRelacionado && agendamentoRelacionado.sdr_id) {
          const sdrProfile = agendamentoRelacionado.profiles;
          const sdrName = sdrProfile?.name || 'SDR Desconhecido';
          
          // Verificar se é SDR ativo
          const isActiveSDR = sdrProfile?.ativo === true && 
            ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(sdrProfile?.user_type);
          
          if (!ensureSDRInMap(agendamentoRelacionado.sdr_id, sdrName, isActiveSDR)) return;

          const stats = statsMap.get(agendamentoRelacionado.sdr_id)!;
          stats.convertidas++;

          // Marcar agendamento como processado
          agendamentosConvertidosIds.add(agendamentoRelacionado.id);

          const meetingDetail: MeetingDetail = {
            id: agendamentoRelacionado.id,
            data_agendamento: agendamentoRelacionado.data_agendamento,
            resultado_reuniao: 'comprou',
            status: 'convertida',
            lead_name: agendamentoRelacionado.leads?.nome || 'Cliente convertido',
            vendedor_name: agendamentoRelacionado.vendedor?.name || 'Vendedor',
            data_assinatura: venda.data_assinatura_contrato || venda.data_aprovacao?.split('T')[0],
            curso_nome: venda.cursos?.nome
          };

          stats.meetings.push(meetingDetail);
        }
      });

      const finalStats = Array.from(statsMap.values());
      
      console.log('📈 Estatísticas finais:', finalStats.map(s => ({
        sdr: s.sdr_name,
        total: s.total,
        convertidas: s.convertidas,
        pendentes: s.pendentes,
        compareceram: s.compareceram,
        naoCompareceram: s.naoCompareceram
      })));
      
      setStatsData(finalStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAdmin();
  }, [selectedSDR, weekDate]);

  return {
    statsData,
    isLoading,
    fetchStatsAdmin
  };
};