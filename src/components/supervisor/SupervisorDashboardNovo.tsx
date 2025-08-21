import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, Edit, Users, DollarSign } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useSDRMetasEstats } from '@/hooks/useSDRMetasEstats';
import { useAuthStore } from '@/stores/AuthStore';
import { useSupervisorComissionamentoAtual } from '@/hooks/useSupervisorComissionamento';

const SupervisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();

  // Encontrar o grupo do supervisor atual
  const meuGrupo = useMemo(() => {
    return grupos.find(grupo => grupo.supervisor_id === user?.id);
  }, [user, grupos]);

  // Extrair IDs dos SDRs do grupo
  const sdrIds = useMemo(() => {
    if (!meuGrupo?.membros) return [];
    return meuGrupo.membros.map(membro => membro.usuario_id);
  }, [meuGrupo]);

  // Buscar estatísticas dos SDRs usando o hook corrigido
  const { stats: sdrStats, loading: statsLoading } = useSDRMetasEstats(sdrIds);
  
  // Buscar dados de comissionamento do supervisor
  const { data: supervisorComissionamento, isLoading: comissionamentoLoading } = useSupervisorComissionamentoAtual(user?.id || '');

  if (loading || statsLoading || comissionamentoLoading) {
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold text-muted-foreground">
          Acompanhe o desempenho da sua equipe de SDRs
        </h1>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total SDRs */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm font-medium">Total SDRs</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{supervisorComissionamento?.totalSDRs || sdrIds.length}</div>
            <p className="text-sm text-muted-foreground">membros da equipe</p>
          </CardContent>
        </Card>

        {/* Meta Coletiva */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-sm font-medium">META COLETIVA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{supervisorComissionamento?.mediaPercentualAtingimento?.toFixed(1) || '0.0'}%</div>
              <p className="text-sm text-muted-foreground">média de atingimento da equipe</p>
              <Progress 
                value={Math.min(supervisorComissionamento?.mediaPercentualAtingimento || 0, 100)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Multiplicador */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-sm font-medium">MULTIPLICADOR</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{supervisorComissionamento?.multiplicador?.toFixed(2) || '0.00'}x</div>
            <p className="text-sm text-muted-foreground">baseado na performance da equipe</p>
          </CardContent>
        </Card>

        {/* Comissão */}
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <CardTitle className="text-sm font-medium">COMISSÃO SEMANAL</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {supervisorComissionamento?.valorComissao?.toFixed(2) || '0,00'}</div>
            <p className="text-sm text-muted-foreground">comissão desta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Meta Coletiva */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold">META COLETIVA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Desempenho individual dos SDRs da sua equipe
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(supervisorComissionamento?.sdrsDetalhes || meuGrupo.membros).map((item) => {
            // Se temos dados detalhados do comissionamento, usá-los; senão usar os dados do grupo
            const isComissionamentoData = 'percentualAtingimento' in item;
            
            if (isComissionamentoData) {
              const sdrDetalhe = item as any;
              return (
                <div key={sdrDetalhe.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  {/* Avatar e Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-blue-200">
                      <span>{sdrDetalhe.nome?.charAt(0).toUpperCase() || 'S'}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-base">{sdrDetalhe.nome}</h3>
                      <p className="text-sm text-muted-foreground">SDR - {sdrDetalhe.reunioesRealizadas} reuniões realizadas</p>
                    </div>
                  </div>

                  {/* Métricas e Progresso */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{sdrDetalhe.reunioesRealizadas}/{sdrDetalhe.metaSemanal}</div>
                      <div className="text-sm text-muted-foreground">{sdrDetalhe.percentualAtingimento}%</div>
                    </div>
                    
                    <div className="w-32">
                      <Progress value={Math.min(sdrDetalhe.percentualAtingimento, 100)} className="h-2" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={sdrDetalhe.percentualAtingimento >= 80 ? "default" : "destructive"}
                        className={sdrDetalhe.percentualAtingimento >= 80 ? "" : "bg-red-500 hover:bg-red-600 text-white"}
                      >
                        {sdrDetalhe.percentualAtingimento >= 80 ? "Boa performance" : "Precisa melhorar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Fallback para dados antigos
              const membro = item as any;
              const sdrStat = sdrStats.find(stat => stat.sdr_id === membro.usuario_id);
              const reunioesFeitas = sdrStat?.agendamentos_feitos || 0;
              const metaSemanal = sdrStat?.meta_semanal || 55;
              const percentualAtingido = sdrStat?.percentual_atingido || 0;
              const conversoes = sdrStat?.conversoes || 0;
              
              return (
                <div key={membro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  {/* Avatar e Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg border-2 border-blue-200">
                      {membro.usuario?.photo_url ? (
                        <img 
                          src={membro.usuario.photo_url}
                          alt={membro.usuario?.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
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
                      <h3 className="font-medium text-base">{membro.usuario?.name}</h3>
                      <p className="text-sm text-muted-foreground">SDR - {conversoes} conversões</p>
                    </div>
                  </div>

                  {/* Métricas e Progresso */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{reunioesFeitas}/{metaSemanal}</div>
                      <div className="text-sm text-muted-foreground">{percentualAtingido.toFixed(1)}%</div>
                    </div>
                    
                    <div className="w-32">
                      <Progress value={Math.min(percentualAtingido, 100)} className="h-2" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={percentualAtingido >= 80 ? "default" : "destructive"}
                        className={percentualAtingido >= 80 ? "" : "bg-red-500 hover:bg-red-600 text-white"}
                      >
                        {percentualAtingido >= 80 ? "Boa performance" : "Precisa melhorar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;