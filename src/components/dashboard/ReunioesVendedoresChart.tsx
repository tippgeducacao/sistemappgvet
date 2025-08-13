import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAgendamentosStatsVendedores } from '@/hooks/useAgendamentosStatsVendedores';
import LoadingState from '@/components/ui/loading-state';

interface ReunioesVendedoresChartProps {
  selectedVendedor?: string;
}

const COLORS = {
  convertidas: '#10b981', // Verde para vendas convertidas
  compareceram: '#f59e0b', // Amarelo para compareceram mas não compraram
  naoCompareceram: '#ef4444' // Vermelho para não compareceram
};

export const ReunioesVendedoresChart: React.FC<ReunioesVendedoresChartProps> = ({ selectedVendedor }) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { statsData, isLoading } = useAgendamentosStatsVendedores(selectedVendedor, selectedWeek);

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
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const { start: currentStart } = getWeekBounds(now);
    return weekStart.getTime() === currentStart.getTime();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Reuniões por Vendedor - Semana Atual</CardTitle>
          <CardDescription>Performance dos vendedores nas reuniões agendadas desta semana (quarta a terça)</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState message="Carregando estatísticas..." />
        </CardContent>
      </Card>
    );
  }

  if (statsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Reuniões por Vendedor - Semana Atual</CardTitle>
          <CardDescription>Performance dos vendedores nas reuniões agendadas desta semana (quarta a terça)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Nenhuma reunião finalizada ainda</p>
              <p className="text-sm">Aguarde os vendedores completarem as reuniões agendadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = statsData.map(stats => ({
    vendedor: stats.vendedor_name.split(' ')[0], // Apenas primeiro nome
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

  console.log('🔍 ReunioesVendedoresChart renderizando com selectedWeek:', selectedWeek);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resultados das Reuniões por Vendedor - Semana Atual</CardTitle>
            <CardDescription>
              Performance dos vendedores nas reuniões agendadas desta semana (quarta a terça)
              {selectedVendedor && selectedVendedor !== 'todos' && ' (filtrado)'}
            </CardDescription>
          </div>
          
          {/* Filtro de Semana - Forçando visibilidade */}
          <div className="flex items-center gap-2 bg-red-100 p-2 border border-red-500">
            <span className="text-xs text-red-600">FILTRO TESTE</span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="h-8 w-8 p-0 bg-blue-500 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-0 bg-yellow-200 px-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>

            {!isCurrentWeek() && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="text-xs h-8 px-2 bg-green-500 text-white"
              >
                Atual
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="h-8 w-8 p-0 bg-purple-500 text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="vendedor" 
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

        {/* Resumo por Vendedor */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Resumo Detalhado:</h4>
          <div className="grid gap-3">
            {statsData.map((stats) => (
              <div key={stats.vendedor_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="font-medium">{stats.vendedor_name}</div>
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
      </CardContent>
    </Card>
  );
};

export default ReunioesVendedoresChart;