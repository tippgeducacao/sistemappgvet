import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      
      console.log('🔍 Buscando resultados das reuniões para:', {
        periodo: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
        vendedor: selectedVendedor || 'todos'
      });

      // Query principal para buscar agendamentos com resultado na semana (baseado em data_resultado)
      let agendamentosQuery = supabase
        .from('agendamentos')
        .select(`
          id,
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

      // Query para buscar vendas aprovadas baseadas na data de assinatura na semana
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
      
      console.log('🔍 DEBUG FILTRO - Agendamentos "comprou":', {
        totalComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').length || 0,
        comprouComFormEntry: agendamentosComprou.length,
        formEntryIds: formEntryIds,
        detalhesComprou: agendamentos?.filter(a => a.resultado_reuniao === 'comprou').map(a => ({
          id: a.id,
          data_resultado: a.data_resultado,
          form_entry_id: a.form_entry_id,
          vendedor_name: a.profiles?.name
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
        
        console.log('🔍 DEBUG FILTRO - Vendas convertidas globalmente:', {
          vendasEncontradas: vendasGlobal?.length || 0,
          detalhesVendas: vendasGlobal?.map(v => ({
            id: v.id,
            status: v.status,
            data_assinatura_contrato: v.data_assinatura_contrato
          }))
        });
        
        vendasGlobal?.forEach(v => convertidasGlobal.add(v.id));
      }

      console.log('📊 Dados encontrados:', {
        agendamentos: agendamentos?.length || 0,
        vendas: vendas?.length || 0,
        comprouTotal: agendamentosComprou.length,
        comprouJaConvertidos: convertidasGlobal.size,
        convertidasGlobalSet: Array.from(convertidasGlobal)
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
            // Só conta como pendente se NÃO foi convertido globalmente
            const jaConvertido = agendamento.form_entry_id && convertidasGlobal.has(agendamento.form_entry_id);
            
            console.log('🔍 DEBUG COMPROU - Processando agendamento:', {
              agendamento_id: agendamento.id,
              form_entry_id: agendamento.form_entry_id,
              jaConvertido,
              vendedor: vendedorName,
              data_resultado: agendamento.data_resultado,
              convertidasGlobalContains: agendamento.form_entry_id ? convertidasGlobal.has(agendamento.form_entry_id) : 'sem form_entry_id'
            });
            
            if (!jaConvertido) {
              stats.pendentes++;
              console.log('✅ Contando como PENDENTE');
            } else {
              console.log('❌ NÃO contando como pendente (já convertido)');
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
      
      console.log('📈 Estatísticas finais:', finalStats.map(s => ({
        vendedor: s.vendedor_name,
        compareceram: s.compareceram,
        naoCompareceram: s.naoCompareceram,
        pendentes: s.pendentes,
        convertidas: s.convertidas,
        total: s.total
      })));

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