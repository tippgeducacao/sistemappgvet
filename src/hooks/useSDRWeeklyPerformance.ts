import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';
import { getDataEfetivaVenda, isVendaInWeek } from '@/utils/vendaDateUtils';
import { findContactMatches, isContactMatch, type LeadContact, type AlunoContact } from '@/utils/contactMatchingUtils';

export interface MeetingDetail {
  id: string;
  data_agendamento: string;
  resultado_reuniao: string;
  status: 'convertida' | 'pendente' | 'compareceu' | 'nao_compareceu';
  lead_name: string;
  vendedor_name: string;
  sdr_name: string;
  data_assinatura?: string;
  curso_nome?: string;
}

export interface SDRWeeklyPerformance {
  sdr_id: string;
  sdr_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  taxaConversao: number;
  taxaComparecimento: number;
  meetings: MeetingDetail[];
}

// Helper para lidar com retornos que podem vir como array ou objeto
const getFirst = <T,>(value: T | T[] | null | undefined): T | undefined =>
  Array.isArray(value) ? value[0] : (value || undefined);

export const useSDRWeeklyPerformance = (weekDate?: Date) => {
  const [performanceData, setPerformanceData] = useState<SDRWeeklyPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSDRPerformance = async () => {
    try {
      setIsLoading(true);
      
      const targetDate = weekDate || new Date();
      const { start: startOfWeek, end: endOfWeek } = getWeekRange(targetDate);

      console.log('🗓️ Buscando performance SDR da semana:', { 
        startOfWeek: startOfWeek.toISOString(), 
        endOfWeek: endOfWeek.toISOString(),
        startOfWeek_br: startOfWeek.toLocaleDateString('pt-BR'),
        endOfWeek_br: endOfWeek.toLocaleDateString('pt-BR')
      });
      
      // Buscar todos os agendamentos da semana para SDRs ativos
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          sdr_id,
          vendedor_id,
          lead_id,
          resultado_reuniao,
          data_agendamento,
          form_entry_id,
          status
        `)
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      // Criar um pool amplo de agendamentos recentes para matching (últimos 90 dias)
      const poolStart = new Date(endOfWeek);
      poolStart.setDate(poolStart.getDate() - 90);

      const { data: agendamentosPool, error: agendamentosPoolError } = await supabase
        .from('agendamentos')
        .select(`
          id,
          sdr_id,
          vendedor_id,
          lead_id,
          resultado_reuniao,
          data_agendamento,
          form_entry_id,
          status
        `)
        .gte('data_agendamento', poolStart.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      if (agendamentosPoolError) {
        console.error('Erro ao buscar agendamentos pool:', agendamentosPoolError);
      }

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      console.log('📊 Agendamentos semana/pool:', {
        semana: agendamentosData?.length || 0,
        pool: agendamentosPool?.length || 0
      });

      // Carregar perfis e leads via consultas separadas (evita dependência de FKs)
      const allAgs = [...(agendamentosData || []), ...(agendamentosPool || [])];
      const sdrIds = Array.from(new Set(allAgs.map(a => a.sdr_id).filter(Boolean)));
      const vendedorIds = Array.from(new Set(allAgs.map(a => a.vendedor_id).filter(Boolean)));
      const leadIdsAll = Array.from(new Set(allAgs.map(a => a.lead_id).filter(Boolean)));
      const profileIds = Array.from(new Set([...(sdrIds as string[]), ...(vendedorIds as string[])]));

      const profilesMap = new Map<string, { id: string; name?: string; user_type?: string; ativo?: boolean }>();
      if (profileIds.length > 0) {
        const { data: perfis, error: perfisError } = await supabase
          .from('profiles')
          .select('id, name, user_type, ativo')
          .in('id', profileIds);
        if (perfisError) {
          console.warn('Aviso: erro ao carregar perfis (seguiremos sem nomes):', perfisError);
        } else if (perfis) {
          perfis.forEach(p => profilesMap.set(p.id, p));
        }
      }

      const leadsMap = new Map<string, { id: string; nome?: string; whatsapp?: string; email?: string }>();
      if (leadIdsAll.length > 0) {
        const { data: leadsList, error: leadsError } = await supabase
          .from('leads')
          .select('id, nome, whatsapp, email')
          .in('id', leadIdsAll as string[]);
        if (leadsError) {
          console.warn('Aviso: erro ao carregar leads para matching:', leadsError);
        } else if (leadsList) {
          leadsList.forEach(l => leadsMap.set(l.id, l));
        }
      }

      // Buscar todas as vendas aprovadas para verificar conversões
      const { data: vendasAprovadas, error: vendasError } = await supabase
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
          ),
          sdr:profiles!sdr_id (
            name
          ),
          vendedor:profiles!vendedor_id (
            name
          ),
          alunos (
            nome,
            telefone,
            email
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

      // Filtrar vendas aprovadas que foram assinadas na semana atual
      const vendasAprovadasNaSemana = vendasAprovadas?.filter(venda => {
        const dataEfetiva = getDataEfetivaVenda(venda);
        const isInWeek = dataEfetiva >= startOfWeek && dataEfetiva <= endOfWeek;
        
        // Log para debug de datas
        if (venda.sdr_id && venda.sdr?.name?.toLowerCase()?.includes('sdr in')) {
          console.log('📅 SDR IN - Checando venda:', {
            venda_id: venda.id?.substring(0, 8),
            data_efetiva: dataEfetiva.toISOString(),
            data_efetiva_br: dataEfetiva.toLocaleDateString('pt-BR'),
            startOfWeek_br: startOfWeek.toLocaleDateString('pt-BR'),
            endOfWeek_br: endOfWeek.toLocaleDateString('pt-BR'),
            isInWeek,
            sdr_name: venda.sdr?.name,
            data_assinatura_contrato: venda.data_assinatura_contrato
          });
        }
        
        return isInWeek;
      }) || [];
      
      console.log('📈 Vendas aprovadas na semana:', vendasAprovadasNaSemana?.length);

      // Agrupar dados por SDR
      const performanceMap = new Map<string, SDRWeeklyPerformance>();

      // Função auxiliar para garantir que um SDR está no map
      const ensureSDRInMap = (sdrId: string, sdrName: string, isActive: boolean = true) => {
        if (!isActive) return false;
        
        if (!performanceMap.has(sdrId)) {
          performanceMap.set(sdrId, {
            sdr_id: sdrId,
            sdr_name: sdrName,
            convertidas: 0,
            compareceram: 0,
            naoCompareceram: 0,
            taxaConversao: 0,
            taxaComparecimento: 0,
            meetings: []
          });
        }
        return true;
      };

      // Processar agendamentos da semana
      agendamentosData?.forEach((agendamento: any) => {
        const sdrId = agendamento.sdr_id;
        const sdrProfile = profilesMap.get(sdrId);
        const vendedorProfile = agendamento.vendedor_id ? profilesMap.get(agendamento.vendedor_id) : undefined;
        const sdrName = sdrProfile?.name || 'SDR Desconhecido';
        
        // Log específico para SDR IN
        if (sdrName?.toLowerCase()?.includes('sdr in') || sdrName === 'SDR IN') {
          console.log('🔍 SDR IN - Processando agendamento:', {
            id: agendamento.id,
            data_agendamento: agendamento.data_agendamento,
            data_br: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR'),
            resultado_reuniao: agendamento.resultado_reuniao,
            status: agendamento.status,
            lead_nome: leadsMap.get(agendamento.lead_id)?.nome,
            form_entry_id: agendamento.form_entry_id
          });
        }
        
        // Incluir SDR se tem sdr_id e (perfil ativo ou perfil indisponível por RLS)
        const shouldIncludeSDR = !!(sdrId) && (sdrProfile ? sdrProfile.ativo !== false : true);
        if (!shouldIncludeSDR) return;
        if (!ensureSDRInMap(sdrId, sdrName, true)) return;

        const performance = performanceMap.get(sdrId)!;

        // Criar objeto de detalhe da reunião
        const meetingDetail: MeetingDetail = {
          id: agendamento.id,
          data_agendamento: agendamento.data_agendamento,
          resultado_reuniao: agendamento.resultado_reuniao || 'Sem resultado',
          status: 'compareceu', // Default, será ajustado abaixo
          lead_name: (leadsMap.get(agendamento.lead_id)?.nome) || 'Lead desconhecido',
          vendedor_name: vendedorProfile?.name || 'Vendedor desconhecido',
          sdr_name: sdrName
        };

        // Normalizar resultado para comparação robusta (suporta 'realizado' e 'realizada')
        const resultado = (agendamento.resultado_reuniao || '').toLowerCase();

        // Contabilização de presença
        if (resultado === 'nao_compareceu') {
          performance.naoCompareceram++;
          meetingDetail.status = 'nao_compareceu';
        } else if (resultado === 'comprou') {
          // Reunião "comprou" sempre conta como comparecimento (nova lógica)
          performance.compareceram++;
          meetingDetail.status = 'compareceu';
          
          if (sdrName?.toLowerCase()?.includes('sdr in') || sdrName === 'SDR IN') {
            console.log('🟢 SDR IN - Reunião "comprou" conta como comparecimento:', {
              agendamento_id: agendamento.id,
              data: agendamento.data_agendamento,
              data_br: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')
            });
          }
        } else if (
          resultado === 'nao_comprou' ||
          resultado === 'compareceu_nao_comprou' ||
          resultado === 'presente' ||
          resultado === 'compareceu' ||
          resultado.startsWith('realizad') // cobre 'realizado' e 'realizada'
        ) {
          performance.compareceram++;
          meetingDetail.status = 'compareceu';
          
          if (sdrName?.toLowerCase()?.includes('sdr in') || sdrName === 'SDR IN') {
            console.log('🟡 SDR IN - Contando comparecimento:', {
              agendamento_id: agendamento.id,
              resultado_reuniao: agendamento.resultado_reuniao,
              data: agendamento.data_agendamento,
              data_br: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')
            });
          }
        } else {
          // Reuniões sem resultado (não finalizadas) são desconsideradas
          if (sdrName?.toLowerCase()?.includes('sdr in') || sdrName === 'SDR IN') {
            console.log('⚪ SDR IN - Reunião não finalizada (desconsiderada):', {
              agendamento_id: agendamento.id,
              resultado_reuniao: agendamento.resultado_reuniao,
              status: agendamento.status,
              data: agendamento.data_agendamento,
              data_br: new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')
            });
          }
          return; // não adiciona em meetings
        }

        performance.meetings.push(meetingDetail);
      });

      // NOVA LÓGICA: Processar vendas aprovadas com data de assinatura na semana como conversões separadas
      vendasAprovadasNaSemana?.forEach((venda: any) => {
        console.log('🔍 MATCHING - Processando venda:', {
          venda_id: venda.id?.substring(0, 8),
          sdr_id: venda.sdr_id,
          sdr_name: venda.sdr?.name,
          aluno_nome: venda.alunos?.[0]?.nome,
          aluno_telefone: venda.alunos?.[0]?.telefone,
          aluno_email: venda.alunos?.[0]?.email
        });

        const vendaSdr = getFirst(venda.sdr);
        const vendaVendedor = getFirst(venda.vendedor);
        let sdrId = venda.sdr_id;
        let sdrName = vendaSdr?.name || 'SDR Desconhecido';
        
        // Se não tem sdr_id, tentar encontrar através de matching por contato
        if (!sdrId && venda.alunos?.[0]) {
          const alunoData = venda.alunos[0];
          
          console.log('🔍 MATCHING - Venda sem SDR, buscando por matching:', {
            venda_id: venda.id?.substring(0, 8),
            aluno_telefone: alunoData.telefone,
            aluno_email: alunoData.email
          });
          
          // Procurar agendamento com o mesmo vendedor que tenha contato matching
          const agendamentoMatching = agendamentosPool?.find((ag: any) => {
            if (ag.vendedor_id !== venda.vendedor_id || !ag.sdr_id) return false;
            
            const leadFromMap = leadsMap.get(ag.lead_id);
            const leadData: LeadContact = {
              id: ag.lead_id,
              whatsapp: leadFromMap?.whatsapp,
              email: leadFromMap?.email
            };
            
            const alunoContact: AlunoContact = {
              form_entry_id: venda.id,
              nome: alunoData.nome,
              telefone: alunoData.telefone,
              email: alunoData.email
            };
            
            const isMatch = isContactMatch(leadData, alunoContact);
            
            if (isMatch) {
              console.log('✅ MATCHING - Match encontrado:', {
                agendamento_id: ag.id,
                lead_whatsapp: leadFromMap?.whatsapp,
                lead_email: leadFromMap?.email,
                aluno_telefone: alunoData.telefone,
                aluno_email: alunoData.email,
                sdr_id: ag.sdr_id,
                sdr_name: profilesMap.get(ag.sdr_id)?.name
              });
            }
            
            return isMatch;
          });
          
          if (agendamentoMatching) {
            sdrId = agendamentoMatching.sdr_id;
            sdrName = profilesMap.get(agendamentoMatching.sdr_id)?.name || 'SDR via Matching';
            
            // Atualizar a venda com o sdr_id encontrado (opcional, para futuras consultas)
            supabase
              .from('form_entries')
              .update({ sdr_id: sdrId })
              .eq('id', venda.id)
              .then(() => {
                console.log('✅ MATCHING - SDR atualizado na venda:', {
                  venda_id: venda.id?.substring(0, 8),
                  sdr_id: sdrId
                });
              });
          } else {
            console.log('❌ MATCHING - Nenhum agendamento matching encontrado para venda:', venda.id?.substring(0, 8));
          }
        }
        
        if (sdrId) {
          // Verificar se é uma venda com data de assinatura na semana
          const isInWeek = isVendaInWeek(venda, startOfWeek, endOfWeek);
          
          if (isInWeek && ensureSDRInMap(sdrId, sdrName, true)) {
            const performance = performanceMap.get(sdrId)!;
            
            // Verificar se a venda está vinculada a uma reunião através de:
            // 1. form_entry_id direto no agendamento
            // 2. Matching por contato entre lead e aluno
            const agendamentoVinculado = agendamentosPool?.find((ag: any) => {
              // Vinculação direta
              if (ag.form_entry_id === venda.id) return true;
              
              // Vinculação por matching de contato
              if (ag.sdr_id === sdrId && venda.alunos?.[0]) {
                const leadFromMap2 = leadsMap.get(ag.lead_id);
                const leadData: LeadContact = {
                  id: ag.lead_id,
                  whatsapp: leadFromMap2?.whatsapp,
                  email: leadFromMap2?.email
                };
                
                const alunoContact: AlunoContact = {
                  form_entry_id: venda.id,
                  nome: venda.alunos[0].nome,
                  telefone: venda.alunos[0].telefone,
                  email: venda.alunos[0].email
                };
                
                return isContactMatch(leadData, alunoContact);
              }
              
              return false;
            });
            
            if (agendamentoVinculado) {
              performance.convertidas++;
              
              // Adicionar como meeting detail para exibição
              const conversionDetail: MeetingDetail = {
                id: venda.id,
                data_agendamento: getDataEfetivaVenda(venda).toISOString(),
                resultado_reuniao: 'Venda Aprovada',
                status: 'convertida',
                lead_name: venda.alunos?.[0]?.nome || 'Aluno matriculado',
                vendedor_name: vendaVendedor?.name || 'Sistema',
                sdr_name: sdrName,
                data_assinatura: venda.data_assinatura_contrato || venda.data_aprovacao?.split('T')[0],
                curso_nome: venda.cursos?.nome
              };
              
              performance.meetings.push(conversionDetail);
              
              console.log('✅ CONVERSÃO - Venda adicionada como conversão:', {
                venda_id: venda.id?.substring(0, 8),
                sdr_name: sdrName,
                data_assinatura: venda.data_assinatura_contrato,
                curso: venda.cursos?.nome,
                tipo_vinculacao: agendamentoVinculado.form_entry_id === venda.id ? 'direta' : 'matching'
              });
            } else {
              console.log('⚠️ CONVERSÃO - Venda não vinculada a agendamento:', {
                venda_id: venda.id?.substring(0, 8),
                sdr_name: sdrName,
                tem_aluno: !!venda.alunos?.[0]
              });
            }
          }
        } else {
          console.log('❌ CONVERSÃO - Venda sem SDR identificado:', {
            venda_id: venda.id?.substring(0, 8),
            vendedor_id: venda.vendedor_id
          });
        }
      });

      // Calcular taxas para cada SDR
      performanceMap.forEach((performance) => {
        const totalCompareceram = performance.convertidas + performance.compareceram;
        const totalReunioesAgendadas = totalCompareceram + performance.naoCompareceram;
        
        // Taxa de conversão: convertidas / (compareceram + convertidas)
        performance.taxaConversao = totalCompareceram > 0 
          ? (performance.convertidas / totalCompareceram) * 100 
          : 0;
        
        // Taxa de comparecimento: (compareceram + convertidas) / total agendadas
        performance.taxaComparecimento = totalReunioesAgendadas > 0 
          ? (totalCompareceram / totalReunioesAgendadas) * 100 
          : 0;
      });

      const finalPerformance = Array.from(performanceMap.values());
      
      console.log('📊 Performance SDR calculada:', finalPerformance);
      
      setPerformanceData(finalPerformance);
    } catch (error) {
      console.error('Erro ao buscar performance dos SDRs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSDRPerformance();
  }, [weekDate]);

  return {
    performanceData,
    isLoading,
    fetchSDRPerformance
  };
};