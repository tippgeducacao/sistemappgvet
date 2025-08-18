import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Target, TrendingUp, Calendar } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAgendamentosStatsAdmin } from '@/hooks/useAgendamentosStatsAdmin';
import { useAuthStore } from '@/stores/AuthStore';
import LoadingSpinner from '@/components/LoadingSpinner';

const SupervisorDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  
  const { grupos, loading: gruposLoading } = useGruposSupervisores();
  const { statsData, isLoading: statsLoading } = useAgendamentosStatsAdmin();

  // Filtrar grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    return grupos.find(grupo => 
      grupo.membros?.some(membro => membro.usuario_id === profile?.id)
    );
  }, [grupos, profile?.id]);

  // SDRs do meu grupo
  const meusSDRs = useMemo(() => {
    if (!meuGrupo) return [];
    return meuGrupo.membros?.filter(membro => 
      ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(membro.usuario?.user_type || '')
    ) || [];
  }, [meuGrupo]);

  // Calcular métricas consolidadas
  const metricas = useMemo(() => {
    const totalSDRs = meusSDRs.length;
    const metaTotal = totalSDRs * 55; // Meta padrão de 55 agendamentos por SDR
    
    const agendamentosTotal = meusSDRs.reduce((sum, sdr) => {
      const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
      return sum + (stats?.total || 0);
    }, 0);

    const conversaoTotal = meusSDRs.reduce((sum, sdr) => {
      const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
      return sum + (stats?.convertidas || 0);
    }, 0);

    const percentualAtingimento = metaTotal > 0 ? (agendamentosTotal / metaTotal) * 100 : 0;

    return {
      totalSDRs,
      metaTotal,
      agendamentosTotal,
      conversaoTotal,
      percentualAtingimento
    };
  }, [meusSDRs, statsData]);

  if (gruposLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!meuGrupo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Nenhum grupo atribuído</h3>
        <p className="text-muted-foreground">Você ainda não foi atribuído a nenhum grupo de supervisão.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header simples */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard Supervisor
        </h1>
        <p className="text-muted-foreground mt-1">
          Supervisão: <span className="font-medium">{meuGrupo.nome_grupo}</span>
        </p>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SDRs</p>
                <p className="text-3xl font-bold">{metricas.totalSDRs}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta Semanal</p>
                <p className="text-3xl font-bold">{metricas.metaTotal}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Realizados</p>
                <p className="text-3xl font-bold">{metricas.agendamentosTotal}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atingimento</p>
                <p className="text-3xl font-bold">{metricas.percentualAtingimento.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance dos SDRs */}
      <Card>
        <CardHeader>
          <CardTitle>Performance da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          {meusSDRs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SDR</TableHead>
                  <TableHead className="text-center">Meta</TableHead>
                  <TableHead className="text-center">Realizados</TableHead>
                  <TableHead className="text-center">Convertidos</TableHead>
                  <TableHead className="text-center">Atingimento</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meusSDRs.map((sdr) => {
                  const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
                  const metaSemanal = 55;
                  const realizados = stats?.total || 0;
                  const convertidos = stats?.convertidas || 0;
                  const percentual = metaSemanal > 0 ? (realizados / metaSemanal) * 100 : 0;
                  
                  const getStatusColor = (percentual: number) => {
                    if (percentual >= 100) return 'bg-green-100 text-green-800 border-green-200';
                    if (percentual >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    return 'bg-red-100 text-red-800 border-red-200';
                  };
                  
                  const getStatusText = (percentual: number) => {
                    if (percentual >= 100) return 'Atingiu';
                    if (percentual >= 80) return 'Próximo';
                    return 'Baixo';
                  };

                  return (
                    <TableRow key={sdr.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {sdr.usuario?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{sdr.usuario?.name}</p>
                            <p className="text-sm text-muted-foreground">{sdr.usuario?.nivel}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{metaSemanal}</TableCell>
                      <TableCell className="text-center">{realizados}</TableCell>
                      <TableCell className="text-center">{convertidos}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-sm font-medium">{percentual.toFixed(0)}%</span>
                          <Progress value={percentual} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(percentual)}>
                          {getStatusText(percentual)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum SDR encontrado no grupo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;