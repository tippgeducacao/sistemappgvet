import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, Users, Target, TrendingUp, Download } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllAgendamentos } from '@/hooks/useAllAgendamentos';
import { useAllVendas } from '@/hooks/useVendas';
import type { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

interface ReuniaoHistoryTabProps {
  userId: string;
  userType: string;
}

interface WeeklyMeetingStats {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  totalAgendamentos: number;
  reunioesRealizadas: number;
  reunioesConvertidas: number;
  naoCompareceu: number;
  taxaComparecimento: number;
  taxaConversao: number;
  detalhes: Array<{
    id: string;
    data: string;
    status: string;
    resultado: string;
    interesse: string;
    convertida: boolean;
  }>;
}

const ReuniaoHistoryTab: React.FC<ReuniaoHistoryTabProps> = ({ userId, userType }) => {
  const { agendamentos, isLoading: agendamentosLoading } = useAllAgendamentos();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const isLoading = agendamentosLoading || vendasLoading;

  // Função para obter início da semana (quarta-feira)
  const getWeekStart = (date: Date) => {
    const day = date.getDay(); // 0 = domingo, 3 = quarta
    const diff = day >= 3 ? day - 3 : day + 4; // Dias para voltar até quarta
    return addDays(date, -diff);
  };

  // Função para obter fim da semana (terça-feira)
  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date);
    return addDays(weekStart, 6); // Quarta + 6 dias = terça
  };

  // Filtrar agendamentos do usuário
  const userAgendamentos = useMemo(() => {
    if (!agendamentos) return [];
    
    const isSDR = userType === 'sdr_inbound' || userType === 'sdr_outbound';
    
    return agendamentos.filter(agendamento => {
      // Filtrar por usuário baseado no tipo
      if (isSDR && agendamento.sdr_id !== userId) return false;
      if (!isSDR && agendamento.vendedor_id !== userId) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          agendamento.pos_graduacao_interesse?.toLowerCase().includes(searchLower) ||
          agendamento.status?.toLowerCase().includes(searchLower) ||
          agendamento.resultado_reuniao?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [agendamentos, userId, userType, searchTerm]);

  // Verificar se reunião foi convertida em venda
  const isReuniaoConvertida = (agendamento: any) => {
    if (!vendas) return false;
    
    // Buscar vendas relacionadas ao lead do agendamento
    // na mesma semana ou semana seguinte
    const agendamentoDate = new Date(agendamento.data_agendamento);
    const weekStart = getWeekStart(agendamentoDate);
    const searchEnd = addDays(weekStart, 14); // 2 semanas após
    
    return vendas.some(venda => {
      const vendaDate = new Date(venda.enviado_em);
      return venda.status === 'matriculado' &&
             vendaDate >= agendamentoDate &&
             vendaDate <= searchEnd &&
             venda.vendedor_id === (userType.includes('sdr') ? agendamento.vendedor_id : userId);
    });
  };

  // Calcular estatísticas semanais
  const weeklyStats = useMemo(() => {
    const statsMap = new Map<string, WeeklyMeetingStats>();

    userAgendamentos.forEach(agendamento => {
      const agendamentoDate = new Date(agendamento.data_agendamento);
      const weekStart = getWeekStart(agendamentoDate);
      const weekEnd = getWeekEnd(agendamentoDate);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!statsMap.has(weekKey)) {
        statsMap.set(weekKey, {
          week: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`,
          weekStart,
          weekEnd,
          totalAgendamentos: 0,
          reunioesRealizadas: 0,
          reunioesConvertidas: 0,
          naoCompareceu: 0,
          taxaComparecimento: 0,
          taxaConversao: 0,
          detalhes: []
        });
      }

      const stats = statsMap.get(weekKey)!;
      stats.totalAgendamentos++;

      const foiRealizada = agendamento.resultado_reuniao && 
                          agendamento.resultado_reuniao !== 'nao_compareceu';
      
      const naoCompareceu = agendamento.resultado_reuniao === 'nao_compareceu';
      
      const foiConvertida = isReuniaoConvertida(agendamento);

      if (foiRealizada) {
        stats.reunioesRealizadas++;
      }

      if (naoCompareceu) {
        stats.naoCompareceu++;
      }

      if (foiConvertida) {
        stats.reunioesConvertidas++;
      }

      // Adicionar detalhes
      stats.detalhes.push({
        id: agendamento.id,
        data: format(agendamentoDate, 'dd/MM/yyyy HH:mm'),
        status: agendamento.status,
        resultado: agendamento.resultado_reuniao || 'Sem resultado',
        interesse: agendamento.pos_graduacao_interesse || 'Não informado',
        convertida: foiConvertida
      });
    });

    // Calcular taxas
    statsMap.forEach(stats => {
      stats.taxaComparecimento = stats.totalAgendamentos > 0 
        ? (stats.reunioesRealizadas / stats.totalAgendamentos) * 100 
        : 0;
      
      stats.taxaConversao = stats.reunioesRealizadas > 0 
        ? (stats.reunioesConvertidas / stats.reunioesRealizadas) * 100 
        : 0;
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [userAgendamentos, vendas, userType, userId]);

  // Filtrar estatísticas por período
  const filteredStats = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return weeklyStats;
    
    return weeklyStats.filter(stat => {
      if (dateRange.from && stat.weekEnd < dateRange.from) return false;
      if (dateRange.to && stat.weekStart > dateRange.to) return false;
      return true;
    });
  }, [weeklyStats, dateRange]);

  // Estatísticas totais
  const totalStats = useMemo(() => {
    const stats = filteredStats.length > 0 ? filteredStats : weeklyStats;
    
    const totals = stats.reduce((acc, week) => ({
      totalAgendamentos: acc.totalAgendamentos + week.totalAgendamentos,
      reunioesRealizadas: acc.reunioesRealizadas + week.reunioesRealizadas,
      reunioesConvertidas: acc.reunioesConvertidas + week.reunioesConvertidas,
      naoCompareceu: acc.naoCompareceu + week.naoCompareceu
    }), {
      totalAgendamentos: 0,
      reunioesRealizadas: 0,
      reunioesConvertidas: 0,
      naoCompareceu: 0
    });

    return {
      ...totals,
      taxaComparecimento: totals.totalAgendamentos > 0 
        ? (totals.reunioesRealizadas / totals.totalAgendamentos) * 100 
        : 0,
      taxaConversao: totals.reunioesRealizadas > 0 
        ? (totals.reunioesConvertidas / totals.reunioesRealizadas) * 100 
        : 0
    };
  }, [filteredStats, weeklyStats]);

  // Exportar para Excel
  const exportToExcel = () => {
    const data = filteredStats.map(stat => ({
      'Semana': stat.week,
      'Total Agendamentos': stat.totalAgendamentos,
      'Reuniões Realizadas': stat.reunioesRealizadas,
      'Não Compareceram': stat.naoCompareceu,
      'Reuniões Convertidas': stat.reunioesConvertidas,
      'Taxa Comparecimento (%)': stat.taxaComparecimento.toFixed(1),
      'Taxa Conversão (%)': stat.taxaConversao.toFixed(1)
    }));

    // Adicionar linha de totais
    data.push({
      'Semana': 'TOTAL',
      'Total Agendamentos': totalStats.totalAgendamentos,
      'Reuniões Realizadas': totalStats.reunioesRealizadas,
      'Não Compareceram': totalStats.naoCompareceu,
      'Reuniões Convertidas': totalStats.reunioesConvertidas,
      'Taxa Comparecimento (%)': totalStats.taxaComparecimento.toFixed(1),
      'Taxa Conversão (%)': totalStats.taxaConversao.toFixed(1)
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Reuniões');
    
    const filename = `historico_reunioes_${userId}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalStats.totalAgendamentos}</div>
                <div className="text-xs text-muted-foreground">Total Agendamentos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{totalStats.reunioesRealizadas}</div>
                <div className="text-xs text-muted-foreground">Realizadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalStats.taxaComparecimento.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Comparecimento</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalStats.taxaConversao.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por status, resultado ou interesse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  "Filtrar por período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDateRange(undefined)}
                >
                  Limpar Filtro
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={exportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Lista de estatísticas semanais */}
      <div className="space-y-3">
        {filteredStats.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{stat.week}</h4>
                      <Badge variant="outline">
                        {stat.totalAgendamentos} agendamentos
                      </Badge>
                      {stat.reunioesConvertidas > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {stat.reunioesConvertidas} convertidas
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Realizadas</div>
                        <div className="font-medium">
                          {stat.reunioesRealizadas}/{stat.totalAgendamentos}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Comparecimento</div>
                        <div className="font-medium text-green-600">
                          {stat.taxaComparecimento.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Conversão</div>
                        <div className="font-medium text-purple-600">
                          {stat.taxaConversao.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Não compareceram</div>
                        <div className="font-medium text-red-600">
                          {stat.naoCompareceu}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes das reuniões */}
                {stat.detalhes.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Detalhes das Reuniões:</div>
                    <div className="space-y-1 text-xs">
                      {stat.detalhes.map((detalhe, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <span>{detalhe.data}</span>
                          <Badge className={getStatusColor(detalhe.status)} variant="outline">
                            {detalhe.status}
                          </Badge>
                          <span className="text-muted-foreground">{detalhe.interesse}</span>
                          {detalhe.convertida && (
                            <Badge className="bg-green-100 text-green-800">
                              Convertida
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ReuniaoHistoryTab;