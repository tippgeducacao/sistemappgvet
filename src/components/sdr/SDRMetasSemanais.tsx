import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAgendamentosLeads } from '@/hooks/useAgendamentosLeads';
import { useComissionamento } from '@/hooks/useComissionamento';
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
  
  const { data: agendamentos } = useAgendamentosLeads();
  const { calcularComissao } = useComissionamento();

  if (!profile) return null;

  const semanas = getSemanasDoMes(selectedYear, selectedMonth);
  
  const getAgendamentosNaSemana = (semana: number) => {
    const startDate = getDataInicioSemana(selectedYear, selectedMonth, semana);
    const endDate = getDataFimSemana(selectedYear, selectedMonth, semana);
    
    console.log(`📅 Semana ${semana}: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`);
    
    return agendamentos?.filter(agendamento => {
      if (agendamento.sdr_id !== profile.id) return false;
      
      // Contar apenas reuniões onde houve comparecimento confirmado
      const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                        agendamento.resultado_reuniao === 'comprou';
      if (!compareceu) return false;
      
      const dataAgendamento = new Date(agendamento.data_agendamento);
      return dataAgendamento >= startDate && dataAgendamento <= endDate;
    }) || [];
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
    
    if (percentual >= 100) {
      return <Badge className="bg-emerald-500 text-white">Meta atingida</Badge>;
    } else if (percentual >= 70) {
      return <Badge className="bg-amber-500 text-white">Em progresso</Badge>;
    } else if (percentual > 0) {
      return <Badge variant="destructive">Abaixo da meta</Badge>;
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
    return acc + (meta?.meta_agendamentos || 0);
  }, 0);

  const totalRealizado = semanas.reduce((acc, semana) => {
    const agendamentosNaSemana = getAgendamentosNaSemana(semana);
    return acc + agendamentosNaSemana.length;
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
                <th className="text-left p-3 font-medium text-muted-foreground">Meta</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Realizado</th>
                <th className="text-left p-3 font-medium text-muted-foreground">%</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((semana) => {
                const meta = getMetaSemanalSDR(profile.id, selectedYear, semana);
                const agendamentosNaSemana = getAgendamentosNaSemana(semana);
                const realizado = agendamentosNaSemana.length;
                const metaValue = meta?.meta_agendamentos || 0;
                const percentual = metaValue > 0 ? (realizado / metaValue) * 100 : 0;
                const isAtual = isCurrentWeek(semana);

                return (
                  <tr key={semana} className={`border-b hover:bg-muted/50 ${isAtual ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{semana}</span>
                        {isAtual && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatPeriodo(semana)}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        {metaValue}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{realizado}</span>
                    </td>
                    <td className="p-3">
                      <span className={`font-medium ${percentual >= 100 ? 'text-emerald-600' : percentual >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {percentual.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(percentual, isAtual)}
                    </td>
                  </tr>
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
                  <span className={`font-bold ${percentualTotal >= 100 ? 'text-emerald-600' : percentualTotal >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                    {percentualTotal.toFixed(0)}%
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