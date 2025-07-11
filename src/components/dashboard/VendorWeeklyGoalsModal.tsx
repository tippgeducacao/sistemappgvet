import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Target, Calendar, TrendingUp } from 'lucide-react';
import { useMetas } from '@/hooks/useMetas';
import { useVendas } from '@/hooks/useVendas';

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
  const { vendas } = useVendas();

  if (!vendedorId || !vendedorNome) return null;

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
    
    return vendas.filter(venda => {
      if (venda.vendedor_id !== vendedorId) return false;
      if (venda.status !== 'matriculado') return false;
      
      const vendaDate = new Date(venda.enviado_em);
      return vendaDate >= startDate && vendaDate <= endDate;
    }).length;
  };

  // Função para calcular progresso semanal
  const getWeeklyProgress = (vendedorId: string, year: number, month: number) => {
    const weeks = getWeeksInMonth(year, month);
    const currentDate = new Date();
    const currentWeekIndex = weeks.findIndex(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    
    return weeks.map((week, index) => {
      const weekSales = vendas.filter(venda => {
        if (venda.vendedor_id !== vendedorId) return false;
        if (venda.status !== 'matriculado') return false;
        
        const vendaDate = new Date(venda.enviado_em);
        return vendaDate >= week.start && vendaDate <= week.end;
      }).length;
      
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
    m.mes === selectedMonth && 
    m.ano === selectedYear
  );

  const approvedSales = getApprovedSales(vendedorId, selectedYear, selectedMonth);
  const progressPercentage = meta?.meta_vendas && meta.meta_vendas > 0 ? (approvedSales / meta.meta_vendas) * 100 : 0;
  const weeks = getWeeksInMonth(selectedYear, selectedMonth);
  const metaPorSemana = meta?.meta_vendas ? Math.ceil(meta.meta_vendas / weeks.length) : 0;
  const weeklyProgress = getWeeklyProgress(vendedorId, selectedYear, selectedMonth);

  const mesNome = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={vendedorPhoto} alt={vendedorNome} />
              <AvatarFallback>
                {vendedorNome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{vendedorNome}</h2>
              <p className="text-sm text-muted-foreground capitalize">Metas de {mesNome}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
                <p className="text-muted-foreground">Nenhuma meta definida para este período</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorWeeklyGoalsModal;