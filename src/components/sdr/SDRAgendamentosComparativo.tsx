import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useSDRAgendamentosMetas } from '@/hooks/useSDRAgendamentosMetas';
import { useAuthStore } from '@/stores/AuthStore';
import { useAllVendas } from '@/hooks/useVendas';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const SDRAgendamentosComparativo: React.FC = () => {
  const { dados, isLoading } = useSDRAgendamentosMetas();
  const { profile } = useAuthStore();
  const { vendas } = useAllVendas();

  // Calcular vendas de cursos da semana atual
  const calcularVendasSemana = () => {
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 4) % 7)); // Última quarta-feira
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6); // Próxima terça-feira
    fimSemana.setHours(23, 59, 59, 999);

    return vendas.filter(venda => {
      const dataVenda = new Date(venda.enviado_em);
      const dentroDoPeriodo = dataVenda >= inicioSemana && dataVenda <= fimSemana;
      const isSDRVenda = venda.vendedor_id === profile?.id;
      const isMatriculada = venda.status === 'matriculado';
      
      return dentroDoPeriodo && isSDRVenda && isMatriculada;
    });
  };

  const vendasCursosSemana = calcularVendasSemana();
  const progressoSemanalCursos = dados.metaSemanalCursos > 0 ? 
    Math.min((vendasCursosSemana.length / dados.metaSemanalCursos) * 100, 100) : 0;

  // Verificar se atingiu 71% da meta para desbloqueio de comissão
  const percentual71 = 71;
  const atingiu71Porcento = progressoSemanalCursos >= percentual71;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getComparativoColor = () => {
    if (dados.diferenca > 0) return 'text-green-600';
    if (dados.diferenca < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Comparativo de Agendamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agendamentos - Comparativo Diário</CardTitle>
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

      {/* Meta Semanal de Cursos com Comissão */}
      <Card className={!atingiu71Porcento ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Semanal de Cursos</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{vendasCursosSemana.length}</span>
              <span className="text-sm text-muted-foreground">/ {dados.metaSemanalCursos}</span>
            </div>
            
            <Progress 
              value={progressoSemanalCursos} 
              className={`h-2 ${!atingiu71Porcento ? '[&>div]:bg-red-500' : ''}`}
            />
            
            <div className="flex items-center justify-between">
              <Badge 
                variant={atingiu71Porcento ? "default" : "destructive"}
                className={!atingiu71Porcento ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {atingiu71Porcento ? "Comissão Desbloqueada" : "Comissão Bloqueada"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {Math.round(progressoSemanalCursos)}% completo
              </span>
            </div>
            
            <div className={`text-xs font-medium ${atingiu71Porcento ? 'text-green-600' : 'text-red-600'}`}>
              {atingiu71Porcento 
                ? `✅ Acima de 71% - Comissão desbloqueada` 
                : `❌ Abaixo de 71% - Comissão bloqueada (faltam ${Math.ceil((percentual71 * dados.metaSemanalCursos / 100) - vendasCursosSemana.length)} cursos)`
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SDRAgendamentosComparativo;