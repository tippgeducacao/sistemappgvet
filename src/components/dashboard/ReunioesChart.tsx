import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgendamentosStats } from '@/hooks/useAgendamentosStats';
import LoadingState from '@/components/ui/loading-state';

const COLORS = {
  convertidas: '#10b981', // Verde para vendas convertidas
  compareceram: '#f59e0b', // Amarelo para compareceram mas não compraram
  naoCompareceram: '#ef4444' // Vermelho para não compareceram
};

export const ReunioesChart: React.FC = () => {
  const { stats, isLoading } = useAgendamentosStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Reuniões</CardTitle>
          <CardDescription>Distribuição dos resultados das suas reuniões</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingState message="Carregando estatísticas..." />
        </CardContent>
      </Card>
    );
  }

  if (stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Reuniões</CardTitle>
          <CardDescription>Distribuição dos resultados das suas reuniões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Nenhuma reunião finalizada ainda</p>
              <p className="text-sm">Complete suas reuniões para ver as estatísticas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: 'Convertidas',
      value: stats.convertidas,
      color: COLORS.convertidas,
      percentage: ((stats.convertidas / stats.total) * 100).toFixed(1)
    },
    {
      name: 'Compareceram',
      value: stats.compareceram,
      color: COLORS.compareceram,
      percentage: ((stats.compareceram / stats.total) * 100).toFixed(1)
    },
    {
      name: 'Não Compareceram',
      value: stats.naoCompareceram,
      color: COLORS.naoCompareceram,
      percentage: ((stats.naoCompareceram / stats.total) * 100).toFixed(1)
    }
  ].filter(item => item.value > 0); // Mostrar apenas categorias com valores

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} reuniões ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.payload.name}: {entry.payload.value} ({entry.payload.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados das Reuniões</CardTitle>
        <CardDescription>
          Distribuição dos resultados das suas {stats.total} reuniões finalizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo estatístico */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.convertidas}
            </div>
            <div className="text-sm text-muted-foreground">Convertidas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.compareceram}
            </div>
            <div className="text-sm text-muted-foreground">Compareceram</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.naoCompareceram}
            </div>
            <div className="text-sm text-muted-foreground">Não Compareceram</div>
          </div>
        </div>
        
        {/* Taxa de conversão */}
        <div className="mt-4 p-3 bg-muted rounded-lg text-center">
          <div className="text-lg font-semibold">
            Taxa de Conversão: {((stats.convertidas / stats.total) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.convertidas} vendas de {stats.total} reuniões
          </div>
        </div>
      </CardContent>
    </Card>
  );
};