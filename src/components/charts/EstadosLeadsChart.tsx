import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { MapPin } from 'lucide-react';

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
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];

const extractEstado = (regiao?: string): string => {
  if (!regiao) return 'Não informado';
  
  // Extrair estado da região (formato: "Cidade, Estado" ou "Estado")
  const parts = regiao.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return regiao.trim();
};

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

  // Processar dados dos estados
  const estadosMap = new Map<string, number>();
  const leadsMap = new Map<string, Lead[]>();

  leads.forEach((lead) => {
    const estado = extractEstado(lead.regiao);
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
    
    if (!leadsMap.has(estado)) {
      leadsMap.set(estado, []);
    }
    leadsMap.get(estado)!.push(lead);
  });

  // Preparar dados para o gráfico (top 10)
  const estadosChartData = Array.from(estadosMap.entries())
    .map(([estado, count]) => ({
      name: estado.length > 12 ? estado.substring(0, 12) + '...' : estado,
      fullName: estado,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Dados para lista detalhada (todos os estados)
  const allEstadosData = Array.from(estadosMap.entries())
    .map(([estado, count]) => ({
      name: estado,
      count,
      percentage: ((count / leads.length) * 100).toFixed(1)
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estadosChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name, props) => [
                  `${value} leads (${props.payload?.percentage}%)`,
                  props.payload?.fullName || 'Estado'
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--chart-1))" 
                radius={[8, 8, 0, 0]}
                name="Leads por Estado"
              />
            </BarChart>
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