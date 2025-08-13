import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAgendamentosStatsAdmin } from '@/hooks/useAgendamentosStatsAdmin';
import LoadingState from '@/components/ui/loading-state';

interface ReunioesAdminChartProps {
  selectedSDR?: string;
}

const COLORS = {
  convertidas: '#10b981', // Verde para vendas convertidas
  compareceram: '#f59e0b', // Amarelo para compareceram mas não compraram
  naoCompareceram: '#ef4444' // Vermelho para não compareceram
};

export const ReunioesAdminChart: React.FC<ReunioesAdminChartProps> = ({ selectedSDR }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { statsData, isLoading } = useAgendamentosStatsAdmin(selectedSDR, selectedWeek);

  // Função para calcular início e fim da semana
  const getWeekBounds = (date: Date) => {
    const dayOfWeek = date.getDay();
    let daysToSubtract = dayOfWeek >= 3 ? dayOfWeek - 3 : dayOfWeek + 4;
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - daysToSubtract);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const { start: weekStart, end: weekEnd } = getWeekBounds(selectedWeek);

  const goToPreviousWeek = () => {
    const previousWeek = new Date(selectedWeek);
    previousWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(selectedWeek);
    nextWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
    setSelectedMonth(new Date());
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const { start: currentStart } = getWeekBounds(now);
    return weekStart.getTime() === currentStart.getTime();
  };

  const goToPreviousMonth = () => {
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(previousMonth);
    // Ajustar a semana para o início do mês anterior
    const firstWeekOfMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    setSelectedWeek(firstWeekOfMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
    // Ajustar a semana para o início do próximo mês
    const firstWeekOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    setSelectedWeek(firstWeekOfMonth);
  };

  console.log('🔍 ReunioesAdminChart renderizando com selectedWeek:', selectedWeek);
  console.log('📅 weekStart:', weekStart, 'weekEnd:', weekEnd);

  // Preparar dados para o gráfico
  const chartData = statsData.map(stats => ({
    sdr: stats.sdr_name.split(' ')[0], // Apenas primeiro nome
    convertidas: stats.convertidas,
    compareceram: stats.compareceram,
    naoCompareceram: stats.naoCompareceram,
    total: stats.total,
    taxaConversao: stats.total > 0 ? ((stats.convertidas / stats.total) * 100).toFixed(1) : '0'
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-green-600">Convertidas:</span> {data.convertidas}
            </p>
            <p className="text-sm">
              <span className="text-yellow-600">Compareceram:</span> {data.compareceram}
            </p>
            <p className="text-sm">
              <span className="text-red-600">Não Compareceram:</span> {data.naoCompareceram}
            </p>
            <p className="text-sm font-medium border-t pt-1">
              Total: {data.total} | Taxa: {data.taxaConversao}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultados das Reuniões por SDR</span>
          
          <div className="flex items-center gap-3">
            {/* Filtro de Mês */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                ←
              </Button>
              
              <span className="text-sm font-semibold text-white px-3 min-w-[120px] text-center">
                {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                →
              </Button>
            </div>

            {/* Filtro de Semana */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg shadow-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                ←
              </Button>
              
              <span className="text-sm font-semibold text-white px-3 min-w-[140px] text-center">
                {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>

              {!isCurrentWeek() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-sm h-8 px-3 text-white hover:bg-white/20 font-medium"
                >
                  Atual
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                →
              </Button>
            </div>
          </div>
        </CardTitle>
        
        <CardDescription>
          Performance dos SDRs nas reuniões agendadas desta semana (quarta a terça)
          {selectedSDR && selectedSDR !== 'todos' && ' (filtrado)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Carregando estatísticas..." />
        ) : statsData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Nenhuma reunião finalizada ainda</p>
              <p className="text-sm">Aguarde os vendedores completarem as reuniões agendadas</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sdr" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="convertidas" 
                    name="Convertidas" 
                    fill={COLORS.convertidas}
                    stackId="a"
                  />
                  <Bar 
                    dataKey="compareceram" 
                    name="Compareceram" 
                    fill={COLORS.compareceram}
                    stackId="a"
                  />
                  <Bar 
                    dataKey="naoCompareceram" 
                    name="Não Compareceram" 
                    fill={COLORS.naoCompareceram}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resumo por SDR */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Resumo Detalhado:</h4>
              <div className="grid gap-3">
                {statsData.map((stats) => (
                  <div key={stats.sdr_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="font-medium">{stats.sdr_name}</div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">{stats.convertidas} convertidas</span>
                      <span className="text-yellow-600">{stats.compareceram} compareceram</span>
                      <span className="text-red-600">{stats.naoCompareceram} não compareceram</span>
                      <span className="font-medium">
                        Taxa: {stats.total > 0 ? ((stats.convertidas / stats.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReunioesAdminChart;