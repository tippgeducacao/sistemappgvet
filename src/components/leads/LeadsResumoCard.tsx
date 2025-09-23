import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, TrendingUp, MapPin, Globe } from 'lucide-react';

interface Lead {
  id: string;
  nome?: string;
  email?: string;
  whatsapp?: string;
  status?: string;
  regiao?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  created_at?: string;
  observacoes?: string;
  [key: string]: any;
}

interface LeadsResumoCardProps {
  leads: Lead[];
  title?: string;
}

const extractProfissao = (observacoes?: string): boolean => {
  if (!observacoes) return false;
  
  const professionPatterns = [
    /profiss[ãa]o:?\s*(.+?)(?:\n|$|;|,)/i,
    /trabalho:?\s*(.+?)(?:\n|$|;|,)/i,
    /emprego:?\s*(.+?)(?:\n|$|;|,)/i,
    /ocupa[çc][ãa]o:?\s*(.+?)(?:\n|$|;|,)/i,
    /cargo:?\s*(.+?)(?:\n|$|;|,)/i,
    /fun[çc][ãa]o:?\s*(.+?)(?:\n|$|;|,)/i,
    /atua[çc][ãa]o:?\s*(.+?)(?:\n|$|;|,)/i,
    /área:?\s*(.+?)(?:\n|$|;|,)/i
  ];

  return professionPatterns.some(pattern => pattern.test(observacoes));
};

const extractEstado = (regiao?: string): string | null => {
  if (!regiao) return null;
  
  const parts = regiao.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return regiao.trim();
};

export const LeadsResumoCard: React.FC<LeadsResumoCardProps> = ({
  leads,
  title = "Resumo Geral"
}) => {
  if (!leads || leads.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Nenhum lead disponível</p>
            <p className="text-sm text-muted-foreground">As estatísticas aparecerão aqui quando houver leads</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular métricas
  const totalLeads = leads.length;
  const leadsComProfissao = leads.filter(lead => extractProfissao(lead.observacoes)).length;
  const leadsComWhatsApp = leads.filter(lead => lead.whatsapp && lead.whatsapp.trim()).length;
  const leadsComRegiao = leads.filter(lead => lead.regiao && lead.regiao.trim()).length;
  
  // Estados únicos
  const estadosUnicos = new Set();
  leads.forEach(lead => {
    const estado = extractEstado(lead.regiao);
    if (estado) estadosUnicos.add(estado);
  });

  // Fontes únicas
  const fontesUnicas = new Set();
  leads.forEach(lead => {
    if (lead.utm_source) fontesUnicas.add(lead.utm_source);
  });

  // Páginas únicas
  const paginasUnicas = new Set();
  leads.forEach(lead => {
    if (lead.utm_content) paginasUnicas.add(lead.utm_content);
  });

  // Calcular percentuais
  const percentualProfissao = totalLeads > 0 ? Math.round((leadsComProfissao / totalLeads) * 100) : 0;
  const percentualWhatsApp = totalLeads > 0 ? Math.round((leadsComWhatsApp / totalLeads) * 100) : 0;
  const percentualRegiao = totalLeads > 0 ? Math.round((leadsComRegiao / totalLeads) * 100) : 0;

  const metricas = [
    {
      label: "Total de Leads",
      value: totalLeads,
      icon: Users,
      color: "bg-primary/10 text-primary",
      description: "Leads capturados"
    },
    {
      label: "Com Profissão",
      value: leadsComProfissao,
      percentage: percentualProfissao,
      icon: UserCheck,
      color: "bg-green-500/10 text-green-600",
      description: `${percentualProfissao}% dos leads`
    },
    {
      label: "Com WhatsApp",
      value: leadsComWhatsApp,
      percentage: percentualWhatsApp,
      icon: UserCheck,
      color: "bg-blue-500/10 text-blue-600",
      description: `${percentualWhatsApp}% dos leads`
    },
    {
      label: "Com Localização",
      value: leadsComRegiao,
      percentage: percentualRegiao,
      icon: MapPin,
      color: "bg-purple-500/10 text-purple-600",
      description: `${percentualRegiao}% dos leads`
    }
  ];

  const estatisticas = [
    {
      label: "Estados",
      value: estadosUnicos.size,
      icon: MapPin,
      description: "Estados diferentes"
    },
    {
      label: "Fontes",
      value: fontesUnicas.size,
      icon: Globe,
      description: "Fontes de tráfego"
    },
    {
      label: "Páginas",
      value: paginasUnicas.size,
      icon: TrendingUp,
      description: "Páginas de captura"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 gap-3">
          {metricas.map((metrica, index) => {
            const IconComponent = metrica.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${metrica.color}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {metrica.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{metrica.value}</p>
                      {metrica.percentage !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          {metrica.percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Linha divisória */}
        <div className="border-t border-border/50" />

        {/* Estatísticas secundárias */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Diversidade</h4>
          <div className="grid grid-cols-3 gap-2">
            {estatisticas.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center space-y-1">
                  <div className="flex justify-center">
                    <div className="p-2 rounded-lg bg-accent/50">
                      <IconComponent className="h-4 w-4 text-accent-foreground" />
                    </div>
                  </div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicador de qualidade dos dados */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Qualidade dos Dados</span>
            <Badge variant={percentualProfissao > 70 ? "default" : percentualProfissao > 40 ? "secondary" : "destructive"}>
              {percentualProfissao > 70 ? "Boa" : percentualProfissao > 40 ? "Média" : "Baixa"}
            </Badge>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.max(percentualProfissao, 5)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Baseado na completude das informações dos leads
          </p>
        </div>
      </CardContent>
    </Card>
  );
};