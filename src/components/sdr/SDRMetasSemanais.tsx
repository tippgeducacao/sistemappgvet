import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useVendas } from '@/hooks/useVendas';
import { useComissionamento } from '@/hooks/useComissionamento';
import { useSDRAgendamentosSemanaCompleto } from '@/hooks/useSDRAgendamentosSemanaCompleto';
import { supabase } from '@/integrations/supabase/client';
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
  const { calcularComissao } = useComissionamento();
  const { fetchAgendamentosSemanaCompleto } = useSDRAgendamentosSemanaCompleto();

  if (!profile) return null;

  const semanas = getSemanasDoMes(selectedYear, selectedMonth);
  
  const getVendasNaSemana = (semana: number) => {
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    console.log(`📅 Semana ${semana}: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`);
    
    return vendas?.filter(venda => {
      if (venda.vendedor_id !== profile.id) return false;
      
      // Contar apenas vendas matriculadas (cursos vendidos com sucesso)
      if (venda.status !== 'matriculado') return false;
      
      const dataVenda = new Date(venda.enviado_em);
      return dataVenda >= startDate && dataVenda <= endDate;
    }) || [];
  };

  const getAgendamentosNaSemana = async (semana: number) => {
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    if (!profile?.id) return { realizados: 0, meta: 0, percentual: 0 };

    try {
      // Buscar agendamentos da semana que tiveram resultado positivo
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', startDate.toISOString())
        .lte('data_agendamento', endDate.toISOString())
        .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);

      if (error) throw error;

      // Buscar meta de agendamentos pelo nível correto do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nivel')
        .eq('id', profile.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        return { realizados: 0, meta: 0, percentual: 0 };
      }

      const nivel = profileData?.nivel || 'junior';
      console.log('🔍 Nível do SDR encontrado:', nivel, 'Tipo:', profile.user_type);

      // Buscar meta de agendamentos na tabela niveis_vendedores
      const { data: nivelData, error: nivelError } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_inbound, meta_semanal_outbound')
        .eq('nivel', nivel)
        .eq('tipo_usuario', profile.user_type)
        .single();

      if (nivelError) {
        console.error('Erro ao buscar nível:', nivelError);
        return { realizados: 0, meta: 0, percentual: 0 };
      }

      console.log('📊 Dados do nível encontrados:', nivelData);

      const metaAgendamentos = profile.user_type === 'sdr_inbound' 
        ? (nivelData?.meta_semanal_inbound || 0)
        : (nivelData?.meta_semanal_outbound || 0);

      console.log('🎯 Meta de agendamentos para SDR:', metaAgendamentos);

      const realizados = agendamentos?.length || 0;
      const percentual = metaAgendamentos > 0 ? (realizados / metaAgendamentos) * 100 : 0;

      return {
        realizados,
        meta: metaAgendamentos,
        percentual: Math.round(percentual)
      };
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return { realizados: 0, meta: 0, percentual: 0 };
    }
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

  const getStatusBadge = (percentual: number, isAtual: boolean) => {
    if (isAtual) {
      return <Badge variant="secondary">Atual</Badge>;
    }
    
    // Implementar regra de 71% para desbloqueio de comissão
    if (percentual >= 100) {
      return <Badge className="bg-emerald-500 text-white">Meta atingida</Badge>;
    } else if (percentual >= 71) {
      return <Badge className="bg-green-500 text-white">Comissão desbloqueada</Badge>;
    } else if (percentual > 0) {
      return <Badge variant="destructive" className="bg-red-500 text-white">Comissão bloqueada</Badge>;
    }
    
    return <Badge variant="outline">Sem atividade</Badge>;
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
                <th className="text-left p-3 font-medium text-muted-foreground">Meta Cursos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Cursos Vendidos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">% Cursos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Meta Agendamentos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Agendamentos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">% Agendamentos</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((semana) => {
                const meta = getMetaSemanalSDR(profile.id, selectedYear, semana);
                const vendasNaSemana = getVendasNaSemana(semana);
                const realizado = vendasNaSemana.length;
                const metaValue = meta?.meta_vendas_cursos || 8; // Meta padrão de 8 cursos
                const percentual = metaValue > 0 ? (realizado / metaValue) * 100 : 0;
                const isAtual = isCurrentWeek(semana);

                return (
                  <AgendamentosRow 
                    key={semana}
                    semana={semana}
                    formatPeriodo={formatPeriodo}
                    isAtual={isAtual}
                    percentual={percentual}
                    metaValue={metaValue}
                    realizado={realizado}
                    getStatusBadge={getStatusBadge}
                    getAgendamentosNaSemana={getAgendamentosNaSemana}
                  />
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30">
                <td className="p-3 font-bold">TOTAL</td>
                <td className="p-3">-</td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold">
                    {totalMeta}
                  </Badge>
                </td>
                <td className="p-3 font-bold">{totalRealizado}</td>
                <td className="p-3">
                  <span className={`font-bold ${percentualTotal >= 100 ? 'text-emerald-600' : percentualTotal >= 71 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentualTotal.toFixed(0)}%
                  </span>
                </td>
                <td className="p-3 font-bold">-</td>
                <td className="p-3 font-bold">-</td>
                <td className="p-3 font-bold">-</td>
                <td className="p-3">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};