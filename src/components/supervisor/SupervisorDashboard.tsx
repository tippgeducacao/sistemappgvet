import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Target, TrendingUp, Calendar } from 'lucide-react';
import MonthYearFilter from '@/components/common/MonthYearFilter';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAgendamentosStatsAdmin } from '@/hooks/useAgendamentosStatsAdmin';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAuthStore } from '@/stores/AuthStore';
import LoadingSpinner from '@/components/LoadingSpinner';

const SupervisorDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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

  // Calcular métricas do supervisor
  const metricas = useMemo(() => {
    const totalSDRs = meusSDRs.length;
    // Meta fixa para SDRs junior por exemplo
    const metaTotal = meusSDRs.length * 55; // 55 agendamentos por SDR
    
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
      percentualAtingimento,
      taxaConversao: agendamentosTotal > 0 ? (conversaoTotal / agendamentosTotal) * 100 : 0
    };
  }, [meusSDRs, statsData]);

  if (gruposLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!meuGrupo) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo atribuído</h3>
          <p className="text-gray-600">Você ainda não foi atribuído a nenhum grupo de supervisão.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {profile?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Supervisão do grupo: <strong>{meuGrupo.nome_grupo}</strong>
          </p>
        </div>
        
        <MonthYearFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SDRs Supervisionados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalSDRs}</div>
            <p className="text-xs text-muted-foreground">
              Em {meuGrupo.nome_grupo}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.metaTotal}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos da equipe
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atingimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.percentualAtingimento.toFixed(1)}%
            </div>
            <Progress value={metricas.percentualAtingimento} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.taxaConversao.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.conversaoTotal} de {metricas.agendamentosTotal} agendamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance dos SDRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance Semanal dos SDRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meusSDRs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SDR</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Meta Semanal</TableHead>
                  <TableHead>Realizados</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Convertidos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meusSDRs.map((sdr) => {
                  const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
                  const metaSemanal = 55; // Meta fixa para demonstração
                  const realizados = stats?.total || 0;
                  const convertidos = stats?.convertidas || 0;
                  const percentual = metaSemanal > 0 ? (realizados / metaSemanal) * 100 : 0;
                  
                  const getStatusColor = (percentual: number) => {
                    if (percentual >= 100) return 'bg-green-100 text-green-800';
                    if (percentual >= 80) return 'bg-yellow-100 text-yellow-800';
                    return 'bg-red-100 text-red-800';
                  };
                  
                  const getStatusText = (percentual: number) => {
                    if (percentual >= 100) return 'Meta Atingida';
                    if (percentual >= 80) return 'Próximo da Meta';
                    return 'Abaixo da Meta';
                  };

                  return (
                    <TableRow key={sdr.id}>
                      <TableCell className="font-medium">
                        {sdr.usuario?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sdr.usuario?.nivel || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{metaSemanal}</TableCell>
                      <TableCell>{realizados}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{percentual.toFixed(1)}%</span>
                          <Progress value={percentual} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>{convertidos}</TableCell>
                      <TableCell>
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
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum SDR encontrado no seu grupo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;