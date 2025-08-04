import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calendar, TrendingUp, BarChart3, User, CalendarDays, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMetas } from '@/hooks/useMetas';
import { useAllVendas } from '@/hooks/useVendas';
import { useNiveis } from '@/hooks/useNiveis';
import { useVendedores } from '@/hooks/useVendedores';
import { useAgendamentosLeads } from '@/hooks/useAgendamentosLeads';
import VendasFilter from '@/components/vendas/VendasFilter';

interface VendorWeeklyGoalsModalProps {
  vendedorId?: string;
  vendedorNome?: string;
  vendedorPhoto?: string;
  selectedMonth: number;
  selectedYear: number;
  isOpen: boolean;
  onClose: () => void;
}

const VendorWeeklyGoalsModal: React.FC<VendorWeeklyGoalsModalProps> = ({
  vendedorId,
  vendedorNome,
  vendedorPhoto,
  selectedMonth,
  selectedYear,
  isOpen,
  onClose
}) => {
  // Early return BEFORE any hooks to avoid hook order issues
  if (!vendedorId || !vendedorNome) return null;

  const { metas } = useMetas();
  const { vendas: todasVendas } = useAllVendas();
  const { niveis } = useNiveis();
  const { vendedores } = useVendedores();
  const { data: agendamentos = [] } = useAgendamentosLeads();
  
  // Estado para armazenar comissões calculadas
  const [comissoesPorSemana, setComissoesPorSemana] = useState<{[key: string]: {valor: number, multiplicador: number, percentual: number}}>({});
  const [filtroMes, setFiltroMes] = useState(selectedMonth);
  const [filtroAno, setFiltroAno] = useState(selectedYear);

  // Filtrar agendamentos do vendedor
  const vendedorAgendamentos = useMemo(() => {
    return agendamentos.filter(ag => ag.vendedor_id === vendedorId);
  }, [agendamentos, vendedorId]);

  // Filtrar agendamentos para o período
  const agendamentosHistory = useMemo(() => {
    return vendedorAgendamentos
      .map(agendamento => {
        const agendamentoDate = new Date(agendamento.data_agendamento);
        return {
          ...agendamento,
          data: format(agendamentoDate, 'dd/MM/yyyy', { locale: ptBR }),
          hora: format(agendamentoDate, 'HH:mm', { locale: ptBR })
        };
      })
      .sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());
  }, [vendedorAgendamentos]);

  // Filtrar vendas do vendedor específico
  const vendasVendedor = todasVendas.filter(venda => venda.vendedor_id === vendedorId);
  
  // Total de vendas aprovadas do vendedor em todo o período
  const totalVendasAprovadas = vendasVendedor.filter(venda => venda.status === 'matriculado').length;
  
  // Vendas filtradas por mês/ano
  const vendasFiltradas = vendasVendedor.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate.getMonth() + 1 === filtroMes && vendaDate.getFullYear() === filtroAno;
  });

  // Função para calcular as semanas que terminam no mês (quarta a terça)
  const getWeeksInMonth = (year: number, month: number) => {
    const weeks = [];
    
    // Encontrar a primeira terça-feira do mês
    const firstDayOfMonth = new Date(year, month - 1, 1);
    let firstTuesday = new Date(firstDayOfMonth);
    
    // Ajustar para a primeira terça-feira
    while (firstTuesday.getDay() !== 2) { // 2 = Tuesday
      firstTuesday.setDate(firstTuesday.getDate() + 1);
    }
    
    // Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
    // verificar se existe uma semana anterior que termina neste mês
    if (firstTuesday.getDate() > 7) {
      firstTuesday.setDate(firstTuesday.getDate() - 7);
    }
    
    const lastDayOfMonth = new Date(year, month, 0);
    let currentTuesday = new Date(firstTuesday);
    
    // Contar todas as terças-feiras que estão no mês especificado
    while (currentTuesday.getMonth() === month - 1 && currentTuesday.getFullYear() === year) {
      const weekStart = new Date(currentTuesday);
      weekStart.setDate(weekStart.getDate() - 6); // Quarta-feira anterior (início da semana)
      
      weeks.push({
        start: weekStart,
        end: new Date(currentTuesday)
      });
      
      currentTuesday.setDate(currentTuesday.getDate() + 7);
    }
    
    return weeks;
  };

  // Função para calcular vendas aprovadas no período
  const getApprovedSales = (vendedorId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    console.log('🔍 Calculando vendas aprovadas:', {
      vendedorId,
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalVendas: todasVendas.length
    });
    
    const vendasAprovadas = todasVendas.filter(venda => {
      const isVendedor = venda.vendedor_id === vendedorId;
      const isAprovada = venda.status === 'matriculado';
      const vendaDate = new Date(venda.enviado_em);
      const isNoPeriodo = vendaDate >= startDate && vendaDate <= endDate;
      
      if (isVendedor) {
        console.log('📋 Venda do vendedor:', {
          id: venda.id,
          aluno: venda.aluno?.nome,
          status: venda.status,
          enviado_em: venda.enviado_em,
          vendaDate: vendaDate.toISOString(),
          isAprovada,
          isNoPeriodo
        });
      }
      
      return isVendedor && isAprovada && isNoPeriodo;
    });
    
    console.log('✅ Total de vendas aprovadas:', vendasAprovadas.length);
    return vendasAprovadas.length;
  };

  // Função para calcular progresso semanal
  const getWeeklyProgress = (vendedorId: string, year: number, month: number) => {
    const weeks = getWeeksInMonth(year, month);
    const currentDate = new Date();
    const currentWeekIndex = weeks.findIndex(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    
    console.log('📅 Calculando progresso semanal:', {
      vendedorId,
      year,
      month,
      totalSemanas: weeks.length,
      semanaAtual: currentWeekIndex + 1
    });
    
    return weeks.map((week, index) => {
      const weekSales = todasVendas.filter(venda => {
        const isVendedor = venda.vendedor_id === vendedorId;
        const isAprovada = venda.status === 'matriculado';
        const vendaDate = new Date(venda.enviado_em);
        
        // Normalizar datas para comparação (apenas a data, sem horário)
        const vendaDateOnly = new Date(vendaDate.getFullYear(), vendaDate.getMonth(), vendaDate.getDate());
        const weekStartOnly = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate());
        const weekEndOnly = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate());
        
        const isNaSemana = vendaDateOnly >= weekStartOnly && vendaDateOnly <= weekEndOnly;
        
        return isVendedor && isAprovada && isNaSemana;
      }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
      
      // Calcular meta diária dinâmica para a semana atual
      let metaDiaria = null;
      if (index === currentWeekIndex && metaSemanalDoNivel > 0) {
        const pontosFeitos = weekSales;
        const pontosRestantes = Math.max(0, metaSemanalDoNivel - pontosFeitos);
        
        // Calcular dias restantes na semana (incluindo hoje)
        const hoje = new Date();
        const fimSemana = new Date(week.end);
        const diasRestantes = Math.max(1, Math.ceil((fimSemana.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        metaDiaria = pontosRestantes / diasRestantes;
      }
      
      console.log(`📊 Semana ${index + 1}:`, {
        periodo: `${week.start.toLocaleDateString('pt-BR')} - ${week.end.toLocaleDateString('pt-BR')}`,
        vendas: weekSales,
        metaDiaria: metaDiaria ? metaDiaria.toFixed(2) : null
      });
      
      return {
        week: index + 1,
        sales: weekSales,
        isCurrentWeek: index === currentWeekIndex,
        isPastWeek: index < currentWeekIndex,
        period: `${week.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${week.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
        metaDiaria: metaDiaria
      };
    });
  };

  // Buscar informações do vendedor
  const vendedor = vendedores.find(v => v.id === vendedorId);
  
  // Buscar configuração do nível do vendedor
  const nivelConfig = vendedor?.nivel ? niveis.find(n => n.nivel === vendedor.nivel && n.tipo_usuario === 'vendedor') : null;
  
  // Meta semanal baseada no nível do vendedor
  const metaSemanalDoNivel = nivelConfig?.meta_semanal_vendedor || 0;
  
  // Meta mensal baseada na tabela de metas (se existir) ou calculada baseada no nível
  const meta = metas.find(m => 
    m.vendedor_id === vendedorId && 
    m.mes === filtroMes && 
    m.ano === filtroAno
  );
  
  const weeks = getWeeksInMonth(filtroAno, filtroMes);
  const metaMensal = meta?.meta_vendas || (metaSemanalDoNivel * weeks.length);
  const metaPorSemana = metaSemanalDoNivel > 0 ? metaSemanalDoNivel : (metaMensal > 0 ? Math.ceil(metaMensal / weeks.length) : 0);

  const approvedSales = getApprovedSales(vendedorId, filtroAno, filtroMes);
  const progressPercentage = metaMensal > 0 ? (approvedSales / metaMensal) * 100 : 0;
  const weeklyProgress = getWeeklyProgress(vendedorId, filtroAno, filtroMes);

  const mesNome = new Date(filtroAno, filtroMes - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'desistente':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'matriculado':
        return 'Matriculado';
      case 'pendente':
        return 'Pendente';
      case 'desistente':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'realizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'atrasado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultadoIcon = (resultado: string | null) => {
    switch (resultado) {
      case 'comprou': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'nao_compareceu': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'compareceu_nao_comprou': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={vendedorPhoto} alt={vendedorNome} />
              <AvatarFallback>
                {vendedorNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{vendedorNome}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <div className={`w-2 h-2 rounded-full ${approvedSales >= metaMensal ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Total: {totalVendasAprovadas} vendas aprovadas
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Visualizando: {mesNome}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="metas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metas" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="reunioes" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Reuniões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metas" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <VendasFilter
                selectedMonth={filtroMes}
                selectedYear={filtroAno}
                onMonthChange={setFiltroMes}
                onYearChange={setFiltroAno}
              />
            </div>

            {metaPorSemana > 0 ? (
              <>
                {/* Progresso semanal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Progresso Semanal (Meta: {metaPorSemana} pontos/semana)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {weeklyProgress.map((week) => (
                        <div key={week.week} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">
                                Semana {week.week}
                                {week.isCurrentWeek && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                                    Atual
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {week.period}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={metaPorSemana > 0 ? (week.sales / metaPorSemana) * 100 : 0} 
                                className="flex-1 h-2" 
                              />
                              <span className="text-xs font-medium min-w-fit">
                                {week.sales.toFixed(1)}/{metaPorSemana} pts
                              </span>
                            </div>
                            {week.isCurrentWeek && week.metaDiaria !== null && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                  <span className="font-medium">Meta diária recomendada:</span> {week.metaDiaria.toFixed(2)} pontos/dia
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                  {week.sales >= metaPorSemana 
                                    ? "🎉 Meta semanal já atingida!" 
                                    : `Restam ${(metaPorSemana - week.sales).toFixed(0)} pontos para completar a meta`
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                          {week.sales >= metaPorSemana && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Nenhuma meta definida para {mesNome}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vendas" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <VendasFilter
                selectedMonth={filtroMes}
                selectedYear={filtroAno}
                onMonthChange={setFiltroMes}
                onYearChange={setFiltroAno}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Vendas do Período
                  </span>
                  <Badge variant="outline">{vendasFiltradas.length} vendas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendasFiltradas.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">Nenhuma venda encontrada para {mesNome}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {vendasFiltradas.map((venda) => (
                      <div key={venda.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{venda.aluno?.nome}</span>
                            <Badge variant={getStatusBadgeVariant(venda.status)}>
                              {getStatusLabel(venda.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>{venda.curso?.nome}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(venda.enviado_em).toLocaleDateString('pt-BR')}</span>
                            {venda.pontuacao_validada && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{venda.pontuacao_validada} pts</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reunioes">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Reuniões</CardTitle>
                <CardDescription>
                  Todas as reuniões agendadas para este vendedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {agendamentosHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma reunião encontrada para este vendedor
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {agendamentosHistory.map((agendamento) => (
                        <div key={agendamento.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{agendamento.data}</span>
                              <span className="text-muted-foreground">às {agendamento.hora}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getResultadoIcon(agendamento.resultado_reuniao)}
                              <Badge className={getStatusColor(agendamento.status)}>
                                {agendamento.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">
                              <strong>Interesse:</strong> {agendamento.pos_graduacao_interesse}
                            </p>
                            {agendamento.observacoes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <strong>Observações:</strong> {agendamento.observacoes}
                              </p>
                            )}
                            {agendamento.resultado_reuniao && (
                              <p className="text-sm">
                                <strong>Resultado:</strong> {
                                  agendamento.resultado_reuniao === 'comprou' ? 'Cliente comprou' :
                                  agendamento.resultado_reuniao === 'nao_compareceu' ? 'Cliente não compareceu' :
                                  'Cliente compareceu mas não comprou'
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VendorWeeklyGoalsModal;