import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useVendas } from '@/hooks/useVendas';
import { useComissionamento } from '@/hooks/useComissionamento';
import { useNiveis } from '@/hooks/useNiveis';
import { useSDRAgendamentosSemanaCompleto } from '@/hooks/useSDRAgendamentosSemanaCompleto';
import { supabase } from '@/integrations/supabase/client';
import { isVendaInWeek } from '@/utils/vendaDateUtils';
import AgendamentosRow from './AgendamentosRow';
import { Calendar } from 'lucide-react';

export const SDRMetasSemanais = () => {
  const { profile } = useAuthStore();
  const { getMesAnoSemanaAtual } = useMetasSemanais();
  
  // Usar a lógica de semanas também no SDR
  const { mes: mesCorreto, ano: anoCorreto } = getMesAnoSemanaAtual();
  const [selectedMonth, setSelectedMonth] = useState(mesCorreto);
  const [selectedYear, setSelectedYear] = useState(anoCorreto);
  
  const { 
    getMetaSemanalSDR, 
    getSemanasDoMes, 
    getDataInicioSemana, 
    getDataFimSemana 
  } = useMetasSemanaisSDR();
  
  const { vendas } = useVendas(); // Mudança: agora usar vendas ao invés de agendamentos
  const { calcularComissao } = useComissionamento('sdr');
  const { niveis } = useNiveis();
  const { fetchAgendamentosSemanaCompleto } = useSDRAgendamentosSemanaCompleto();

  if (!profile) return null;

  const semanas = getSemanasDoMes(selectedYear, selectedMonth);
  
  console.log(`🔍 SETEMBRO 2025 DEBUG: Semanas calculadas para ${selectedMonth}/${selectedYear}:`, semanas);
  
  const getVendasNaSemana = (semana: number) => {
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    console.log(`📅 Semana ${semana}: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`);
    
    return vendas?.filter(venda => {
      if (venda.vendedor_id !== profile.id) return false;
      
      // Contar apenas vendas matriculadas (cursos vendidos com sucesso)
      if (venda.status !== 'matriculado') return false;
      
      // Usar data efetiva da venda (data de assinatura do contrato se disponível)
      const { isVendaInWeek } = require('@/utils/vendaDateUtils');
      return isVendaInWeek(venda, startDate, endDate);
    }) || [];
  };

  // Criar função contextualizada para agendamentos
  const getAgendamentosNaSemanaContexto = (targetYear: number, targetMonth: number) => {
    return async (semana: number) => {
      const startDate = getDataInicioSemana(targetYear, targetMonth, semana);
      const endDate = getDataFimSemana(targetYear, targetMonth, semana);
      
      console.log(`🗓️ CONTEXTO ESPECÍFICO - Buscando agendamentos para:`, {
        semana,
        targetMonth,
        targetYear,
        periodo: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (!profile?.id) return { realizados: 0, meta: 0, percentual: 0 };

      try {
        // Garantir que só busca agendamentos realmente do período específico
        const startDateFormatted = new Date(startDate);
        startDateFormatted.setHours(0, 0, 0, 0);
        
        const endDateFormatted = new Date(endDate);
        endDateFormatted.setHours(23, 59, 59, 999);
        
        console.log(`🔍 CONSULTA EXATA CONTEXTUALIZADA:`, {
          sdr_id: profile.id,
          data_inicio: startDateFormatted.toISOString(),
          data_fim: endDateFormatted.toISOString(),
          mes_consultado: targetMonth,
          ano_consultado: targetYear,
          semana_consultada: semana
        });
        
        // Buscar agendamentos da semana específica que tiveram resultado positivo E já aconteceram
        const agora = new Date();
        const { data: agendamentos, error } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('sdr_id', profile.id)
          .gte('data_agendamento', startDateFormatted.toISOString())
          .lte('data_agendamento', endDateFormatted.toISOString())
          .lt('data_agendamento', agora.toISOString()) // Só reuniões que já passaram
          .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

        if (error) {
          console.error('❌ Erro na consulta de agendamentos:', error);
          throw error;
        }

        console.log(`📊 RESULTADO CONTEXTUALIZADO da consulta:`, {
          semana,
          mes: targetMonth,
          ano: targetYear,
          agendamentosEncontrados: agendamentos?.length || 0,
          agendamentos: agendamentos?.map(a => ({
            id: a.id,
            data_agendamento: a.data_agendamento,
            resultado: a.resultado_reuniao
          }))
        });

        // Buscar configuração do nível diretamente do perfil
        const nivelSDR = profile?.nivel || 'junior';

        // Buscar configuração do nível para SDR
        const { data: nivelConfig, error: nivelError } = await supabase
          .from('niveis_vendedores')
          .select('meta_semanal_inbound, meta_vendas_cursos')
          .eq('nivel', nivelSDR)
          .eq('tipo_usuario', 'sdr')
          .single();

        if (nivelError) {
          console.error('❌ Erro ao buscar nível SDR:', nivelError);
          return { realizados: 0, meta: 0, percentual: 0 };
        }

        const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;
        const realizados = agendamentos?.length || 0;
        const percentual = metaAgendamentos > 0 ? (realizados / metaAgendamentos) * 100 : 0;

        const resultado = {
          realizados,
          meta: metaAgendamentos,
          percentual: Math.round(percentual)
        };

        console.log(`✅ RESULTADO FINAL CONTEXTUALIZADO para semana ${semana} do mês ${targetMonth}/${targetYear}:`, resultado);

        return resultado;
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return { realizados: 0, meta: 0, percentual: 0 };
      }
    };
  };

  const calcularComissaoSemana = async (cursosVendidos: number, metaCursos: number) => {
    if (!profile) return { valor: 0, multiplicador: 0, percentual: 0 };
    
    // Buscar configuração do nível SDR
    const nivelSDR = niveis.find(nivel => 
      nivel.nivel === profile.nivel && nivel.tipo_usuario === 'sdr'
    );
    
    if (!nivelSDR) return { valor: 0, multiplicador: 0, percentual: 0 };
    
    // Calcular comissão baseada nos cursos vendidos vs meta de cursos
    const comissao = await calcularComissao(
      cursosVendidos, 
      metaCursos, 
      nivelSDR.variavel_semanal
    );
    
    return comissao;
  };

  const formatPeriodo = (semana: number) => {
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    return `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')} - ${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const isCurrentWeek = (semana: number) => {
    const now = new Date();
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    return now >= startDate && now <= endDate;
  };

  const getStatusBadge = (percentualAgendamentos: number, isAtual: boolean) => {
    if (isAtual) {
      return <Badge variant="secondary">Atual</Badge>;
    }
    
    // Status baseado na meta de agendamentos (100% para meta batida)
    if (percentualAgendamentos >= 100) {
      return <Badge className="bg-emerald-500 text-white">Meta Batida</Badge>;
    } else if (percentualAgendamentos > 0) {
      return <Badge variant="destructive" className="bg-red-500 text-white">Não Bateu</Badge>;
    }
    
    return <Badge variant="outline" className="text-gray-500">Sem Atividade</Badge>;
  };

  const mesesOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  // Calcular totais
  const totalMeta = semanas.reduce((acc, semana) => {
    const meta = getMetaSemanalSDR(profile.id, selectedYear, semana);
    return acc + (meta?.meta_vendas_cursos || 0);
  }, 0);

  const totalRealizado = semanas.reduce((acc, semana) => {
    const vendasNaSemana = getVendasNaSemana(semana);
    return acc + vendasNaSemana.length;
  }, 0);

  const percentualTotal = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

  // Calcular comissão total do mês
  const calcularComissaoTotal = async () => {
    if (!profile) return 0;
    
    let comissaoTotal = 0;
    
    for (const semana of semanas) {
      const vendasNaSemana = getVendasNaSemana(semana);
      const meta = getMetaSemanalSDR(profile.id, selectedYear, semana);
      const metaValue = meta?.meta_vendas_cursos || 0;
      
      if (metaValue > 0) {
        const comissao = await calcularComissaoSemana(vendasNaSemana.length, metaValue);
        comissaoTotal += comissao.valor;
      }
    }
    
    return comissaoTotal;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metas Semanais - {mesesOptions.find(m => m.value === selectedMonth)?.label} de {selectedYear}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesOptions.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
             <thead>
               <tr className="border-b">
                 <th className="text-left p-3 font-medium text-muted-foreground">Semana</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Período</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Meta Agendamentos</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Agendamentos</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">% Agendamentos</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Multiplicador</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Comissão</th>
                 <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
               </tr>
             </thead>
            <tbody>
              {semanas.map((semana) => {
                const meta = getMetaSemanalSDR(profile.id, selectedYear, semana);
                const vendasNaSemana = getVendasNaSemana(semana);
                const realizado = vendasNaSemana.length;
                const metaValue = meta?.meta_vendas_cursos || 0; // Usar meta do banco de dados
                const percentual = metaValue > 0 ? (realizado / metaValue) * 100 : 0;
                const isAtual = isCurrentWeek(semana);

                return (
                  <AgendamentosRow 
                    key={`${selectedYear}-${selectedMonth}-${semana}`}
                    semana={semana}
                    formatPeriodo={formatPeriodo}
                    isAtual={isAtual}
                    percentual={percentual}
                    metaValue={metaValue}
                    realizado={realizado}
                    getStatusBadge={getStatusBadge}
                    getAgendamentosNaSemana={getAgendamentosNaSemanaContexto(selectedYear, selectedMonth)}
                    calcularComissaoSemana={calcularComissaoSemana}
                  />
                );
              })}
            </tbody>
             <tfoot>
               <tr className="border-t-2 bg-muted/30">
                 <td className="p-3 font-bold">TOTAL</td>
                 <td className="p-3">-</td>
                 <td className="p-3 font-bold">-</td>
                 <td className="p-3 font-bold">-</td>
                 <td className="p-3 font-bold">-</td>
                 <td className="p-3">
                   <span className="font-bold text-blue-600">
                     Multiplicador Total
                   </span>
                 </td>
                 <td className="p-3">
                   <span className="font-bold text-green-600">
                     Comissão Total
                   </span>
                 </td>
                 <td className="p-3">-</td>
               </tr>
             </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};