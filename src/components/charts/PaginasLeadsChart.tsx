import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showAllPages, setShowAllPages] = useState(false);
  
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

  // Dados completos para a lista (quando expandida)
  const allPaginasData = Array.from(paginasMap.entries())
    .map(([pagina, count]) => ({
      name: pagina.length > 30 ? `${pagina.slice(0, 30)}...` : pagina,
      fullName: pagina,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

  // Função para lidar com clique na lista
  const handleListItemClick = (pageName: string) => {
    if (onPageClick) {
      const pageLeads = leadsMap.get(pageName) || [];
      onPageClick(pageName, pageLeads);
    }
  };

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
                    outerRadius="70%"
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
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value: string) => {
                      const item = paginasChartData.find(d => d.name === value);
                      return item ? item.fullName : value;
                    }}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Lista das páginas */}
            {showDetails && (
              <div className="mt-4 space-y-2">
                {/* Dados a serem exibidos: top 10 ou todos */}
                {(showAllPages ? allPaginasData : paginasChartData).map((item, index) => (
                  <div 
                    key={item.fullName} 
                    className="flex items-center justify-between text-sm hover:bg-accent hover:text-accent-foreground rounded-lg p-2 cursor-pointer transition-colors"
                    onClick={() => handleListItemClick(item.fullName)}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ 
                          backgroundColor: index < 10 
                            ? COLORS[index % COLORS.length] 
                            : '#94A3B8' // Cor padrão para páginas além das top 10
                        }}
                      />
                      <span className="truncate font-medium" title={item.fullName}>
                        {item.fullName}
                      </span>
                      {index < 10 && <span className="text-xs text-primary font-semibold">#TOP</span>}
                    </div>
                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {item.percentage}%
                      </span>
                      <span className="font-bold text-foreground">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Botão para mostrar/ocultar todas as páginas */}
                {paginasMap.size > 10 && (
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllPages(!showAllPages)}
                      className="w-full"
                    >
                      {showAllPages ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Mostrar apenas Top 10
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Ver todas as {paginasMap.size} páginas
                        </>
                      )}
                    </Button>
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