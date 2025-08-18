import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useSDRMetasEstats } from '@/hooks/useSDRMetasEstats';
import { useAuthStore } from '@/stores/AuthStore';
import { Users, Target, Calendar, TrendingUp } from 'lucide-react';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading: gruposLoading } = useGruposSupervisores();

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  // Filtrar SDRs do meu grupo
  const meusSDRs = useMemo(() => {
    if (!meuGrupo?.membros) return [];
    return meuGrupo.membros.filter(membro => 
      membro.usuario?.user_type === 'sdr'
    );
  }, [meuGrupo]);

  // IDs dos SDRs para buscar estatísticas
  const sdrIds = useMemo(() => 
    meusSDRs.map(sdr => sdr.usuario_id), 
    [meusSDRs]
  );

  const { stats, loading: statsLoading } = useSDRMetasEstats(sdrIds);

  // Calcular dados agregados da equipe
  const resumoEquipe = useMemo(() => {
    if (!stats || stats.length === 0) return null;

    const totalSDRs = stats.length;
    let totalMetaSemanal = 0;
    let totalAgendamentosFeitos = 0;
    let totalConversoes = 0;
    let sdrsMeta80Porcento = 0;

    stats.forEach(sdrStat => {
      totalMetaSemanal += sdrStat.meta_semanal;
      totalAgendamentosFeitos += sdrStat.agendamentos_feitos;
      totalConversoes += sdrStat.conversoes;
      
      if (sdrStat.percentual_atingido >= 80) {
        sdrsMeta80Porcento++;
      }
    });

    const percentualMedioAtingimento = totalMetaSemanal > 0 
      ? (totalAgendamentosFeitos / totalMetaSemanal) * 100 
      : 0;

    return {
      totalSDRs,
      totalMetaSemanal,
      totalAgendamentosFeitos,
      totalConversoes,
      percentualMedioAtingimento,
      sdrsMeta80Porcento
    };
  }, [stats]);

  // Minhas reuniões como supervisor (pode ser implementado posteriormente)
  const minhasReunioes = 10; // Valor fixo por enquanto

  // Minha meta individual + meta da equipe
  const metaTotal = useMemo(() => {
    if (!resumoEquipe) return { realizado: 0, meta: 0, percentual: 0 };
    
    const metaEquipe = resumoEquipe.totalMetaSemanal;
    const realizadoEquipe = resumoEquipe.totalAgendamentosFeitos;
    const metaIndividual = 10; // Meta fixa do supervisor (pode ser configurável)
    
    const metaTotal = metaEquipe + metaIndividual;
    const realizadoTotal = realizadoEquipe + minhasReunioes;
    const percentual = metaTotal > 0 ? (realizadoTotal / metaTotal) * 100 : 0;

    return {
      realizado: realizadoTotal,
      meta: metaTotal,
      percentual: Math.round(percentual * 10) / 10
    };
  }, [resumoEquipe, minhasReunioes]);

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 100) return '🏆';
    if (percentual >= 80) return '🔥';
    if (percentual >= 60) return '⚡';
    return '📈';
  };

  const getStatusText = (percentual: number) => {
    if (percentual >= 100) return 'Meta Atingida';
    if (percentual >= 80) return 'Quase lá';
    if (percentual >= 60) return 'No caminho';
    return 'Precisa melhorar';
  };

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return 'bg-green-500';
    if (percentual >= 80) return 'bg-yellow-500';
    if (percentual >= 60) return 'bg-blue-500';
    return 'bg-red-500';
  };

  if (gruposLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  if (!meuGrupo || meusSDRs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Supervisão não configurada</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Você não possui um grupo de SDRs atribuído ou seu grupo está vazio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard - {meuGrupo.nome_grupo}</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da sua equipe de SDRs
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Reuniões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{minhasReunioes}</div>
            <p className="text-xs text-muted-foreground">
              reuniões realizadas esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SUA META</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metaTotal.realizado}/{metaTotal.meta}
            </div>
            <p className="text-xs text-muted-foreground">
              {metaTotal.percentual}% atingido
            </p>
            <Progress value={metaTotal.percentual} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CONVERSÕES</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoEquipe?.totalConversoes || 0}</div>
            <p className="text-xs text-muted-foreground">
              conversões da equipe
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meta Coletiva */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">META COLETIVA</CardTitle>
          <CardDescription>
            Desempenho individual dos SDRs da sua equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((sdrStat) => (
              <div key={sdrStat.sdr_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {sdrStat.sdr_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{sdrStat.sdr_name}</p>
                    <p className="text-sm text-muted-foreground">SDR</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{sdrStat.agendamentos_feitos}/{sdrStat.meta_semanal}</p>
                    <p className="text-sm text-muted-foreground">
                      {sdrStat.percentual_atingido}%
                    </p>
                  </div>
                  
                  <div className="w-24">
                    <Progress value={sdrStat.percentual_atingido} className="h-2" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(sdrStat.percentual_atingido)}</span>
                    <Badge variant="secondary" className={`text-white ${getStatusColor(sdrStat.percentual_atingido)}`}>
                      {getStatusText(sdrStat.percentual_atingido)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};