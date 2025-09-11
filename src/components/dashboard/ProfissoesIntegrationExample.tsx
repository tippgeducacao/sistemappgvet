import React from 'react';
import { useAllLeads } from '@/hooks/useLeads';
import ProfissoesLeadsChart from '@/components/charts/ProfissoesLeadsChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProfissoesIntegrationExampleProps {
  showCompact?: boolean;
}

const ProfissoesIntegrationExample: React.FC<ProfissoesIntegrationExampleProps> = ({ 
  showCompact = false 
}) => {
  const { data: leads = [], isLoading } = useAllLeads();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Profissões dos Leads
          </CardTitle>
          <CardDescription>
            Carregando dados dos leads...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Título explicativo */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Análise de Profissões dos Leads
        </h2>
        <p className="text-muted-foreground">
          Visualização das principais profissões dos leads captados
        </p>
      </div>

      {/* Gráfico Principal */}
      <ProfissoesLeadsChart 
        leads={leads}
        title="Distribuição das Profissões"
        showDetails={!showCompact}
        height={showCompact ? "h-[350px]" : "h-[450px]"}
      />

      {/* Grid com informações adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{leads.length}</div>
              <div className="text-sm text-muted-foreground">Total de Leads</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {leads.filter(lead => 
                  lead.observacoes && 
                  !lead.observacoes.toLowerCase().includes('não informado') &&
                  !lead.observacoes.toLowerCase().includes('não possui')
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Com Profissão</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {leads.filter(lead => 
                  !lead.observacoes || 
                  lead.observacoes.toLowerCase().includes('não informado') ||
                  lead.observacoes.toLowerCase().includes('não possui')
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Sem Informação</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dica de uso */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Como usar este gráfico em outras páginas:
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Importe o componente <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ProfissoesLeadsChart</code> 
                e passe os dados de leads como prop. Você pode personalizar o título, altura e se deve mostrar detalhes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissoesIntegrationExample;