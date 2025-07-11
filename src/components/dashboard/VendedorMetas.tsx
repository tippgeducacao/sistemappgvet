import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, Trophy } from 'lucide-react';
import { useMetas } from '@/hooks/useMetas';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAllVendas } from '@/hooks/useVendas';
import { useAuthStore } from '@/stores/AuthStore';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  console.log('🎯 VendedorMetas - COMPONENTE INICIADO', { selectedMonth, selectedYear });
  const { metas, loading: metasLoading } = useMetas();
  const { metasSemanais, getMetaSemanalVendedor, getSemanaAtual, getSemanasDoMes, loading: metasSemanaisLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { profile } = useAuthStore();

  console.log('🔍 VendedorMetas - Estado dos hooks:', {
    metasLoading,
    vendasLoading,
    metasLength: metas?.length || 0,
    vendasLength: vendas?.length || 0,
    profile: profile ? { id: profile.id, name: profile.name } : 'null'
  });

  if (metasLoading || vendasLoading || metasSemanaisLoading) {
    console.log('⏳ VendedorMetas - Ainda carregando dados...');
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando metas...</p>
        </CardContent>
      </Card>
    );
  }

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

  console.log('🎯 VendedorMetas Debug:', {
    vendedorId: profile.id,
    selectedMonth,
    selectedYear,
    todasMetas: metas,
    metaEncontrada: meta,
    metasDoVendedor: metas.filter(m => m.vendedor_id === profile.id)
  });

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

  // Dados para metas semanais
  const semanaAtual = getSemanaAtual();
  const semanasDoMes = getSemanasDoMes(selectedYear, selectedMonth);
  const metaSemanaAtual = getMetaSemanalVendedor(profile.id, selectedYear, semanaAtual);

  return (
    <div className="space-y-4">
      {/* Grid com os dois principais cards de metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meta Mensal */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta do Mês</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meta?.meta_vendas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span>{approvedSales}/{meta?.meta_vendas || 0}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {progressPercentage >= 100 && (
              <Badge variant="default" className="mt-2">
                ✓ Meta Atingida!
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Meta da Semana Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta da Semana Atual</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metaSemanaAtual?.meta_vendas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Semana {semanaAtual} de {selectedYear}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span>
                  {vendas.filter(venda => {
                    if (venda.vendedor_id !== profile.id) return false;
                    if (venda.status !== 'matriculado') return false;
                    
                    const vendaDate = new Date(venda.enviado_em);
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const diff = vendaDate.getTime() - startOfYear.getTime();
                    const oneWeek = 1000 * 60 * 60 * 24 * 7;
                    const semanaVenda = Math.ceil(diff / oneWeek);
                    
                    return semanaVenda === semanaAtual;
                  }).length}/{metaSemanaAtual?.meta_vendas || 0}
                </span>
              </div>
              {metaSemanaAtual && metaSemanaAtual.meta_vendas > 0 && (
                <Progress 
                  value={Math.min((vendas.filter(venda => {
                    if (venda.vendedor_id !== profile.id) return false;
                    if (venda.status !== 'matriculado') return false;
                    
                    const vendaDate = new Date(venda.enviado_em);
                    const startOfYear = new Date(selectedYear, 0, 1);
                    const diff = vendaDate.getTime() - startOfYear.getTime();
                    const oneWeek = 1000 * 60 * 60 * 24 * 7;
                    const semanaVenda = Math.ceil(diff / oneWeek);
                    
                    return semanaVenda === semanaAtual;
                  }).length / metaSemanaAtual.meta_vendas) * 100, 100)} 
                  className="h-2" 
                />
              )}
            </div>
            <Badge variant={metaSemanaAtual ? "default" : "secondary"} className="mt-2">
              {metaSemanaAtual ? "Meta Definida" : "Não Definida"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Metas Semanais Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metas Semanais Individuais - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {semanasDoMes.map((numeroSemana) => {
              const metaSemanal = getMetaSemanalVendedor(profile.id, selectedYear, numeroSemana);
              const isAtual = numeroSemana === semanaAtual;
              
              // Calcular vendas desta semana específica
              const vendasDaSemana = vendas.filter(venda => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                const vendaDate = new Date(venda.enviado_em);
                const startOfYear = new Date(selectedYear, 0, 1);
                const diff = vendaDate.getTime() - startOfYear.getTime();
                const oneWeek = 1000 * 60 * 60 * 24 * 7;
                const semanaVenda = Math.ceil(diff / oneWeek);
                
                return semanaVenda === numeroSemana;
              }).length;

              const progressoSemanal = metaSemanal?.meta_vendas && metaSemanal.meta_vendas > 0 
                ? (vendasDaSemana / metaSemanal.meta_vendas) * 100 
                : 0;
              
              return (
                <div 
                  key={numeroSemana} 
                  className={`flex items-center gap-3 p-4 rounded-lg border ${
                    isAtual ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Semana {numeroSemana}
                        </span>
                        {isAtual && (
                          <Badge variant="default" className="text-xs">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={metaSemanal ? "default" : "outline"} className="text-xs">
                          Meta: {metaSemanal?.meta_vendas || 0}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Vendas: {vendasDaSemana}
                        </span>
                      </div>
                    </div>
                    
                    {metaSemanal && metaSemanal.meta_vendas > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min(progressoSemanal, 100)} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs font-medium min-w-fit">
                          {Math.round(progressoSemanal)}%
                        </span>
                      </div>
                    )}
                    
                    {!metaSemanal && (
                      <p className="text-xs text-muted-foreground">
                        Meta não definida para esta semana
                      </p>
                    )}
                  </div>
                  
                  {metaSemanal && vendasDaSemana >= metaSemanal.meta_vendas && (
                    <Trophy className="h-4 w-4 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
          
          {semanasDoMes.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma semana encontrada para este período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetas;