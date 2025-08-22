import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Target, TrendingUp, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useGruposSupervisores } from '@/hooks/useGruposSupervisores';
import { useAuthStore } from '@/stores/AuthStore';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useSupervisorComissionamentoAtual, useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';
import { WeeklyDataProvider } from './WeeklyDataProvider';
import { WeeklyAverageCalculator } from './WeeklyAverageCalculator';

export const SupervisorDashboardAtualizado: React.FC = () => {
  const { user } = useAuthStore();
  const { grupos, loading } = useGruposSupervisores();
  
  // Estado para seleção de mês/ano
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Estado para navegação semanal
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = selectedYear;
  const currentMonth = selectedMonth;
  
  // Hooks para metas semanais
  const { getSemanasDoMes, getSemanaAtual } = useMetasSemanais();
  
  // Gerar opções de anos (últimos 3 anos + próximos 2)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Gerar opções de meses
  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  // Função para calcular datas das semanas que TERMINAM no mês (quarta a terça)
  const getWeekDates = (year: number, month: number, week: number) => {
    // Encontrar todas as terças-feiras que estão no mês
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    
    const tuesdays = [];
    let currentDate = new Date(firstDayOfMonth);
    
    // Encontrar primeira terça-feira do mês ou anterior que termine no mês
    while (currentDate.getDay() !== 2) { // 2 = terça-feira
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Se a primeira terça é muito tarde, verificar se há uma anterior que termine no mês
    if (currentDate.getDate() > 7) {
      const previousTuesday = new Date(currentDate);
      previousTuesday.setDate(currentDate.getDate() - 7);
      if (previousTuesday.getMonth() === month - 1) {
        tuesdays.push(new Date(previousTuesday));
      }
    }
    
    // Adicionar todas as terças-feiras do mês
    while (currentDate.getMonth() === month - 1) {
      tuesdays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Pegar a terça-feira da semana solicitada
    if (week <= tuesdays.length) {
      const endWeek = tuesdays[week - 1];
      const startWeek = new Date(endWeek);
      startWeek.setDate(endWeek.getDate() - 6); // Voltar 6 dias para quarta-feira
      
      return {
        start: startWeek,
        end: endWeek
      };
    }
    
    // Fallback se a semana não existir
    return {
      start: new Date(),
      end: new Date()
    };
  };

  // Semanas do mês atual
  const semanasDoMes = useMemo(() => getSemanasDoMes(currentYear, currentMonth), [currentYear, currentMonth, getSemanasDoMes]);
  const semanaAtual = useMemo(() => getSemanaAtual(), [getSemanaAtual]);
  const [selectedWeek, setSelectedWeek] = useState(() => getSemanaAtual());

  // Encontrar o grupo do supervisor logado
  const meuGrupo = useMemo(() => {
    if (!user || !grupos) return null;
    return grupos.find(grupo => grupo.supervisor_id === user.id);
  }, [user, grupos]);

  // Buscar dados da planilha detalhada do supervisor para o mês e semana selecionados
  const { data: supervisorData, isLoading: supervisorLoading } = useSupervisorComissionamento(
    user?.id || '', 
    selectedYear, 
    selectedMonth, 
    selectedWeek
  );

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
        {/* Seletor de Período */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-foreground">META COLETIVA</h2>
            <div className="flex items-center gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Navegação Semanal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-foreground">Semana {selectedWeek}</h3>
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
            <CardTitle className="text-xl font-bold text-foreground">
              Desempenho semanal dos membros da sua equipe - {selectedMonth}/{selectedYear}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho de cada membro por semana
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
                    {semanasDoMes.map((semana) => {
                      const { start, end } = getWeekDates(currentYear, currentMonth, semana);
                      const startFormatted = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      const endFormatted = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      
                      // Verificar se é a semana atual
                      const today = new Date();
                      const isCurrentWeek = today >= start && today <= end;
                      
                      return (
                        <th key={semana} className={`text-center py-3 px-4 font-semibold border-l border-border ${isCurrentWeek ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              Semana {semana}
                              {isCurrentWeek && <Clock className="h-3 w-3" />}
                            </div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {startFormatted} - {endFormatted}
                            </div>
                            {isCurrentWeek && (
                              <div className="text-xs font-semibold text-primary">
                                ATUAL
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
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
                          const { start, end } = getWeekDates(currentYear, currentMonth, semana);
                          const today = new Date();
                          const isCurrentWeek = today >= start && today <= end;
                          
                          return (
                            <td key={semana} className={`py-4 px-4 text-center border-l border-border ${isCurrentWeek ? 'bg-primary/5' : ''}`}>
                              <WeeklyDataProvider
                                supervisorId={user?.id || ''}
                                year={currentYear}
                                month={currentMonth}
                                week={semana}
                                memberId={membro.usuario_id}
                                memberType={membro.usuario?.user_type as 'sdr' | 'vendedor'}
                              >
                                {({ reunioesRealizadas, metaSemanal, percentual }) => {
                                  // Para vendedores, mostrar apenas 1 casa decimal se for decimal
                                  const atingimentoFormatted = membro.usuario?.user_type === 'vendedor' 
                                    ? (reunioesRealizadas % 1 === 0 ? reunioesRealizadas.toString() : reunioesRealizadas.toFixed(1))
                                    : reunioesRealizadas.toString();
                                  
                                  return (
                                    <div className={`text-sm ${isCurrentWeek ? 'font-semibold text-primary' : 'text-foreground'}`}>
                                      {atingimentoFormatted}/{metaSemanal} ({percentual.toFixed(1)}%)
                                    </div>
                                  );
                                }}
                              </WeeklyDataProvider>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td colSpan={3} className="py-3 px-2 font-semibold text-foreground">
                      Taxa de Atingimento Média
                    </td>
                    {semanasDoMes.map((semana) => {
                      const { start, end } = getWeekDates(currentYear, currentMonth, semana);
                      const today = new Date();
                      const isCurrentWeek = today >= start && today <= end;
                      
                      return (
                        <td key={semana} className={`py-3 px-4 text-center border-l border-border font-semibold ${isCurrentWeek ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                          <WeeklyAverageCalculator
                            supervisorId={user?.id || ''}
                            year={currentYear}
                            month={currentMonth}
                            week={semana}
                            members={meuGrupo.membros}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};