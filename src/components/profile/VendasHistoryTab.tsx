import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search, TrendingUp, DollarSign, Download, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAllVendas } from '@/hooks/useVendas';
import { useAllAgendamentos } from '@/hooks/useAllAgendamentos';
import type { DateRange } from 'react-day-picker';
import * as XLSX from 'xlsx';

interface VendasHistoryTabProps {
  userId: string;
  userType: string;
}

interface WeeklyStats {
  week: string;
  weekStart: Date;
  weekEnd: Date;
  totalReunioes: number;
  reunioesRealizadas: number;
  reunioesConvertidas: number;
  vendas: number;
  taxaComparecimento: number;
  taxaConversao: number;
  pontos: number;
}

const VendasHistoryTab: React.FC<VendasHistoryTabProps> = ({ userId, userType }) => {
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { agendamentos, isLoading: agendamentosLoading } = useAllAgendamentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const isLoading = vendasLoading || agendamentosLoading;

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

  // Filtrar dados do usuário
  const userData = useMemo(() => {
    if (!vendas || !agendamentos) return { vendas: [], agendamentos: [] };
    
    const isSDR = userType === 'sdr_inbound' || userType === 'sdr_outbound';
    
    // Para vendedores: reuniões onde ele é o vendedor
    // Para SDRs: reuniões onde ele é o SDR
    const userAgendamentos = agendamentos.filter(a => 
      isSDR ? a.sdr_id === userId : a.vendedor_id === userId
    );

    const userVendas = vendas.filter(v => v.vendedor_id === userId);

    return { vendas: userVendas, agendamentos: userAgendamentos };
  }, [vendas, agendamentos, userId, userType]);

  // Calcular estatísticas semanais
  const weeklyStats = useMemo(() => {
    const { vendas: userVendas, agendamentos: userAgendamentos } = userData;
    const statsMap = new Map<string, WeeklyStats>();

    // Processar agendamentos
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
          totalReunioes: 0,
          reunioesRealizadas: 0,
          reunioesConvertidas: 0,
          vendas: 0,
          taxaComparecimento: 0,
          taxaConversao: 0,
          pontos: 0
        });
      }

      const stats = statsMap.get(weekKey)!;
      stats.totalReunioes++;

      // Reunião realizada (não foi "não compareceu")
      if (agendamento.resultado_reuniao && agendamento.resultado_reuniao !== 'nao_compareceu') {
        stats.reunioesRealizadas++;
      }

      // Verificar se a reunião resultou em venda
      // Buscar vendas do mesmo lead na mesma semana ou logo após
      const vendasRelacionadas = userVendas.filter(venda => {
        const vendaDate = new Date(venda.enviado_em);
        const vendaWeekStart = getWeekStart(vendaDate);
        // Considera vendas na mesma semana ou na semana seguinte
        return vendaDate >= weekStart && vendaDate <= addDays(weekEnd, 7) &&
               venda.status === 'matriculado';
      });

      if (vendasRelacionadas.length > 0) {
        stats.reunioesConvertidas++;
      }
    });

    // Processar vendas para contabilizar pontos
    userVendas.forEach(venda => {
      if (venda.status !== 'matriculado') return;
      
      const vendaDate = new Date(venda.enviado_em);
      const weekStart = getWeekStart(vendaDate);
      const weekEnd = getWeekEnd(vendaDate);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!statsMap.has(weekKey)) {
        statsMap.set(weekKey, {
          week: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM/yyyy')}`,
          weekStart,
          weekEnd,
          totalReunioes: 0,
          reunioesRealizadas: 0,
          reunioesConvertidas: 0,
          vendas: 0,
          taxaComparecimento: 0,
          taxaConversao: 0,
          pontos: 0
        });
      }

      const stats = statsMap.get(weekKey)!;
      stats.vendas++;
      stats.pontos += venda.pontuacao_validada || venda.pontuacao_esperada || 1;
    });

    // Calcular taxas
    statsMap.forEach(stats => {
      stats.taxaComparecimento = stats.totalReunioes > 0 
        ? (stats.reunioesRealizadas / stats.totalReunioes) * 100 
        : 0;
      
      stats.taxaConversao = stats.reunioesRealizadas > 0 
        ? (stats.reunioesConvertidas / stats.reunioesRealizadas) * 100 
        : 0;
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [userData]);

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
      totalReunioes: acc.totalReunioes + week.totalReunioes,
      reunioesRealizadas: acc.reunioesRealizadas + week.reunioesRealizadas,
      reunioesConvertidas: acc.reunioesConvertidas + week.reunioesConvertidas,
      vendas: acc.vendas + week.vendas,
      pontos: acc.pontos + week.pontos
    }), {
      totalReunioes: 0,
      reunioesRealizadas: 0,
      reunioesConvertidas: 0,
      vendas: 0,
      pontos: 0
    });

    return {
      ...totals,
      taxaComparecimento: totals.totalReunioes > 0 
        ? (totals.reunioesRealizadas / totals.totalReunioes) * 100 
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
      'Total Reuniões': stat.totalReunioes,
      'Reuniões Realizadas': stat.reunioesRealizadas,
      'Reuniões Convertidas': stat.reunioesConvertidas,
      'Taxa Comparecimento (%)': stat.taxaComparecimento.toFixed(1),
      'Taxa Conversão (%)': stat.taxaConversao.toFixed(1),
      'Vendas': stat.vendas,
      'Pontos': stat.pontos.toFixed(1)
    }));

    // Adicionar linha de totais
    data.push({
      'Semana': 'TOTAL',
      'Total Reuniões': totalStats.totalReunioes,
      'Reuniões Realizadas': totalStats.reunioesRealizadas,
      'Reuniões Convertidas': totalStats.reunioesConvertidas,
      'Taxa Comparecimento (%)': totalStats.taxaComparecimento.toFixed(1),
      'Taxa Conversão (%)': totalStats.taxaConversao.toFixed(1),
      'Vendas': totalStats.vendas,
      'Pontos': totalStats.pontos.toFixed(1)
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Vendas');
    
    const filename = `historico_vendas_${userId}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
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
                <div className="text-2xl font-bold">{totalStats.totalReunioes}</div>
                <div className="text-xs text-muted-foreground">Total Reuniões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
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
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalStats.taxaConversao.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{totalStats.vendas}</div>
                <div className="text-xs text-muted-foreground">Vendas Convertidas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Exportação */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{stat.week}</h4>
                      <Badge variant="outline">
                        {stat.vendas} vendas
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Reuniões</div>
                        <div className="font-medium">
                          {stat.reunioesRealizadas}/{stat.totalReunioes}
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
                        <div className="font-medium text-primary">
                          {stat.taxaConversao.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pontos</div>
                        <div className="font-medium text-purple-600">
                          {stat.pontos.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VendasHistoryTab;