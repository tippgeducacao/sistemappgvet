import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { normalizeEstado } from '@/utils/geoUtils';

interface Lead {
  id: string;
  regiao?: string;
  [key: string]: any;
}

interface EstadosLeadsChartProps {
  leads: Lead[];
  title?: string;
  showDetails?: boolean;
  height?: string;
  onStateClick?: (stateName: string, stateLeads: Lead[]) => void;
}

const COLORS = [
  '#2563EB', // Azul (Blue)
  '#DC2626', // Vermelho (Red)
  '#16A34A', // Verde (Green)
  '#D97706', // Laranja (Orange)
  '#7C3AED', // Roxo (Purple)
  '#0891B2', // Ciano (Cyan)
  '#CA8A04', // Amarelo (Yellow)
  '#DB2777', // Rosa (Pink)
  '#4F46E5', // Índigo (Indigo)
  '#059669', // Esmeralda (Emerald)
];


export const EstadosLeadsChart: React.FC<EstadosLeadsChartProps> = ({
  leads,
  title = "Estados dos Leads",
  showDetails = false,
  height = "400px",
  onStateClick
}) => {
  if (!leads || leads.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Nenhum lead disponível</p>
            <p className="text-sm text-muted-foreground">Os dados aparecerão aqui quando houver leads</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processar dados dos estados (excluindo "Não informado")
  const estadosMap = new Map<string, number>();
  const leadsMap = new Map<string, Lead[]>();
  let unknownCount = 0;

  leads.forEach((lead) => {
    const estado = normalizeEstado(lead.regiao);
    
    if (!estado) {
      unknownCount++;
      return;
    }
    
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
    
    if (!leadsMap.has(estado)) {
      leadsMap.set(estado, []);
    }
    leadsMap.get(estado)!.push(lead);
  });

  const totalWithEstado = leads.length - unknownCount;

  // Preparar dados para o gráfico (top 10) - percentuais baseados em totalWithEstado
  const estadosChartData = Array.from(estadosMap.entries())
    .map(([estado, count]) => ({
      name: estado,
      fullName: estado,
      value: count,
      percentage: totalWithEstado > 0 ? ((count / totalWithEstado) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Dados para lista detalhada (todos os estados)
  const allEstadosData = Array.from(estadosMap.entries())
    .map(([estado, count]) => ({
      name: estado,
      count,
      percentage: totalWithEstado > 0 ? ((count / totalWithEstado) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => b.count - a.count);

  const chartConfig = {
    estados: {
      label: "Estados",
    },
  };

  const handleListItemClick = (stateName: string) => {
    if (onStateClick) {
      const stateLeads = leadsMap.get(stateName) || [];
      onStateClick(stateName, stateLeads);
    }
  };

  // Empty state se não houver estados válidos
  if (totalWithEstado === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Nenhum lead com localização identificada</p>
            <p className="text-sm text-muted-foreground">
              {unknownCount > 0 && `${unknownCount} lead(s) sem informação de estado`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {title}
          <span className="text-xs font-normal text-muted-foreground ml-2">
            (Top 10 - {totalWithEstado} de {leads.length} com localização)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={estadosChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadosChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-sm mb-1">{data.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.value} leads ({data.percentage}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {showDetails && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Distribuição por Estado</h4>
              <span className="text-xs text-muted-foreground">
                {allEstadosData.length} estados
              </span>
            </div>
            
            {allEstadosData.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allEstadosData.map((estado, index) => (
                  <div
                    key={estado.name}
                    className={`flex items-center justify-between py-2 px-3 rounded-md text-sm hover:bg-accent/50 transition-colors ${
                      onStateClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleListItemClick(estado.name)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{estado.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{estado.count} leads</span>
                      <span>({estado.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum estado identificado nos leads
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};