import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { statsData, isLoading } = useAgendamentosStatsVendedores(selectedVendedor);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados das Reuniões por Vendedor</CardTitle>
          <CardDescription>Performance dos vendedores nas reuniões agendadas</CardDescription>
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
          <CardTitle>Resultados das Reuniões por Vendedor</CardTitle>
          <CardDescription>Performance dos vendedores nas reuniões agendadas</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados das Reuniões por Vendedor</CardTitle>
        <CardDescription>
          Performance dos vendedores nas reuniões agendadas
          {selectedVendedor && selectedVendedor !== 'todos' && ' (filtrado)'}
        </CardDescription>
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