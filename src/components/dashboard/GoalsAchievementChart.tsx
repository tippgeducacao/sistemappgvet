import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Target, TrendingUp } from 'lucide-react';
import { useAllVendas } from '@/hooks/useVendas';
import { useMetas } from '@/hooks/useMetas';
import { useVendedores } from '@/hooks/useVendedores';

interface GoalsAchievementChartProps {
  selectedVendedor: string;
  selectedMonth: number;
  selectedYear: number;
}

const GoalsAchievementChart: React.FC<GoalsAchievementChartProps> = ({
  selectedVendedor,
  selectedMonth,
  selectedYear
}) => {
  const { vendas } = useAllVendas();
  const { metas } = useMetas();
  const { vendedores } = useVendedores();

  // Filtrar vendas matriculadas do período
  const vendasMatriculadas = vendas.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    const vendaMonth = vendaDate.getMonth() + 1;
    const vendaYear = vendaDate.getFullYear();
    
    const matchesPeriod = vendaMonth === selectedMonth && vendaYear === selectedYear;
    const matchesVendedor = selectedVendedor === 'todos' || venda.vendedor_id === selectedVendedor;
    const isMatriculado = venda.status === 'matriculado';
    
    return matchesPeriod && matchesVendedor && isMatriculado;
  });

  // Preparar dados do gráfico
  const chartData = React.useMemo(() => {
    if (selectedVendedor !== 'todos') {
      // Dados para um vendedor específico
      const vendedor = vendedores.find(v => v.id === selectedVendedor);
      if (!vendedor) return [];

      const metaVendedor = metas.find(meta => 
        meta.vendedor_id === selectedVendedor &&
        meta.mes === selectedMonth &&
        meta.ano === selectedYear
      );

      const vendasVendedor = vendasMatriculadas.filter(v => v.vendedor_id === selectedVendedor).length;
      const metaValue = metaVendedor?.meta_vendas || 0;
      const percentual = metaValue > 0 ? Math.round((vendasVendedor / metaValue) * 100) : 0;

      return [{
        nome: vendedor.name,
        meta: metaValue,
        realizado: vendasVendedor,
        percentual,
        color: percentual >= 100 ? '#22c55e' : percentual >= 75 ? '#f59e0b' : '#ef4444'
      }];
    } else {
      // Dados para todos os vendedores
      return vendedores.map(vendedor => {
        const metaVendedor = metas.find(meta => 
          meta.vendedor_id === vendedor.id &&
          meta.mes === selectedMonth &&
          meta.ano === selectedYear
        );

        const vendasVendedor = vendasMatriculadas.filter(v => v.vendedor_id === vendedor.id).length;
        const metaValue = metaVendedor?.meta_vendas || 0;
        const percentual = metaValue > 0 ? Math.round((vendasVendedor / metaValue) * 100) : 0;

        return {
          nome: vendedor.name,
          meta: metaValue,
          realizado: vendasVendedor,
          percentual,
          color: percentual >= 100 ? '#22c55e' : percentual >= 75 ? '#f59e0b' : '#ef4444'
        };
      }).filter(data => data.meta > 0); // Só mostrar vendedores com meta definida
    }
  }, [selectedVendedor, selectedMonth, selectedYear, vendas, metas, vendedores, vendasMatriculadas]);

  const totalMetas = chartData.reduce((sum, item) => sum + item.meta, 0);
  const totalRealizado = chartData.reduce((sum, item) => sum + item.realizado, 0);
  const percentualGeral = totalMetas > 0 ? Math.round((totalRealizado / totalMetas) * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.nome}</p>
          <p className="text-sm text-muted-foreground">
            Meta: {data.meta} vendas
          </p>
          <p className="text-sm text-muted-foreground">
            Realizado: {data.realizado} vendas
          </p>
          <p className="text-sm font-medium" style={{ color: data.color }}>
            Atingimento: {data.percentual}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Componente customizado para renderizar nomes com quebra de linha
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const words = payload.value.split(' ');
    const maxCharsPerLine = 12;
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word: string) => {
      if ((currentLine + word).length > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 12}
            dy={0}
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            className="fill-muted-foreground"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Metas vs Realizado</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {selectedMonth}/{selectedYear}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalMetas}</div>
            <div className="text-sm text-muted-foreground">Meta Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{totalRealizado}</div>
            <div className="text-sm text-muted-foreground">Realizado</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              percentualGeral >= 100 ? 'text-green-500' : 
              percentualGeral >= 75 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {percentualGeral}%
            </div>
            <div className="text-sm text-muted-foreground">Atingimento</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhuma meta definida para este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="nome" 
                tick={<CustomXAxisTick />}
                interval={0}
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted))" />
              <Bar dataKey="realizado" name="Realizado">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsAchievementChart;