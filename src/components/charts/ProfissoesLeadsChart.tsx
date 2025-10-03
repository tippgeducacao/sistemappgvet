import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Briefcase } from 'lucide-react';
import type { Lead } from '@/hooks/useLeads';

interface ProfissoesLeadsChartProps {
  leads: Lead[];
  title?: string;
  showDetails?: boolean;
  height?: string;
}

const ProfissoesLeadsChart: React.FC<ProfissoesLeadsChartProps> = ({ 
  leads, 
  title = "Profissões dos Leads",
  showDetails = true,
  height = "h-[400px]"
}) => {
  // Extrair profissão das observações
  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return 'Não informado';
    
    // Procurar por diferentes padrões
    const patterns = [
      /Profissão\/Área:\s*([^\n\r]+)/i,
      /Eu sou:\s*([^\n\r]+)/i,
      /Profissão:\s*([^\n\r]+)/i,
      /Área:\s*([^\n\r]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = observacoes.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Não informado';
  };

  // Verificar se temos leads
  if (!leads || leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-primary" />
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

  // Processar dados de profissões
  const profissoesMap = new Map<string, number>();
  
  leads.forEach(lead => {
    const profissao = extractProfissao(lead.observacoes);
    profissoesMap.set(profissao, (profissoesMap.get(profissao) || 0) + 1);
  });

  // Cores para o gráfico de pizza - usando tons mais próximos da imagem
  const COLORS = [
    '#4F88FF', // Azul (Médico Veterinário)
    '#FF5757', // Vermelho (Não Informado)  
    '#00D4AA', // Verde (Não possuo formação)
    '#FFB547', // Laranja (Estudante da área)
    '#A855F7', // Roxo (Sou formado em outra área)
    '#FF8A00', // Laranja escuro
    '#00BCD4', // Ciano
    '#8BC34A', // Verde claro
    '#E91E63', // Rosa
    '#673AB7', // Roxo escuro
  ];

  const profissoesChartData = Array.from(profissoesMap.entries())
    .map(([profissao, count]) => ({
      name: profissao.length > 25 ? `${profissao.slice(0, 25)}...` : profissao,
      fullName: profissao,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const chartConfig = {
    profissoes: {
      label: "Profissões",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          Top 10 profissões ({leads.length} leads total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profissoesChartData.length > 0 ? (
          <>
            <ChartContainer config={chartConfig} className={height}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profissoesChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {profissoesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name, props) => [
                      `${value} leads (${props.payload?.percentage}%)`, 
                      props.payload?.fullName || 'Profissão'
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Lista das profissões */}
            {showDetails && (
              <div className="mt-4 space-y-2">
                {profissoesChartData.map((item, index) => (
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
                {profissoesMap.size > 10 && (
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    +{profissoesMap.size - 10} outras profissões
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={`${height} flex items-center justify-center text-muted-foreground text-sm`}>
            Nenhuma profissão identificada
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfissoesLeadsChart;