import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useSupervisorComissionamentoAtual } from '@/hooks/useSupervisorComissionamento';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  // Buscar dados de comissionamento do supervisor que já calcula automaticamente
  // os percentuais de atingimento baseado na planilha detalhada
  const { data: supervisorData, isLoading: supervisorLoading } = useSupervisorComissionamentoAtual(user?.id || '');

  if (loading || supervisorLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Dashboard - Time de Vendas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe o desempenho da sua equipe</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Atividades da Equipe */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Atividades da Equipe</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                if (!supervisorData?.sdrsDetalhes || supervisorData.sdrsDetalhes.length === 0) {
                  return (
                    <>
                      <div className="text-3xl font-bold text-foreground">0</div>
                      <p className="text-sm text-muted-foreground">atividades realizadas esta semana</p>
                    </>
                  );
                }
                
                const totalAtividades = supervisorData.sdrsDetalhes.reduce((acc, sdr) => acc + sdr.reunioesRealizadas, 0);
                
                return (
                  <>
                    <div className="text-3xl font-bold text-foreground">{totalAtividades}</div>
                    <p className="text-sm text-muted-foreground">atividades realizadas esta semana</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Taxa de Atingimento */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">TAXA DE ATINGIMENTO</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-foreground">
                  {supervisorData?.mediaPercentualAtingimento?.toFixed(1) || '0'}%
                </div>
                <p className="text-sm text-muted-foreground">média do grupo</p>
                <Progress value={Math.min(supervisorData?.mediaPercentualAtingimento || 0, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Conversões */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">CONVERSÕES</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <>
                <div className="text-3xl font-bold text-foreground">{meuGrupo.membros.length}</div>
                <p className="text-sm text-muted-foreground">membros da equipe</p>
              </>
            </CardContent>
          </Card>
        </div>

        {/* Meta Coletiva */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground">META COLETIVA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Desempenho individual dos membros da sua equipe
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {supervisorLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              meuGrupo.membros.map((membro) => {
                // Buscar dados do SDR nos detalhes do comissionamento (se disponível)
                const sdrDetalhe = supervisorData?.sdrsDetalhes?.find(sdr => sdr.id === membro.usuario_id);

                const agendamentos = sdrDetalhe?.reunioesRealizadas || 0;
                const meta = sdrDetalhe?.metaSemanal || 0;
                const percentual = sdrDetalhe?.percentualAtingimento || 0;
                
                // Determinar status baseado no percentual
                const getStatusButton = (perc: number) => {
                  if (perc >= 100) {
                    return (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs"
                      >
                        Meta Atingida
                      </Button>
                    );
                  } else if (perc >= 71) {
                    return (
                      <Button 
                        size="sm" 
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 text-xs"
                      >
                        Bom desempenho
                      </Button>
                    );
                  } else {
                    return (
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                      >
                        Precisa melhorar
                      </Button>
                    );
                  }
                };
                
                return (
                  <div key={membro.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    {/* Avatar e Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary/20 relative overflow-hidden">
                        {membro.usuario?.photo_url ? (
                          <img 
                            src={membro.usuario.photo_url}
                            alt={membro.usuario?.name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span className={`${membro.usuario?.photo_url ? 'hidden' : 'block'}`}>
                          {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-base">{membro.usuario?.name}</h3>
                        <p className="text-sm text-muted-foreground">{membro.usuario?.user_type === 'vendedor' ? 'Vendedor' : 'SDR'}</p>
                      </div>
                    </div>

                    {/* Métricas e Ações */}
                    <div className="flex items-center gap-6">
                      {/* Meta e Agendamentos */}
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {agendamentos}/{meta}
                        </div>
                        <div className="text-sm text-muted-foreground">{percentual.toFixed(1)}%</div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="w-24">
                        <Progress value={Math.min(percentual, 100)} className="h-2" />
                      </div>
                      
                      {/* Comissão */}
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-500">
                          R$ {supervisorData?.valorComissao?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-muted-foreground">Comissão Supervisor</div>
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center">
                        {getStatusButton(percentual)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};