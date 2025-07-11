import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calendar, TrendingUp, BarChart3, User } from 'lucide-react';
import { useMetas } from '@/hooks/useMetas';
import { useAllVendas } from '@/hooks/useVendas';
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
  const { metas } = useMetas();
  const { vendas: todasVendas } = useAllVendas();
  const [filtroMes, setFiltroMes] = useState(selectedMonth);
  const [filtroAno, setFiltroAno] = useState(selectedYear);

  if (!vendedorId || !vendedorNome) return null;

  // Filtrar vendas do vendedor específico
  const vendasVendedor = todasVendas.filter(venda => venda.vendedor_id === vendedorId);
  
  // Total de vendas aprovadas do vendedor em todo o período
  const totalVendasAprovadas = vendasVendedor.filter(venda => venda.status === 'matriculado').length;
  
  // Vendas filtradas por mês/ano
  const vendasFiltradas = vendasVendedor.filter(venda => {
    const vendaDate = new Date(venda.enviado_em);
    return vendaDate.getMonth() + 1 === filtroMes && vendaDate.getFullYear() === filtroAno;
  });

  // Função para calcular o número de semanas no mês
  const getWeeksInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Encontrar a primeira quarta-feira
    let firstWednesday = new Date(firstDay);
    while (firstWednesday.getDay() !== 3) { // 3 = Wednesday
      firstWednesday.setDate(firstWednesday.getDate() + 1);
    }
    
    // Contar semanas completas
    const weeks = [];
    let currentWednesday = new Date(firstWednesday);
    
    while (currentWednesday <= lastDay) {
      const weekEnd = new Date(currentWednesday);
      weekEnd.setDate(weekEnd.getDate() + 6); // Próxima terça-feira
      
      weeks.push({
        start: new Date(currentWednesday),
        end: weekEnd > lastDay ? lastDay : weekEnd
      });
      
      currentWednesday.setDate(currentWednesday.getDate() + 7);
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
        const isNaSemana = vendaDate >= week.start && vendaDate <= week.end;
        
        return isVendedor && isAprovada && isNaSemana;
      }).length;
      
      console.log(`📊 Semana ${index + 1}:`, {
        periodo: `${week.start.toLocaleDateString('pt-BR')} - ${week.end.toLocaleDateString('pt-BR')}`,
        vendas: weekSales
      });
      
      return {
        week: index + 1,
        sales: weekSales,
        isCurrentWeek: index === currentWeekIndex,
        isPastWeek: index < currentWeekIndex,
        period: `${week.start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${week.end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
      };
    });
  };

  const meta = metas.find(m => 
    m.vendedor_id === vendedorId && 
    m.mes === filtroMes && 
    m.ano === filtroAno
  );

  const approvedSales = getApprovedSales(vendedorId, filtroAno, filtroMes);
  const progressPercentage = meta?.meta_vendas && meta.meta_vendas > 0 ? (approvedSales / meta.meta_vendas) * 100 : 0;
  const weeks = getWeeksInMonth(filtroAno, filtroMes);
  const metaPorSemana = meta?.meta_vendas ? Math.ceil(meta.meta_vendas / weeks.length) : 0;
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metas" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="vendas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vendas
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

            {meta ? (
              <>
                {/* Progresso geral */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Progresso Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Meta: {meta.meta_vendas} vendas</span>
                        <span>{approvedSales} / {meta.meta_vendas} ({Math.round(progressPercentage)}%)</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Progresso semanal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Progresso Semanal (Meta: {metaPorSemana} vendas/semana)
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
                                {week.sales}/{metaPorSemana}
                              </span>
                            </div>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VendorWeeklyGoalsModal;