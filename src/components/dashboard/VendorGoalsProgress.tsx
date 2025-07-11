import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar } from 'lucide-react';
import { useMetas } from '@/hooks/useMetas';
import { useVendas } from '@/hooks/useVendas';

interface VendorGoalsProgressProps {
  selectedMonth: number;
  selectedYear: number;
  selectedVendedor?: string;
}

const VendorGoalsProgress: React.FC<VendorGoalsProgressProps> = ({
  selectedMonth,
  selectedYear,
  selectedVendedor
}) => {
  const { metas } = useMetas();
  const { vendas } = useVendas();

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

  const filteredMetas = selectedVendedor && selectedVendedor !== 'todos' 
    ? metas.filter(meta => 
        meta.vendedor_id === selectedVendedor && 
        meta.mes === selectedMonth && 
        meta.ano === selectedYear
      )
    : metas.filter(meta => 
        meta.mes === selectedMonth && 
        meta.ano === selectedYear
      );

  if (filteredMetas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso das Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta definida para este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredMetas.map((meta) => {
        const approvedSales = getApprovedSales(meta.vendedor_id, selectedYear, selectedMonth);
        const progressPercentage = meta.meta_vendas > 0 ? (approvedSales / meta.meta_vendas) * 100 : 0;
        const weeks = getWeeksInMonth(selectedYear, selectedMonth);
        const metaPorSemana = Math.ceil(meta.meta_vendas / weeks.length);
        const weeklyProgress = getWeeklyProgress(meta.vendedor_id, selectedYear, selectedMonth);
        
        return (
          <Card key={meta.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Meta - Vendedor ID: {meta.vendedor_id.slice(0, 8)}...
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  {approvedSales} / {meta.meta_vendas} vendas
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progresso geral */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Mensal</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              
              {/* Progresso semanal */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Progresso Semanal (Meta: {metaPorSemana} vendas/semana)
                </div>
                
                <div className="grid gap-2">
                  {weeklyProgress.map((week) => (
                    <div key={week.week} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VendorGoalsProgress;