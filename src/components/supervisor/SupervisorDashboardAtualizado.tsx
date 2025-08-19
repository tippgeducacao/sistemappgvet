import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useSDRMetasEstats } from '@/hooks/useSDRMetasEstats';
import { useSDRComissionamentoTodosSemanal } from '@/hooks/useSDRComissionamento';
import MonthYearSelector from '@/components/common/MonthYearSelector';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  // Extrair IDs dos SDRs do grupo
  const sdrIds = useMemo(() => {
    if (!meuGrupo?.membros) return [];
    return meuGrupo.membros.map(membro => membro.usuario_id);
  }, [meuGrupo]);

  // Buscar estatísticas dos SDRs
  const { stats: sdrStats, loading: statsLoading } = useSDRMetasEstats(sdrIds);
  
  // Calcular semana atual
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  
  // Buscar dados de comissionamento
  const { data: comissionamentoData } = useSDRComissionamentoTodosSemanal(currentYear, currentWeek);

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard - Time SDR</h1>
        <p className="text-gray-600 mt-1">Acompanhe o desempenho da sua equipe de SDRs</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Filtros de Período */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filtrar por período:</span>
                <MonthYearSelector
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={setSelectedMonth}
                  onYearChange={setSelectedYear}
                  showAll={false}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Semana</Button>
                <Button variant="default" size="sm">Mês</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minhas Reuniões */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-medium text-gray-700">Minhas Reuniões</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">10</div>
              <p className="text-sm text-gray-500">reuniões realizadas esta semana</p>
            </CardContent>
          </Card>

          {/* Sua Meta */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-sm font-medium text-gray-700">SUA META</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-gray-900">10/120</div>
                <p className="text-sm text-gray-500">8.3% atingido</p>
                <Progress value={8.3} className="h-2 bg-gray-200" />
              </div>
            </CardContent>
          </Card>

          {/* Conversões */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm font-medium text-gray-700">CONVERSÕES</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-500">conversões da equipe</p>
            </CardContent>
          </Card>
        </div>

        {/* Meta Coletiva */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">META COLETIVA</CardTitle>
            <p className="text-sm text-gray-600">
              Desempenho individual dos SDRs da sua equipe
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              meuGrupo.membros.map((membro) => {
                // Buscar estatísticas do SDR
                const sdrStat = sdrStats.find(stat => stat.sdr_id === membro.usuario_id);
                const comissaoData = comissionamentoData?.find(c => c.sdrId === membro.usuario_id);
                
                const agendamentos = sdrStat?.agendamentos_feitos || 0;
                const meta = sdrStat?.meta_semanal || 0;
                const percentual = sdrStat?.percentual_atingido || 0;
                const comissao = comissaoData?.valorComissao || 0;
                
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
                  <div key={membro.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Avatar e Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-blue-200 relative overflow-hidden">
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
                        <h3 className="font-semibold text-gray-900 text-base">{membro.usuario?.name}</h3>
                        <p className="text-sm text-gray-500">SDR</p>
                      </div>
                    </div>

                    {/* Métricas e Ações */}
                    <div className="flex items-center gap-6">
                      {/* Meta e Agendamentos */}
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{agendamentos}/{meta}</div>
                        <div className="text-sm text-gray-500">{percentual.toFixed(1)}%</div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="w-24">
                        <Progress value={Math.min(percentual, 100)} className="h-2 bg-gray-200" />
                      </div>
                      
                      {/* Comissão */}
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-semibold text-green-600">
                          R$ {comissao.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Comissão</div>
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