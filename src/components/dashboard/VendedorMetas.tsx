import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, TrendingUp, Trophy } from 'lucide-react';
import { useMetas } from '@/hooks/useMetas';
import { useVendas } from '@/hooks/useVendas';
import { useAuthStore } from '@/stores/AuthStore';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  const { metas } = useMetas();
  const { vendas } = useVendas();
  const { profile } = useAuthStore();

  if (!profile?.id) return null;

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
  const getApprovedSales = (year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return vendas.filter(venda => {
      if (venda.vendedor_id !== profile.id) return false;
      if (venda.status !== 'matriculado') return false;
      
      const vendaDate = new Date(venda.enviado_em);
      return vendaDate >= startDate && vendaDate <= endDate;
    }).length;
  };

  // Função para calcular progresso semanal
  const getWeeklyProgress = (year: number, month: number) => {
    const weeks = getWeeksInMonth(year, month);
    const currentDate = new Date();
    const currentWeekIndex = weeks.findIndex(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    
    return weeks.map((week, index) => {
      const weekSales = vendas.filter(venda => {
        if (venda.vendedor_id !== profile.id) return false;
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
    m.vendedor_id === profile.id && 
    m.mes === selectedMonth && 
    m.ano === selectedYear
  );

  const approvedSales = getApprovedSales(selectedYear, selectedMonth);
  const progressPercentage = meta?.meta_vendas && meta.meta_vendas > 0 ? (approvedSales / meta.meta_vendas) * 100 : 0;
  const weeks = getWeeksInMonth(selectedYear, selectedMonth);
  const metaPorSemana = meta?.meta_vendas ? Math.ceil(meta.meta_vendas / weeks.length) : 0;
  const weeklyProgress = getWeeklyProgress(selectedYear, selectedMonth);

  const mesNome = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  if (!meta) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Minhas Metas - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta definida para este período</p>
            <p className="text-sm mt-1">Entre em contato com seu gestor para definir suas metas.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progresso geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Minha Meta - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              {approvedSales} / {meta.meta_vendas} vendas
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso Mensal</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-4" />
            
            {progressPercentage >= 100 && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Parabéns! Meta mensal atingida!
              </div>
            )}
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
              <div key={week.week} className={`flex items-center gap-3 p-3 rounded-lg border ${
                week.isCurrentWeek ? 'bg-primary/5 border-primary/20' : 'bg-card'
              }`}>
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
                      value={metaPorSemana > 0 ? Math.min((week.sales / metaPorSemana) * 100, 100) : 0} 
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
    </div>
  );
};

export default VendedorMetas;