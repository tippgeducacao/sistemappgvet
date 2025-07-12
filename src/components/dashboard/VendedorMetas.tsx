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

  // Usar a mesma lógica do admin para calcular semanas
  const semanasDoMes = getSemanasDoMes(selectedYear, selectedMonth);

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
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth() + 1;
  const anoAtual = dataAtual.getFullYear();
  
  // Só buscar meta da semana atual se estivermos no mês correto
  const metaSemanaAtual = (selectedMonth === mesAtual && selectedYear === anoAtual) 
    ? metasSemanais.find(meta => 
        meta.vendedor_id === profile.id && 
        meta.ano === selectedYear && 
        meta.semana === semanaAtual
      )
    : null;

  console.log('🎯 VendedorMetas DEBUG:', {
    semanaAtual,
    selectedYear,
    selectedMonth,
    semanasDoMes,
    metaSemanaAtual,
    todasMetasSemanais: metasSemanais,
    metasDoVendedor: metasSemanais.filter(m => m.vendedor_id === profile.id),
    profileId: profile.id
  });

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
            <CardTitle className="text-sm font-medium">
              {selectedMonth === mesAtual && selectedYear === anoAtual 
                ? "Meta da Semana Atual" 
                : "Meta da Semana"
              }
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metaSemanaAtual?.meta_vendas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth === mesAtual && selectedYear === anoAtual 
                ? `Semana ${semanaAtual} de ${selectedYear}` 
                : "Visualizando mês anterior/posterior"
              }
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progresso</span>
                <span>
                  {(() => {
                    // Calcular vendas da semana atual usando o mesmo sistema
                    const inicioSemana = new Date(selectedYear, selectedMonth - 1, 1);
                    let firstWednesday = new Date(inicioSemana);
                    while (firstWednesday.getDay() !== 3) {
                      firstWednesday.setDate(firstWednesday.getDate() + 1);
                    }
                    
                    const targetWednesday = new Date(firstWednesday);
                    targetWednesday.setDate(targetWednesday.getDate() + (semanaAtual - 1) * 7);
                    
                    const fimSemana = new Date(targetWednesday);
                    fimSemana.setDate(fimSemana.getDate() + 6);
                    
                    const lastDay = new Date(selectedYear, selectedMonth, 0);
                    const endDate = fimSemana > lastDay ? lastDay : fimSemana;

                    const vendasSemanaAtual = vendas.filter(venda => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      
                      const vendaDate = new Date(venda.enviado_em);
                      return vendaDate >= targetWednesday && vendaDate <= endDate;
                    }).length;
                    
                    return `${vendasSemanaAtual}/${metaSemanaAtual?.meta_vendas || 0}`;
                  })()}
                </span>
              </div>
              {metaSemanaAtual && metaSemanaAtual.meta_vendas > 0 && (
                <Progress 
                  value={(() => {
                    // Mesmo cálculo para o progresso
                    const inicioSemana = new Date(selectedYear, selectedMonth - 1, 1);
                    let firstWednesday = new Date(inicioSemana);
                    while (firstWednesday.getDay() !== 3) {
                      firstWednesday.setDate(firstWednesday.getDate() + 1);
                    }
                    
                    const targetWednesday = new Date(firstWednesday);
                    targetWednesday.setDate(targetWednesday.getDate() + (semanaAtual - 1) * 7);
                    
                    const fimSemana = new Date(targetWednesday);
                    fimSemana.setDate(fimSemana.getDate() + 6);
                    
                    const lastDay = new Date(selectedYear, selectedMonth, 0);
                    const endDate = fimSemana > lastDay ? lastDay : fimSemana;

                    const vendasSemanaAtual = vendas.filter(venda => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      
                      const vendaDate = new Date(venda.enviado_em);
                      return vendaDate >= targetWednesday && vendaDate <= endDate;
                    }).length;
                    
                    return Math.min((vendasSemanaAtual / metaSemanaAtual.meta_vendas) * 100, 100);
                  })()} 
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
              // Buscar meta semanal para o mês e semana específicos
              const metaSemanal = metasSemanais.find(meta => 
                meta.vendedor_id === profile.id && 
                meta.ano === selectedYear && 
                meta.semana === numeroSemana
              );
              // Só considerar como atual se estivermos no mês e ano corretos
              const dataAtual = new Date();
              const mesAtual = dataAtual.getMonth() + 1;
              const anoAtual = dataAtual.getFullYear();
              const isAtual = numeroSemana === semanaAtual && selectedMonth === mesAtual && selectedYear === anoAtual;
              
              // Calcular vendas desta semana específica usando as datas corretas
              const inicioSemana = new Date(selectedYear, selectedMonth - 1, 1);
              let firstWednesday = new Date(inicioSemana);
              while (firstWednesday.getDay() !== 3) {
                firstWednesday.setDate(firstWednesday.getDate() + 1);
              }
              
              const targetWednesday = new Date(firstWednesday);
              targetWednesday.setDate(targetWednesday.getDate() + (numeroSemana - 1) * 7);
              
              const fimSemana = new Date(targetWednesday);
              fimSemana.setDate(fimSemana.getDate() + 6);
              
              const lastDay = new Date(selectedYear, selectedMonth, 0);
              const endDate = fimSemana > lastDay ? lastDay : fimSemana;

              // Formatar datas para exibição (DD/MM)
              const formatDate = (date: Date) => {
                return date.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                });
              };

              const periodoSemana = `${formatDate(targetWednesday)} - ${formatDate(endDate)}`;

              const vendasDaSemana = vendas.filter(venda => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                const vendaDate = new Date(venda.enviado_em);
                return vendaDate >= targetWednesday && vendaDate <= endDate;
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

                    {/* Período da semana */}
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {periodoSemana}
                      </span>
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