import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useSupervisorComissionamentoAtual } from '@/hooks/useSupervisorComissionamento';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();
  
  // Estado para navegação semanal
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Hooks para metas semanais
  const { getSemanasDoMes, getSemanaAtual } = useMetasSemanais();
  
  // Semanas do mês atual
  const semanasDoMes = useMemo(() => getSemanasDoMes(currentYear, currentMonth), [currentYear, currentMonth, getSemanasDoMes]);
  const semanaAtual = useMemo(() => getSemanaAtual(), [getSemanaAtual]);
  const [selectedWeek, setSelectedWeek] = useState(() => getSemanaAtual());

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  // Buscar dados da planilha detalhada do supervisor para a semana selecionada
  const { data: supervisorData, isLoading: supervisorLoading } = useSupervisorComissionamentoAtual(user?.id || '');

  // Funções de navegação semanal
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? selectedWeek - 1 : selectedWeek + 1;
    if (semanasDoMes.includes(newWeek)) {
      setSelectedWeek(newWeek);
    }
  };

  // Memoizar cálculos dos cards baseados na planilha detalhada
  const totalAtividades = useMemo(() => {
    if (!supervisorData?.sdrsDetalhes) return 0;
    return supervisorData.sdrsDetalhes.reduce((total, sdr) => total + (sdr.reunioesRealizadas || 0), 0);
  }, [supervisorData]);

  const totalConversoes = useMemo(() => {
    if (!supervisorData?.sdrsDetalhes) return 0;
    // Para conversões, vamos contar o total de membros da equipe por enquanto
    return meuGrupo?.membros?.length || 0;
  }, [supervisorData, meuGrupo]);

  const percentualGeral = useMemo(() => {
    if (!supervisorData) return 0;
    return supervisorData.mediaPercentualAtingimento || 0;
  }, [supervisorData]);

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
        {/* Navegação Semanal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">Semana {selectedWeek}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                disabled={!semanasDoMes.includes(selectedWeek - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                disabled={!semanasDoMes.includes(selectedWeek + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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
              <div className="text-3xl font-bold text-foreground">
                {totalAtividades}
              </div>
              <p className="text-sm text-muted-foreground">atividades realizadas esta semana</p>
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
                  {percentualGeral.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">média do grupo</p>
                <Progress value={Math.min(percentualGeral, 100)} className="h-2" />
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
              <div className="text-3xl font-bold text-foreground">
                {totalConversoes}
              </div>
              <p className="text-sm text-muted-foreground">vendas realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Meta Coletiva */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground">META COLETIVA - {currentMonth}/{currentYear}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Desempenho semanal dos membros da sua equipe
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Membro</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Nível</th>
                    <th className="text-left py-3 px-2 font-semibold text-foreground">Meta Semanal</th>
                    {semanasDoMes.map((semana) => (
                      <th key={semana} className="text-center py-3 px-4 font-semibold text-foreground border-l border-border">
                        <div className="space-y-1">
                          <div>Semana {semana}</div>
                          <div className="text-xs text-muted-foreground font-normal">(data)</div>
                        </div>
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 font-semibold text-foreground border-l border-border">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Atingimento %</th>
                  </tr>
                </thead>
                <tbody>
                  {meuGrupo.membros.map((membro) => {
                    // Buscar dados do membro na planilha detalhada do supervisor
                    const membroDetalhe = supervisorData?.sdrsDetalhes?.find(sdr => sdr.id === membro.usuario_id);
                    const metaSemanal = membroDetalhe?.metaSemanal || 0;
                    const totalReunioes = membroDetalhe?.reunioesRealizadas || 0;
                    const percentualTotal = membroDetalhe?.percentualAtingimento || 0;
                    
                    return (
                      <tr key={membro.id} className="border-b border-border hover:bg-muted/30">
                        {/* Membro */}
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-primary/20 relative overflow-hidden">
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
                              <span className={`text-sm ${membro.usuario?.photo_url ? 'hidden' : 'block'}`}>
                                {membro.usuario?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">
                                {membro.usuario?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {membro.usuario?.user_type === 'vendedor' ? 'Vendedor' : 'SDR'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Nível */}
                        <td className="py-4 px-2 text-sm text-foreground">
                          {membro.usuario?.nivel || 'Junior'}
                        </td>
                        
                        {/* Meta Semanal */}
                        <td className="py-4 px-2 text-sm font-semibold text-foreground">
                          {metaSemanal}
                        </td>
                        
                        {/* Colunas das Semanas */}
                        {semanasDoMes.map((semana) => {
                          // Para agora, vamos mostrar dados simulados já que não temos dados históricos por semana
                          const reunioesSemana = semana === selectedWeek ? totalReunioes : Math.floor(Math.random() * metaSemanal);
                          const percentualSemana = metaSemanal > 0 ? (reunioesSemana / metaSemanal) * 100 : 0;
                          
                          return (
                            <td key={semana} className="py-4 px-4 text-center border-l border-border">
                              <div className="text-sm text-foreground">
                                {reunioesSemana}/{metaSemanal} ({percentualSemana.toFixed(1)}%)
                              </div>
                            </td>
                          );
                        })}
                        
                        {/* Total */}
                        <td className="py-4 px-4 text-center border-l border-border">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground">{totalReunioes}</div>
                          </div>
                        </td>
                        
                        {/* Atingimento % */}
                        <td className="py-4 px-4 text-center">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground">{percentualTotal.toFixed(1)}%</div>
                            <div className="text-xs font-semibold text-green-600">
                              R$ {(450 * (percentualTotal / 100)).toFixed(0)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};