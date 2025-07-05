import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useAllVendas } from '@/hooks/useVendas';
import LoadingSpinner from '@/components/LoadingSpinner';

const SalesByCourseChart: React.FC = () => {
  const { vendas, isLoading } = useAllVendas();

  const courseColors = [
    '#3b82f6', // azul
    '#10b981', // verde
    '#f59e0b', // amarelo
    '#ef4444', // vermelho
    '#8b5cf6', // roxo
    '#f97316', // laranja
    '#06b6d4', // ciano
    '#84cc16', // lima
    '#ec4899', // rosa
    '#6b7280', // cinza
  ];

  const extractCourseNameAfterColon = (text: string) => {
    const colonIndex = text.indexOf(':');
    if (colonIndex !== -1 && colonIndex < text.length - 1) {
      return text.substring(colonIndex + 1).trim();
    }
    return text;
  };

  const breakTextIntoLines = (text: string, maxCharsPerLine: number = 12) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const truncateText = (text: string, maxLength: number = 15) => {
    const cleanText = extractCourseNameAfterColon(text);
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  const chartData = React.useMemo(() => {
    if (!vendas || vendas.length === 0) return [];

    const vendasPorCurso = vendas.reduce((acc, venda) => {
      const cursoNome = venda.curso?.nome || 'Curso não informado';
      const cursoLimpo = extractCourseNameAfterColon(cursoNome);
      
      if (!acc[cursoNome]) {
        acc[cursoNome] = {
          curso: cursoNome,
          cursoLimpo: cursoLimpo,
          cursoTruncado: truncateText(cursoNome),
          total: 0,
          matriculadas: 0,
          pendentes: 0,
          rejeitadas: 0
        };
      }
      
      acc[cursoNome].total += 1;
      
      if (venda.status === 'matriculado') {
        acc[cursoNome].matriculadas += 1;
      } else if (venda.status === 'pendente') {
        acc[cursoNome].pendentes += 1;
      } else if (venda.status === 'desistiu') {
        acc[cursoNome].rejeitadas += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(vendasPorCurso)
      .sort((a: any, b: any) => b.total - a.total)
      .map((item: any, index) => ({
        ...item,
        color: courseColors[index % courseColors.length]
      }));
  }, [vendas]);

  const chartConfig = {
    total: {
      label: "Total de Vendas",
      color: "#3b82f6"
    }
  };

  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    if (value === 0) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const data = chartData.find(item => item.cursoTruncado === payload.value);
    const fullName = data?.cursoLimpo || extractCourseNameAfterColon(payload.value);
    const lines = breakTextIntoLines(fullName, 12);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <g transform={`translate(${x},${y})`}>
              {lines.map((line, index) => (
                <text
                  key={index}
                  x={0}
                  y={16 + (index * 12)}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize="9"
                  fontWeight="500"
                >
                  {line}
                </text>
              ))}
            </g>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{fullName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Curso</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Curso</CardTitle>
          <CardDescription>Distribuição de vendas entre os cursos oferecidos</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhuma venda cadastrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Curso</CardTitle>
          <CardDescription>
            Distribuição de {vendas.length} vendas entre os cursos oferecidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 5, left: 5, bottom: 60 }}
                barCategoryGap="25%"
                maxBarSize={120}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="cursoTruncado" 
                  tick={<CustomXAxisTick />}
                  height={60}
                  interval={0}
                />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{data.cursoLimpo}</p>
                          <p className="text-blue-600">Total: {data.total}</p>
                          <p className="text-green-600">Matriculadas: {data.matriculadas}</p>
                          <p className="text-yellow-600">Pendentes: {data.pendentes}</p>
                          <p className="text-red-600">Rejeitadas: {data.rejeitadas}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList content={renderCustomLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="-mt-8">
            <h4 className="text-xs font-medium mb-2">Cursos:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[8px]">
              {chartData.map((curso, index) => (
                <div key={index} className="flex items-start gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded flex-shrink-0 mt-0.5" 
                    style={{ backgroundColor: curso.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="break-words leading-tight">
                      {curso.cursoLimpo} ({curso.total})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default SalesByCourseChart;
