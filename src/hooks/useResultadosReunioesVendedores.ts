import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { findContactMatches } from '@/utils/contactMatchingUtils';
import { getWeekRange } from '@/utils/semanaUtils';

export interface ResultadosReunioesVendedores {
  vendedor_id: string;
  vendedor_name: string;
  compareceram: number;
  naoCompareceram: number;
  pendentes: number; // Reuniões marcadas como 'comprou' mas sem venda aprovada
  convertidas: number; // Vendas aprovadas baseadas na data de assinatura
  total: number;
}

export const useResultadosReunioesVendedores = (selectedVendedor?: string, weekDate?: Date) => {
  const [statsData, setStatsData] = useState<ResultadosReunioesVendedores[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResultadosReunioesVendedores = async () => {
    try {
      setIsLoading(true);
      
      // Usar função unificada de cálculo de semana
      const targetDate = weekDate || new Date();
      const { start: startOfWeek, end: endOfWeek } = getWeekRange(targetDate);
      
      console.log('🔍 Buscando resultados das reuniões para:', {
        periodo: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
        vendedor: selectedVendedor || 'todos'
      });

      // Query principal para buscar agendamentos com resultado na semana (baseado em data_resultado)
      let agendamentosQuery = supabase
        .from('agendamentos')
        .select(`
          id,
          lead_id,
          vendedor_id,
          resultado_reuniao,
          data_resultado,
          form_entry_id,
          profiles!vendedor_id (
            name
          )
        `)
        .not('resultado_reuniao', 'is', null)
        .gte('data_resultado', startOfWeek.toISOString())
        .lte('data_resultado', endOfWeek.toISOString());

      // Filtrar por vendedor se especificado
      if (selectedVendedor && selectedVendedor !== 'todos') {
        agendamentosQuery = agendamentosQuery.eq('vendedor_id', selectedVendedor);
      }

      const { data: agendamentos, error: agendamentosError } = await agendamentosQuery;

      if (agendamentosError) {
        console.error('Erro ao buscar agendamentos:', agendamentosError);
        return;
      }

      // Buscar vendas aprovadas baseadas na data de assinatura na semana ESPECÍFICA (aparecem como "convertidas")
      let vendasQuery = supabase
        .from('form_entries')
        .select(`
          id,
          vendedor_id,
          status,
          data_assinatura_contrato,
          profiles!vendedor_id (
            name
          )
        `)
        .eq('status', 'matriculado')
        .not('data_assinatura_contrato', 'is', null)
        .gte('data_assinatura_contrato', startOfWeek.toISOString().split('T')[0])
        .lte('data_assinatura_contrato', endOfWeek.toISOString().split('T')[0]);

      if (selectedVendedor && selectedVendedor !== 'todos') {
        vendasQuery = vendasQuery.eq('vendedor_id', selectedVendedor);
      }

      const { data: vendas, error: vendasError } = await vendasQuery;

      if (vendasError) {
        console.error('Erro ao buscar vendas:', vendasError);
        return;
      }

      // Buscar vendas convertidas globalmente para filtrar "comprou" já assinados
      const agendamentosComprou = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && a.form_entry_id) || [];
      const formEntryIds = agendamentosComprou.map(a => a.form_entry_id).filter(Boolean);
      
      // Também buscar "comprou" sem form_entry_id para matching por lead
      const agendamentosComprouSemFormEntry = agendamentos?.filter(a => a.resultado_reuniao === 'comprou' && !a.form_entry_id) || [];
      
      console.log('🔍 DEBUG FILTRO - Agendamentos "comprou":', {
        totalComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').length || 0,
        comprouComFormEntry: agendamentosComprou.length,
        comprouSemFormEntry: agendamentosComprouSemFormEntry.length,
        formEntryIds: formEntryIds,
        detalhesComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').map(a => ({
          id: a.id,
          data_resultado: a.data_resultado,
          form_entry_id: a.form_entry_id,
          vendedor_name: a.profiles?.name
        }))
      });
      
      // Buscar todas as vendas convertidas globalmente (de qualquer período)
      let convertidasGlobal = new Set<string>();
      let allFormEntryIds: string[] = [];
      
      if (formEntryIds.length > 0) {
        allFormEntryIds = [...formEntryIds];
      }
      
      if (allFormEntryIds.length > 0) {
        const { data: vendasGlobal } = await supabase
          .from('form_entries')
          .select('id, status, data_assinatura_contrato, vendedor_id')
          .in('id', allFormEntryIds)
          .eq('status', 'matriculado')
          .not('data_assinatura_contrato', 'is', null);
        
        console.log('🔍 DEBUG FILTRO - Vendas convertidas globalmente:', {
          vendasEncontradas: vendasGlobal?.length || 0,
          detalhesVendas: vendasGlobal?.map(v => ({
            id: v.id,
            status: v.status,
            data_assinatura_contrato: v.data_assinatura_contrato,
            vendedor_id: v.vendedor_id
          }))
        });
        
        vendasGlobal?.forEach(v => convertidasGlobal.add(v.id));
      }
      
      // ADDITIONALLY: Buscar todas as vendas matriculadas dos vendedores da consulta para matching por contato
      let vendedoresQuery = supabase
        .from('form_entries')
        .select(`
          id,
          vendedor_id,
          status,
          data_assinatura_contrato,
          alunos!inner (
            nome,
            email,
            telefone
          )
        `)
        .eq('status', 'matriculado')
        .not('data_assinatura_contrato', 'is', null);

      if (selectedVendedor && selectedVendedor !== 'todos') {
        vendedoresQuery = vendedoresQuery.eq('vendedor_id', selectedVendedor);
      }

      const { data: todasVendasMatriculadas } = await vendedoresQuery;

      // Buscar agendamentos "comprou" sem form_entry_id e fazer matching por lead
      let agendamentosMatchingLeads = new Set<string>();
      if (agendamentosComprouSemFormEntry.length > 0) {
        // Buscar dados dos leads dos agendamentos sem form_entry_id
        const leadIds = agendamentosComprouSemFormEntry.map(a => a.lead_id).filter(Boolean);
        
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabase
            .from('leads')
            .select('id, whatsapp, email')
            .in('id', leadIds);
            
          if (leadsData && leadsData.length > 0 && todasVendasMatriculadas) {
            console.log('🔍 RESUMO - Dados para matching:', {
              leadsComWhatsApp: leadsData.filter(l => l.whatsapp).length,
              leadsComEmail: leadsData.filter(l => l.email).length,
              todasVendasMatriculadas: todasVendasMatriculadas.length
            });
            
            // Usar utilitário unificado para matching com todas as vendas matriculadas
            const alunosData = todasVendasMatriculadas.map(v => ({
              form_entry_id: v.id,
              nome: v.alunos?.nome || '',
              email: v.alunos?.email || '',
              telefone: v.alunos?.telefone || ''
            }));
            
            const agendamentosComLeads = agendamentosComprouSemFormEntry.map(a => ({
              id: a.id,
              lead_id: a.lead_id
            }));
            
            const matches = findContactMatches(agendamentosComLeads, leadsData, alunosData);
            
            // Converter matches para o Set existente
            matches.forEach((_, agendamentoId) => {
              agendamentosMatchingLeads.add(agendamentoId);
            });
            
            console.log('🔍 RESUMO - Resultado do matching unificado:', {
              agendamentosComMatching: agendamentosMatchingLeads.size,
              detalhesMatching: Array.from(agendamentosMatchingLeads)
            });
          }
        }
      }

      // Buscar status atual de todos os form_entries dos agendamentos "comprou" para diagnóstico
      const formEntryStatusMap = new Map<string, string>();
      if (formEntryIds.length > 0) {
        const { data: allFormEntries } = await supabase
          .from('form_entries')
          .select('id, status, data_assinatura_contrato')
          .in('id', formEntryIds);
        
        allFormEntries?.forEach(entry => {
          formEntryStatusMap.set(entry.id, entry.status);
        });
      }

      console.log('📊 DADOS FINAIS - Comparação detalhada:', {
        agendamentosTotal: agendamentos?.length || 0,
        vendasDaSemana: vendas?.length || 0,
        comprouComFormEntry: agendamentosComprou.length,
        comprouSemFormEntry: agendamentosComprouSemFormEntry.length,
        convertidasGlobal: convertidasGlobal.size,
        matchingLeads: agendamentosMatchingLeads.size,
        formEntryStatusMap: Object.fromEntries(formEntryStatusMap),
        periodoConsulta: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
      });

      // Agrupar dados por vendedor
      const statsMap = new Map<string, ResultadosReunioesVendedores>();

      // Processar agendamentos
      agendamentos?.forEach((agendamento: any) => {
        const vendedorId = agendamento.vendedor_id;
        const vendedorName = agendamento.profiles?.name || 'Vendedor Desconhecido';

        if (!statsMap.has(vendedorId)) {
          statsMap.set(vendedorId, {
            vendedor_id: vendedorId,
            vendedor_name: vendedorName,
            compareceram: 0,
            naoCompareceram: 0,
            pendentes: 0,
            convertidas: 0,
            total: 0
          });
        }

        const stats = statsMap.get(vendedorId)!;
        stats.total++;

        switch (agendamento.resultado_reuniao) {
          case 'comprou':
            // Verificar se há form_entry_id e seu status
            let jaConvertidoPorFormEntry = false;
            let statusFormEntry = null;
            
            if (agendamento.form_entry_id) {
              // Se tem form_entry_id, verificar se está matriculado
              jaConvertidoPorFormEntry = convertidasGlobal.has(agendamento.form_entry_id);
              statusFormEntry = formEntryStatusMap.get(agendamento.form_entry_id) || null;
            }
            
            const jaConvertidoPorLead = agendamentosMatchingLeads.has(agendamento.id);
            const jaConvertido = jaConvertidoPorFormEntry || jaConvertidoPorLead;
            
            console.log('🔍 DEBUG COMPROU DETALHADO - Processando agendamento:', {
              agendamento_id: agendamento.id,
              form_entry_id: agendamento.form_entry_id,
              statusFormEntry,
              jaConvertidoPorFormEntry,
              jaConvertidoPorLead,
              jaConvertido,
              vendedor: vendedorName,
              data_resultado: agendamento.data_resultado,
              lead_id: agendamento.lead_id
            });
            
            if (!jaConvertido) {
              stats.pendentes++;
              console.log('✅ CONTANDO COMO PENDENTE - Motivo:', {
                temFormEntry: !!agendamento.form_entry_id,
                statusFormEntry,
                formEntryMatriculado: jaConvertidoPorFormEntry,
                temMatchingLead: jaConvertidoPorLead
              });
            } else {
              console.log('❌ NÃO contando como pendente - Motivo:', {
                convertidoPorFormEntry: jaConvertidoPorFormEntry,
                convertidoPorLead: jaConvertidoPorLead,
                statusFormEntry
              });
            }
            break;
          case 'compareceu_nao_comprou':
          case 'presente':
          case 'compareceu':
            stats.compareceram++;
            break;
          case 'nao_compareceu':
          case 'ausente':
            stats.naoCompareceram++;
            break;
        }
      });

      // Processar vendas aprovadas (convertidas)
      vendas?.forEach((venda: any) => {
        const vendedorId = venda.vendedor_id;
        const vendedorName = venda.profiles?.name || 'Vendedor Desconhecido';

        if (!statsMap.has(vendedorId)) {
          statsMap.set(vendedorId, {
            vendedor_id: vendedorId,
            vendedor_name: vendedorName,
            compareceram: 0,
            naoCompareceram: 0,
            pendentes: 0,
            convertidas: 0,
            total: 0
          });
        }

        const stats = statsMap.get(vendedorId)!;
        stats.convertidas++;
      });

      const finalStats = Array.from(statsMap.values());
      
      console.log('📈 RESUMO - Estatísticas finais UNIFICADAS:', finalStats.map(s => ({
        vendedor: s.vendedor_name,
        compareceram: s.compareceram,
        naoCompareceram: s.naoCompareceram,
        pendentes: s.pendentes,
        convertidas: s.convertidas,
        total: s.total
      })));
      
      // Log específico para debugging de inconsistências
      if (selectedVendedor && selectedVendedor !== 'todos') {
        const vendedorStats = finalStats.find(s => s.vendedor_id === selectedVendedor);
        if (vendedorStats) {
          console.log('🔍 RESUMO - DEBUGGING para vendedor específico:', {
            vendedor_id: selectedVendedor,
            vendedor_name: vendedorStats.vendedor_name,
            PENDENTES: vendedorStats.pendentes,
            totalAgendamentosComprou: agendamentos?.filter(a => 
              a.vendedor_id === selectedVendedor && a.resultado_reuniao === 'comprou'
            ).length || 0,
            convertidasGlobal: convertidasGlobal.size,
            matchingLeads: agendamentosMatchingLeads.size
          });
        }
      }

      setStatsData(finalStats);
    } catch (error) {
      console.error('Erro ao buscar resultados das reuniões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResultadosReunioesVendedores();
  }, [selectedVendedor, weekDate]);

  return {
    statsData,
    isLoading,
    fetchResultadosReunioesVendedores
  };
};