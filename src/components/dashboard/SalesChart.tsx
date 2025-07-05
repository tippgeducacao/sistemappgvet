
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAllVendas } from '@/hooks/useVendas';

const SalesChart: React.FC = () => {
  const { vendas, isLoading } = useAllVendas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
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

  // Agrupar apenas vendas aprovadas por mês
  const vendasPorMes = vendas.reduce((acc, venda) => {
    if (!venda.enviado_em) return acc;
    
    const data = new Date(venda.enviado_em);
    const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (!acc[mesAno]) {
      acc[mesAno] = { 
        mes: mesAno, 
        aprovadas: 0
      };
    }
    
    if (venda.status === 'matriculado') {
      acc[mesAno].aprovadas++;
    }
    
    return acc;
  }, {} as Record<string, { mes: string; aprovadas: number }>);

  const chartData = Object.values(vendasPorMes).sort((a, b) => {
    const [mesA, anoA] = a.mes.split(' ');
    const [mesB, anoB] = b.mes.split(' ');
    return new Date(`${mesA} 1, ${anoA}`).getTime() - new Date(`${mesB} 1, ${anoB}`).getTime();
  });

  const totalAprovadas = vendas.filter(v => v.status === 'matriculado').length;

  if (vendas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Mês</CardTitle>
          <CardDescription>O gráfico será gerado conforme as vendas forem cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Nenhuma venda cadastrada ainda.</p>
              <p className="text-sm mt-2">O gráfico será atualizado automaticamente conforme as vendas forem cadastradas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Mês</CardTitle>
        <CardDescription>
          Evolução mensal das vendas aprovadas - Total: {totalAprovadas} {totalAprovadas === 1 ? 'venda aprovada' : 'vendas aprovadas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value}`, 'Vendas Aprovadas']}
              />
              <Bar dataKey="aprovadas" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;
