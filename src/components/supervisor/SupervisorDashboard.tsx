import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Target, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAgendamentosStatsAdmin } from '@/hooks/useAgendamentosStatsAdmin';
import { useAuthStore } from '@/stores/AuthStore';
import LoadingSpinner from '@/components/LoadingSpinner';

const SupervisorDashboard: React.FC = () => {
  const { profile } = useAuthStore();
  
  const { grupos, loading: gruposLoading } = useGruposSupervisores();
  const { statsData, isLoading: statsLoading } = useAgendamentosStatsAdmin();

  // Encontrar meu grupo como supervisor
  const meuGrupo = useMemo(() => {
    return grupos.find(grupo => 
      grupo.membros?.some(membro => membro.usuario_id === profile?.id)
    );
  }, [grupos, profile?.id]);

  // SDRs que eu supervisiono
  const meusSDRs = useMemo(() => {
    if (!meuGrupo) return [];
    return meuGrupo.membros?.filter(membro => 
      ['sdr', 'sdr_inbound', 'sdr_outbound'].includes(membro.usuario?.user_type || '')
    ) || [];
  }, [meuGrupo]);

  // Métricas consolidadas da minha supervisão
  const resumoEquipe = useMemo(() => {
    if (meusSDRs.length === 0) {
      return {
        totalSDRs: 0,
        metaTotalSemanal: 0,
        agendamentosRealizados: 0,
        conversoes: 0,
        mediaAtingimento: 0,
        sdrAcimaMedia: 0
      };
    }

    const metaTotalSemanal = meusSDRs.length * 55; // Meta padrão por SDR
    
    let agendamentosRealizados = 0;
    let conversoes = 0;
    let totalAtingimento = 0;
    let sdrAcimaMedia = 0;

    meusSDRs.forEach(sdr => {
      const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
      const realizados = stats?.total || 0;
      const convertidas = stats?.convertidas || 0;
      const atingimento = (realizados / 55) * 100;

      agendamentosRealizados += realizados;
      conversoes += convertidas;
      totalAtingimento += atingimento;
      
      if (atingimento >= 80) {
        sdrAcimaMedia++;
      }
    });

    return {
      totalSDRs: meusSDRs.length,
      metaTotalSemanal,
      agendamentosRealizados,
      conversoes,
      mediaAtingimento: totalAtingimento / meusSDRs.length,
      sdrAcimaMedia
    };
  }, [meusSDRs, statsData]);

  if (gruposLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!meuGrupo || meusSDRs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Supervisão não configurada</h2>
          <p className="text-muted-foreground">
            Você ainda não possui uma equipe de SDRs para supervisionar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da Supervisão */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Supervisão de Equipe</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Grupo: <span className="font-semibold text-foreground">{meuGrupo.nome_grupo}</span>
        </p>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Equipe */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">EQUIPE SDR</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoEquipe.totalSDRs}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {resumoEquipe.sdrAcimaMedia} acima de 80%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">PERFORMANCE MÉDIA</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoEquipe.mediaAtingimento.toFixed(0)}%</div>
            <Progress value={resumoEquipe.mediaAtingimento} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">CONVERSÕES</CardTitle>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoEquipe.conversoes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              de {resumoEquipe.agendamentosRealizados} agendamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Controle da Equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Controle Individual dos SDRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SDR</TableHead>
                <TableHead className="text-center">Meta</TableHead>
                <TableHead className="text-center">Realizados</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-center">Convertidos</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meusSDRs.map((sdr) => {
                const stats = statsData.find(stat => stat.sdr_id === sdr.usuario_id);
                const meta = 55;
                const realizados = stats?.total || 0;
                const convertidos = stats?.convertidas || 0;
                const percentual = (realizados / meta) * 100;
                
                const getStatusIcon = (perc: number) => {
                  if (perc >= 100) return <CheckCircle className="h-4 w-4 text-green-600" />;
                  if (perc >= 80) return <Clock className="h-4 w-4 text-yellow-600" />;
                  return <Target className="h-4 w-4 text-red-600" />;
                };
                
                const getStatusText = (perc: number) => {
                  if (perc >= 100) return { text: 'Meta atingida', class: 'text-green-700 bg-green-50 border-green-200' };
                  if (perc >= 80) return { text: 'Quase lá', class: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
                  return { text: 'Precisa melhorar', class: 'text-red-700 bg-red-50 border-red-200' };
                };

                const status = getStatusText(percentual);

                return (
                  <TableRow key={sdr.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {sdr.usuario?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{sdr.usuario?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sdr.usuario?.nivel}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{meta}</TableCell>
                    <TableCell className="text-center font-mono">{realizados}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold">{percentual.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{convertidos}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(percentual)}
                        <Badge className={status.class}>
                          {status.text}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;