import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { findContactMatches } from '@/utils/contactMatchingUtils';

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
      
      // Calcular o início e fim da semana (quarta a terça)
      const targetDate = weekDate || new Date();
      const dayOfWeek = targetDate.getDay(); // 0 = domingo, 3 = quarta
      
      // Calcular quantos dias subtrair para chegar na quarta-feira
      let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
      
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('🗓️ Buscando dados da semana:', { 
        startOfWeek: startOfWeek.toISOString(), 
        endOfWeek: endOfWeek.toISOString() 
      });
      
      // Buscar todos os agendamentos com resultado para SDRs ativos
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
        .not('resultado_reuniao', 'is', null);

      // Se um SDR específico foi selecionado
      if (selectedSDR && selectedSDR !== 'todos') {
        agendamentosQuery = agendamentosQuery.eq('sdr_id', selectedSDR);
      }

      const { data: agendamentosData, error: agendamentosError } = await agendamentosQuery;

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      // Buscar vendas aprovadas na semana (por data de assinatura)
      const { data: vendasAprovadas, error: vendasError } = await supabase
        .from('form_entries')
        .select(`
          id,
          vendedor_id,
          status,
          data_assinatura_contrato,
          curso_id,
          cursos (
            nome
          ),
          agendamentos!form_entry_id (
            id,
            sdr_id,
            data_agendamento
          )
        `)
        .eq('status', 'matriculado')
        .not('data_assinatura_contrato', 'is', null)
        .gte('data_assinatura_contrato', startOfWeek.toISOString().split('T')[0])
        .lte('data_assinatura_contrato', endOfWeek.toISOString().split('T')[0]);

      if (vendasError) {
        console.error('Erro ao buscar vendas aprovadas:', vendasError);
        return;
      }

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
        // Buscar dados dos leads desses agendamentos
        const leadIds = agendamentosWithoutSales.map(a => a.lead_id).filter(Boolean);
        
        if (leadIds.length > 0) {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('id, whatsapp, email')
            .in('id', leadIds);
          
          if (!leadsError && leadsData) {
            // Buscar todos os alunos de vendas pendentes
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
              
              // Usar o utilitário de matching
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
              
              // Converter matches em vendas pendentes
              vendasPendentesPorMatching = Array.from(matches.entries()).map(([agendamentoId, aluno]) => {
                // Buscar dados completos da form_entry correspondente
                return {
                  id: aluno.form_entry_id,
                  status: 'pendente',
                  agendamento_id: agendamentoId,
                  curso_id: null, // Será preenchido depois se necessário
                  sdr_id: null, // Será preenchido depois se necessário
                  cursos: null
                };
              });
              
              console.log('📋 PENDENTES - Via matching:', vendasPendentesPorMatching.length);
            }
          }
        }
      }
      
      console.log('📊 Dados coletados:', {
        agendamentos: agendamentosData?.length,
        vendasAprovadas: vendasAprovadas?.length,
        vendasPendentesDiretas: vendasPendentes?.length,
        vendasPendentesMatching: vendasPendentesPorMatching?.length
      });

      // Combinar todas as vendas pendentes
      const todasVendasPendentes = [...vendasPendentes, ...vendasPendentesPorMatching];

      // Agrupar dados por SDR
      const statsMap = new Map<string, AgendamentosStatsAdmin>();

      // Processar cada agendamento
      agendamentosData?.forEach((agendamento: any) => {
        const sdrId = agendamento.sdr_id;
        const profile = agendamento.profiles;
        const sdrName = profile?.name || 'SDR Desconhecido';
        
        // Filtrar apenas usuários ativos e com tipo SDR
        const isActiveSDR = profile?.ativo === true && 
          ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(profile?.user_type);
        
        if (!isActiveSDR) {
          return; // Pular este usuário se não for SDR ativo
        }

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

        // Determinar status e contagem
        if (agendamento.resultado_reuniao === 'nao_compareceu') {
          stats.naoCompareceram++;
          meetingDetail.status = 'nao_compareceu';
        } else {
          // Verificar se tem venda associada (direta ou por matching)
          const vendaPendente = todasVendasPendentes.find(v => 
            v.id === agendamento.form_entry_id || 
            v.agendamento_id === agendamento.id
          );
          
          if (vendaPendente) {
            stats.pendentes++;
            meetingDetail.status = 'pendente';
            meetingDetail.curso_nome = vendaPendente.cursos?.nome;
          } else {
            stats.compareceram++;
            meetingDetail.status = 'compareceu';
          }
        }

        stats.meetings.push(meetingDetail);
      });

      // Processar vendas convertidas separadamente (por data de assinatura)
      vendasAprovadas?.forEach((venda: any) => {
        // Buscar o agendamento relacionado
        const agendamento = venda.agendamentos?.[0];
        if (!agendamento || !agendamento.sdr_id) return;

        const sdrId = agendamento.sdr_id;
        
        // Verificar se este SDR já está no map (deve estar se foi ativo)
        if (!statsMap.has(sdrId)) {
          // Buscar dados básicos do SDR para vendas convertidas sem reunião na semana
          return; // Por segurança, não processar SDRs que não tiveram reuniões na semana
        }

        const stats = statsMap.get(sdrId)!;
        
        // Adicionar como convertida
        stats.convertidas++;

        // Adicionar aos detalhes
        const meetingDetail: MeetingDetail = {
          id: agendamento.id,
          data_agendamento: agendamento.data_agendamento,
          resultado_reuniao: 'comprou',
          status: 'convertida',
          lead_name: 'Cliente convertido',
          vendedor_name: 'Vendedor',
          data_assinatura: venda.data_assinatura_contrato,
          curso_nome: venda.cursos?.nome
        };

        // Verificar se já não temos esta reunião nos detalhes (pode ter sido processada como pendente antes)
        const existingIndex = stats.meetings.findIndex(m => m.id === agendamento.id);
        if (existingIndex >= 0) {
          // Atualizar a reunião existente
          stats.meetings[existingIndex] = meetingDetail;
          // Ajustar contagens (remover de pendentes ou compareceram)
          if (stats.meetings[existingIndex].status === 'pendente') {
            stats.pendentes--;
          } else if (stats.meetings[existingIndex].status === 'compareceu') {
            stats.compareceram--;
          }
        } else {
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