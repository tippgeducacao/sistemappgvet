import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useSDRAgendamentosMetas } from '@/hooks/useSDRAgendamentosMetas';

const SDRAgendamentosComparativo: React.FC = () => {
  const { dados, isLoading } = useSDRAgendamentosMetas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meta de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (dados.metaBatida) return 'text-green-600';
    if (dados.hoje >= dados.meta * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComparativoColor = () => {
    if (dados.diferenca > 0) return 'text-green-600';
    if (dados.diferenca < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Meta de Agendamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta de Agendamentos</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{dados.hoje}</span>
              <span className="text-sm text-muted-foreground">/ {dados.meta}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  dados.metaBatida ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min((dados.hoje / dados.meta) * 100, 100)}%` }}
              />
            </div>
            <p className={`text-xs font-medium ${getStatusColor()}`}>
              {dados.metaBatida ? '✅ Meta Batida!' : 
               dados.hoje >= dados.meta * 0.7 ? '⚠️ Próximo da meta' : 
               '❌ Abaixo da meta'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Hoje vs Ontem */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comparativo Diário</CardTitle>
          {dados.diferenca >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-lg font-bold">{dados.hoje}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">vs</p>
                <div className={`flex items-center gap-1 ${getComparativoColor()}`}>
                  {dados.diferenca >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-sm font-medium">
                    {dados.diferenca >= 0 ? '+' : ''}{dados.diferenca}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Ontem</p>
                <p className="text-lg font-bold">{dados.ontem}</p>
              </div>
            </div>
            <p className={`text-xs ${getComparativoColor()}`}>
              {dados.percentual > 0 ? '+' : ''}{dados.percentual}% em relação a ontem
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SDRAgendamentosComparativo;