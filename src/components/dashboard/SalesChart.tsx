
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAllVendas } from '@/hooks/useVendas';
import { getVendaPeriod } from '@/utils/semanaUtils';

interface SalesChartProps {
  selectedVendedor?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

const SalesChart: React.FC<SalesChartProps> = ({ selectedVendedor, dataInicio, dataFim }) => {
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

  // Filtrar vendas por vendedor e período se selecionados
  const vendasFiltradas = vendas.filter(venda => {
    // Filtro por vendedor
    if (selectedVendedor && selectedVendedor !== 'todos' && venda.vendedor_id !== selectedVendedor) {
      return false;
    }
    
    // Filtro por período de datas
    if (dataInicio || dataFim) {
      // Usar data efetiva: data_assinatura_contrato > data_aprovacao > enviado_em
      const vendaDataEfetiva = venda.data_assinatura_contrato || venda.data_aprovacao || venda.enviado_em;
      
      if (!vendaDataEfetiva) return false;
      
      const vendaDate = new Date(vendaDataEfetiva);
      
      if (dataInicio && vendaDate < dataInicio) {
        return false;
      }
      
      if (dataFim) {
        const fimDia = new Date(dataFim);
        fimDia.setHours(23, 59, 59, 999);
        if (vendaDate > fimDia) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Agrupar apenas vendas aprovadas por mês usando data efetiva
  const vendasPorMes = vendasFiltradas.reduce((acc, venda) => {
    // Usar data efetiva: data_assinatura_contrato > data_aprovacao > enviado_em
    const vendaDataEfetiva = venda.data_assinatura_contrato || venda.data_aprovacao || venda.enviado_em;
    
    if (!vendaDataEfetiva) return acc;
    
    const data = new Date(vendaDataEfetiva);
    const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (!acc[mesAno]) {
      acc[mesAno] = { 
        mes: mesAno,
        mesNumero: data.getMonth(),
        ano: data.getFullYear(),
        aprovadas: 0
      };
    }
    
    if (venda.status === 'matriculado') {
      acc[mesAno].aprovadas++;
    }
    
    return acc;
  }, {} as Record<string, { mes: string; mesNumero: number; ano: number; aprovadas: number }>);

  const chartData = Object.values(vendasPorMes).sort((a, b) => {
    // Ordenar por ano e depois por mês
    if (a.ano !== b.ano) {
      return a.ano - b.ano;
    }
    return a.mesNumero - b.mesNumero;
  });

  const totalAprovadas = vendasFiltradas.filter(v => v.status === 'matriculado').length;

  if (vendasFiltradas.length === 0) {
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
