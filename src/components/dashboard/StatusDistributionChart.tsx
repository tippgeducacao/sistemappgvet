import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAllVendas } from '@/hooks/useVendas';

const StatusDistributionChart: React.FC = () => {
  const { vendas, isLoading } = useAllVendas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status das Matrículas</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vendasRejeitadas = vendas.filter(v => v.status === 'desistiu' && v.motivo_pendencia);

  const statusData = [
    {
      name: 'Matriculados',
      value: vendas.filter(v => v.status === 'matriculado').length,
      color: '#10b981'
    },
    {
      name: 'Pendentes',
      value: vendas.filter(v => v.status === 'pendente').length,
      color: '#f59e0b'
    },
    {
      name: 'Rejeitados',
      value: vendasRejeitadas.length,
      color: '#ef4444'
    }
  ].filter(item => item.value > 0);

  if (vendas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status das Matrículas</CardTitle>
          <CardDescription>A distribuição será mostrada quando houver vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Nenhuma venda cadastrada ainda.</p>
              <p className="text-sm mt-2">O gráfico de distribuição será atualizado automaticamente.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Componente customizado para renderizar labels com números
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Matrículas</CardTitle>
        <CardDescription>
          Distribuição atual: {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'} cadastradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [`${value} vendas`, name]}
              />
              <Legend 
                formatter={(value: string, entry: any) => 
                  `${value}: ${entry.payload.value} vendas`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusDistributionChart;
