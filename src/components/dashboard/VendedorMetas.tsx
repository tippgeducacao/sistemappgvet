import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy } from 'lucide-react';
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
  const { metasSemanais, getSemanaAtual, getSemanasDoMes, loading: metasSemanaisLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { profile } = useAuthStore();

  console.log('🔍 VendedorMetas - Estado dos hooks:', {
    vendasLoading,
    metasSemanaisLoading,
    vendasLength: vendas?.length || 0,
    profile: profile ? { id: profile.id, name: profile.name } : 'null'
  });

  if (vendasLoading || metasSemanaisLoading) {
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

  const mesNome = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

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
      {/* Card da Semana Atual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta da Semana Atual</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {(() => {
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth() + 1;
            const anoAtual = dataAtual.getFullYear();
            const semanaAtual = getSemanaAtual();
            
            // Só buscar meta da semana atual se estivermos no mês correto
            const metaSemanaAtual = (selectedMonth === mesAtual && selectedYear === anoAtual) 
              ? metasSemanais.find(meta => 
                  meta.vendedor_id === profile.id && 
                  meta.ano === selectedYear && 
                  meta.semana === semanaAtual
                )
              : null;

            return (
              <>
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
                        if (!metaSemanaAtual) return "0/0";
                        
                        // Calcular vendas da semana atual
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

                         const pontosSemanaAtual = vendas.filter(venda => {
                           if (venda.vendedor_id !== profile.id) return false;
                           if (venda.status !== 'matriculado') return false;
                           
                           const vendaDate = new Date(venda.enviado_em);
                           return vendaDate >= targetWednesday && vendaDate <= endDate;
                         }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                         
                         return `${pontosSemanaAtual.toFixed(1)}/${metaSemanaAtual.meta_vendas}`;
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

                         const pontosSemanaAtual = vendas.filter(venda => {
                           if (venda.vendedor_id !== profile.id) return false;
                           if (venda.status !== 'matriculado') return false;
                           
                           const vendaDate = new Date(venda.enviado_em);
                           return vendaDate >= targetWednesday && vendaDate <= endDate;
                         }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                         
                         return Math.min((pontosSemanaAtual / metaSemanaAtual.meta_vendas) * 100, 100);
                      })()} 
                      className="h-2" 
                    />
                  )}
                </div>
                <Badge variant={metaSemanaAtual ? "default" : "secondary"} className="mt-2">
                  {metaSemanaAtual ? "Meta Definida" : "Não Definida"}
                </Badge>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Metas Semanais Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metas Semanais - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
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
              const semanaAtual = getSemanaAtual();
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

              const pontosDaSemana = vendas.filter(venda => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                const vendaDate = new Date(venda.enviado_em);
                return vendaDate >= targetWednesday && vendaDate <= endDate;
              }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

              const progressoSemanal = metaSemanal?.meta_vendas && metaSemanal.meta_vendas > 0 
                ? (pontosDaSemana / metaSemanal.meta_vendas) * 100 
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
                           Pontos: {pontosDaSemana.toFixed(1)}
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
                  
                  {metaSemanal && pontosDaSemana >= metaSemanal.meta_vendas && (
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