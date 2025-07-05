
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, MapPin } from 'lucide-react';
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span>Profissões dos Leads</span>
            </CardTitle>
            <CardDescription>
              Nenhum dado disponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum lead encontrado para exibir gráficos
            </div>
          </CardContent>
        </Card>

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
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum lead encontrado para exibir gráficos
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extrair profissão das observações
  const extractProfissao = (observacoes?: string) => {
    if (!observacoes) return 'Não informado';
    
    console.log('🔍 Analisando observações:', observacoes.substring(0, 100));
    
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
        const profissao = match[1].trim();
        console.log('✅ Profissão encontrada:', profissao);
        return profissao;
      }
    }
    
    console.log('❌ Nenhuma profissão encontrada');
    return 'Não informado';
  };

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

  // Processar dados de profissões
  const profissoesMap = new Map<string, number>();
  
  leads.forEach((lead, index) => {
    console.log(`🔍 Processando lead ${index + 1}:`, {
      nome: lead.nome,
      observacoes: lead.observacoes ? lead.observacoes.substring(0, 50) + '...' : 'null'
    });
    
    const profissao = extractProfissao(lead.observacoes);
    profissoesMap.set(profissao, (profissoesMap.get(profissao) || 0) + 1);
  });

  console.log('📊 Mapa final de profissões:', Object.fromEntries(profissoesMap));

  // Cores para o gráfico de pizza
  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
  ];

  const profissoesChartData = Array.from(profissoesMap.entries())
    .map(([profissao, count]) => ({
      name: profissao.length > 20 ? `${profissao.slice(0, 20)}...` : profissao,
      fullName: profissao,
      value: count,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

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
    profissoes: {
      label: "Profissões",
    },
    estados: {
      label: "Estados",
    },
  };

  console.log('📈 Dados finais para gráfico de profissões:', profissoesChartData);
  console.log('📈 Dados finais para gráfico de estados:', estadosChartData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Profissões - Pizza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <span>Profissões dos Leads</span>
          </CardTitle>
          <CardDescription>
            Top 10 profissões ({leads.length} leads total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profissoesChartData.length > 0 ? (
            <>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profissoesChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      labelLine={false}
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
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Lista das profissões */}
              <div className="mt-4 space-y-2">
                {profissoesChartData.slice(0, 5).map((item, index) => (
                  <div key={item.fullName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[200px]" title={item.fullName}>
                        {item.fullName}
                      </span>
                    </div>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
                {profissoesChartData.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    +{profissoesChartData.length - 5} outras profissões
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhuma profissão identificada nos leads
            </div>
          )}
        </CardContent>
      </Card>

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
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadosChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={11}
                    />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value} leads (${props.payload?.percentage}%)`, 
                        'Quantidade'
                      ]}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Lista dos estados */}
              <div className="mt-4 space-y-2">
                {estadosChartData.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span className="truncate max-w-[200px]" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhuma localização identificada nos leads
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsDashboard;
