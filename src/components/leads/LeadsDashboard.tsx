
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';
import ProfissoesLeadsChart from '@/components/charts/ProfissoesLeadsChart';
import PaginasLeadsChart from '@/components/charts/PaginasLeadsChart';
import type { Lead } from '@/hooks/useLeads';

interface LeadsDashboardProps {
  leads: Lead[];
}

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ leads }) => {
  console.log('🔍 LeadsDashboard recebeu leads:', leads?.length || 0);
  console.log('📋 Primera amostra de leads:', leads?.slice(0, 2));

  // Verificar se temos leads
  if (!leads || leads.length === 0) {
    console.log('⚠️ Nenhum lead disponível para dashboard');
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
        <ProfissoesLeadsChart 
          leads={[]}
          title="Profissões dos Leads"
          showDetails={true}
          height="h-[400px]"
        />

        <PaginasLeadsChart 
          leads={[]}
          title="Páginas dos Leads"
          showDetails={true}
          height="h-[400px]"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Estados dos Leads</span>
            </CardTitle>
            <CardDescription>
              Nenhum dado disponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum lead encontrado para exibir gráficos
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extrair estado da região
  const extractEstado = (regiao?: string) => {
    if (!regiao) return 'Não informado';
    
    // Procurar por padrões como "Cidade, Estado" ou "Estado, País"
    const parts = regiao.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      // Se o último elemento tem mais de 10 caracteres, pode ser um país, pegar o penúltimo
      if (lastPart.length > 10 && parts.length > 2) {
        return parts[parts.length - 2];
      }
      return lastPart;
    }
    
    return regiao;
  };

  // Processar dados de estados
  const estadosMap = new Map<string, number>();
  leads.forEach(lead => {
    const estado = extractEstado(lead.regiao);
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
  });

  const estadosChartData = Array.from(estadosMap.entries())
    .map(([estado, count]) => ({
      name: estado,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const chartConfig = {
    estados: {
      label: "Estados",
    },
  };

  console.log('📈 Dados finais para gráfico de estados:', estadosChartData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
      {/* Gráfico de Profissões */}
      <ProfissoesLeadsChart 
        leads={leads}
        title="Profissões dos Leads"
        showDetails={true}
        height="h-[400px]"
      />

      {/* Gráfico de Páginas */}
      <PaginasLeadsChart 
        leads={leads}
        title="Páginas dos Leads"
        showDetails={true}
        height="h-[400px]"
      />

      {/* Gráfico de Estados - Barras Verticais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-green-600" />
            <span>Estados dos Leads</span>
          </CardTitle>
          <CardDescription>
            Top 10 estados por quantidade de leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estadosChartData.length > 0 ? (
            <>
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadosChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={10}
                      interval={0}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload?.percentage}%)`, 
                        'Quantidade'
                      ]}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Lista dos estados - mais compacta */}
              <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {estadosChartData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MapPin className="w-2 h-2 text-green-600 flex-shrink-0" />
                      <span className="truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-medium text-xs ml-2 flex-shrink-0">{item.value}</span>
                  </div>
                ))}
                {estadosChartData.length > 5 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{estadosChartData.length - 5} outros
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhuma localização identificada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsDashboard;
