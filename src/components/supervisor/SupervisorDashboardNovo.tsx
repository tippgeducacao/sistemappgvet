
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useSupervisorComissionamentoAtual } from '@/hooks/useSupervisorComissionamento';
import { WeekNavigation } from './WeekNavigation';
import { SupervisorMetricsCards } from './SupervisorMetricsCards';

const SupervisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();

  // Encontrar o grupo do supervisor atual
  const meuGrupo = useMemo(() => {
    return grupos.find(grupo => grupo.supervisor_id === user?.id);
  }, [user, grupos]);

  // Buscar dados de comissionamento do supervisor
  const { data: supervisorComissionamento, isLoading: comissionamentoLoading } = useSupervisorComissionamentoAtual(user?.id || '');

  if (loading || comissionamentoLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!meuGrupo || !meuGrupo.membros) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
      </div>
    );
  }

  const totalReunioesRealizadas = supervisorComissionamento?.sdrsDetalhes?.reduce((total, sdr) => total + sdr.reunioesRealizadas, 0) || 0;
  const totalMeta = supervisorComissionamento?.sdrsDetalhes?.reduce((total, sdr) => total + sdr.metaSemanal, 0) || 0;
  const conversoes = 0; // Será implementado quando tivermos dados de conversão
  const minhasReunioes = 10; // Placeholder - será implementado sistema B2B do supervisor

  return (
    <div className="space-y-6 p-6 bg-background dark:bg-background min-h-screen">
      {/* Header com navegação da semana */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground">
            Dashboard do Supervisor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de reuniões B2B e acompanhamento da equipe de SDRs
          </p>
        </div>
        
        <WeekNavigation />
      </div>

      {/* Cards de Métricas */}
      <SupervisorMetricsCards
        minhasReunioes={minhasReunioes}
        totalReunioesEquipe={totalReunioesRealizadas}
        totalMetaEquipe={totalMeta}
        percentualAtingimento={supervisorComissionamento?.mediaPercentualAtingimento || 0}
        conversoes={conversoes}
        valorComissao={supervisorComissionamento?.valorComissao || 0}
      />

      {/* Meta Coletiva */}
      <Card className="bg-card dark:bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-foreground">
            META COLETIVA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Desempenho individual dos SDRs da sua equipe
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {supervisorComissionamento?.sdrsDetalhes?.map((sdr) => (
            <div key={sdr.id} className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/30 rounded-lg border border-border">
              {/* Avatar e Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg border-2 border-primary/20">
                  <span>{sdr.nome?.charAt(0).toUpperCase() || 'S'}</span>
                </div>
                <div>
                  <h3 className="font-medium text-base text-foreground dark:text-foreground">{sdr.nome}</h3>
                  <p className="text-sm text-muted-foreground">SDR</p>
                </div>
              </div>

              {/* Métricas - Layout seguindo a imagem */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-bold text-foreground dark:text-foreground">
                    {sdr.reunioesRealizadas}/{sdr.metaSemanal}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sdr.percentualAtingimento.toFixed(1)}%
                  </div>
                </div>
                
                <div className="w-24">
                  <Progress value={Math.min(sdr.percentualAtingimento, 100)} className="h-2" />
                </div>
                
                <div className="text-center min-w-[80px]">
                  <div className="text-sm font-medium text-green-600 dark:text-green-500">R$ 0,00</div>
                  <div className="text-xs text-muted-foreground">Comissão</div>
                </div>
                
                <Button 
                  size="sm" 
                  className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                >
                  Precisa melhorar
                </Button>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum SDR encontrado na equipe</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;
