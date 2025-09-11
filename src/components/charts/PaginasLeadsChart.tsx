import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';
import { normalizePageSlug } from '@/utils/leadUtils';
import type { Lead } from '@/hooks/useLeads';

interface PaginasLeadsChartProps {
  leads: Lead[];
  title?: string;
  showDetails?: boolean;
  height?: string;
  onPageClick?: (pageName: string, leads: Lead[]) => void;
}

const PaginasLeadsChart: React.FC<PaginasLeadsChartProps> = ({ 
  leads, 
  title = "Páginas de Origem dos Leads",
  showDetails = true,
  height = "h-[400px]",
  onPageClick
}) => {
  // Verificar se temos leads
  if (!leads || leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>
            Nenhum dado disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`${height} flex items-center justify-center text-muted-foreground text-sm`}>
            Nenhum lead encontrado para exibir o gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processar dados de páginas e manter mapeamento de leads
  const paginasMap = new Map<string, number>();
  const leadsMap = new Map<string, Lead[]>();
  
  // Função para identificar se o lead foi criado por agendamento
  const isAgendamentoLead = (lead: Lead): boolean => {
    return (
      lead.fonte_captura?.toLowerCase().includes('agendamento') ||
      lead.fonte_referencia?.toLowerCase().includes('agendamento') ||
      lead.pagina_nome?.toLowerCase().includes('agendamento') ||
      lead.utm_source?.toLowerCase().includes('agendamento') ||
      lead.utm_campaign?.toLowerCase().includes('agendamento')
    );
  };
  
  leads.forEach(lead => {
    let displayName: string;
    
    // Verificar se é um lead de agendamento
    if (isAgendamentoLead(lead)) {
      displayName = 'Agendamentos';
    } else {
      const slug = normalizePageSlug(lead.pagina_nome);
      displayName = slug 
        ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
        : 'Não informado';
    }
    
    paginasMap.set(displayName, (paginasMap.get(displayName) || 0) + 1);
    
    // Manter lista de leads por página
    if (!leadsMap.has(displayName)) {
      leadsMap.set(displayName, []);
    }
    leadsMap.get(displayName)!.push(lead);
  });

  // Função para lidar com clique no gráfico
  const handlePieClick = (data: any) => {
    if (onPageClick && data?.payload) {
      const pageName = data.payload.fullName || data.payload.name;
      const pageLeads = leadsMap.get(pageName) || [];
      onPageClick(pageName, pageLeads);
    }
  };

  // Cores para o gráfico de pizza - usando tons diferentes das profissões
  const COLORS = [
    '#10B981', // Verde (Emerald)
    '#3B82F6', // Azul (Blue)
    '#F59E0B', // Amarelo (Amber)
    '#EF4444', // Vermelho (Red)
    '#8B5CF6', // Roxo (Violet)
    '#06B6D4', // Ciano (Cyan)
    '#84CC16', // Lima (Lime)
    '#F97316', // Laranja (Orange)
    '#EC4899', // Rosa (Pink)
    '#6366F1', // Índigo (Indigo)
  ];

  const paginasChartData = Array.from(paginasMap.entries())
    .map(([pagina, count]) => ({
      name: pagina.length > 30 ? `${pagina.slice(0, 30)}...` : pagina,
      fullName: pagina,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const chartConfig = {
    paginas: {
      label: "Páginas",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          Top 10 páginas de origem ({leads.length} leads total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paginasChartData.length > 0 ? (
          <>
            <ChartContainer config={chartConfig} className={height}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paginasChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                    onClick={handlePieClick}
                    className="cursor-pointer"
                  >
                    {paginasChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      `${value} leads (${props.payload?.percentage}%)`, 
                      props.payload?.fullName || 'Página'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Lista das páginas */}
            {showDetails && (
              <div className="mt-4 space-y-2">
                {paginasChartData.map((item, index) => (
                  <div key={item.fullName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate font-medium" title={item.fullName}>
                        {item.fullName}
                      </span>
                    </div>
                    <span className="font-bold text-foreground ml-3 flex-shrink-0">
                      {item.value}
                    </span>
                  </div>
                ))}
                {paginasMap.size > 10 && (
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    +{paginasMap.size - 10} outras páginas
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={`${height} flex items-center justify-center text-muted-foreground text-sm`}>
            Nenhuma página identificada
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginasLeadsChart;