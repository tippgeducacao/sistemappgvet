import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWeekRange } from '@/utils/semanaUtils';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

export interface SDRWeeklyPerformance {
  sdr_id: string;
  sdr_name: string;
  convertidas: number;
  compareceram: number;
  naoCompareceram: number;
  taxaConversao: number;
  taxaComparecimento: number;
}

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
        endOfWeek: endOfWeek.toISOString() 
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
        .gte('data_agendamento', startOfWeek.toISOString())
        .lte('data_agendamento', endOfWeek.toISOString());

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
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
        return dataEfetiva >= startOfWeek && dataEfetiva <= endOfWeek;
      }) || [];

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
            taxaComparecimento: 0
          });
        }
        return true;
      };

      // Processar agendamentos da semana
      agendamentosData?.forEach((agendamento: any) => {
        const sdrId = agendamento.sdr_id;
        const profile = agendamento.profiles;
        const sdrName = profile?.name || 'SDR Desconhecido';
        
        // Filtrar apenas usuários ativos e com tipo SDR
        const isActiveSDR = profile?.ativo === true && 
          ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(profile?.user_type);
        
        if (!ensureSDRInMap(sdrId, sdrName, isActiveSDR)) return;

        const performance = performanceMap.get(sdrId)!;

        // Categorizar baseado no resultado da reunião
        if (agendamento.resultado_reuniao === 'nao_compareceu') {
          performance.naoCompareceram++;
        } else if (agendamento.resultado_reuniao === 'comprou') {
          // Verificar se existe venda aprovada correspondente a esta reunião
          let vendaAprovadaCorrespondente = null;
          
          // Primeiro tentar por form_entry_id direto
          if (agendamento.form_entry_id) {
            vendaAprovadaCorrespondente = vendasAprovadasNaSemana.find(v => v.id === agendamento.form_entry_id);
          }
          
          // Se não encontrou por form_entry_id, tentar matching por contato
          if (!vendaAprovadaCorrespondente && agendamento.lead_id) {
            const leadDoAgendamento = leadsData?.find(lead => lead.id === agendamento.lead_id);
            if (leadDoAgendamento) {
              vendaAprovadaCorrespondente = vendasAprovadasNaSemana?.find(venda => {
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
            performance.convertidas++;
          } else {
            performance.compareceram++; // Comprou mas ainda não foi aprovado ou aprovado em outra semana
          }
        } else if (agendamento.status === 'remarcado' || 
                   agendamento.resultado_reuniao === 'nao_comprou' || 
                   agendamento.resultado_reuniao === 'presente' ||
                   agendamento.resultado_reuniao === 'compareceu' ||
                   !agendamento.resultado_reuniao) {
          performance.compareceram++;
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