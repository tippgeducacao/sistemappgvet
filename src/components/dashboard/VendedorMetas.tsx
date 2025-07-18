import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, DollarSign } from 'lucide-react';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useAllVendas } from '@/hooks/useVendas';
import { useAuthStore } from '@/stores/AuthStore';
import { useNiveis } from '@/hooks/useNiveis';
import { useVendedores } from '@/hooks/useVendedores';
import { ComissionamentoService } from '@/services/comissionamentoService';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  const { metasSemanais, getSemanaAtual, getSemanasDoMes, getDataInicioSemana, getDataFimSemana, loading: metasSemanaisLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { profile } = useAuthStore();
  const { niveis } = useNiveis();
  const { vendedores } = useVendedores();

  if (vendasLoading || metasSemanaisLoading) {
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
                         
                         return `${pontosSemanaAtual.toFixed(1)}/${metaSemanaAtual.meta_vendas} pts`;
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
              
              // Buscar nível do vendedor
              const vendedorInfo = vendedores.find(v => v.id === profile.id);
              const vendedorNivel = vendedorInfo?.nivel || 'junior';
              const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
              
              // Só considerar como atual se estivermos no mês e ano corretos
              const dataAtual = new Date();
              const mesAtual = dataAtual.getMonth() + 1;
              const anoAtual = dataAtual.getFullYear();
              const semanaAtual = getSemanaAtual();
              const isAtual = numeroSemana === semanaAtual && selectedMonth === mesAtual && selectedYear === anoAtual;
              
              // Usar as funções auxiliares do hook para obter as datas corretas
              const startSemana = getDataInicioSemana(selectedYear, selectedMonth, numeroSemana);
              const endSemana = getDataFimSemana(selectedYear, selectedMonth, numeroSemana);

              // Formatar datas para exibição (DD/MM)
              const formatDate = (date: Date) => {
                return date.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                });
              };

              const periodoSemana = `${formatDate(startSemana)} - ${formatDate(endSemana)}`;

              // Calcular pontos da semana
              const pontosDaSemana = vendas.filter(venda => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                const vendaDate = new Date(venda.enviado_em);
                return vendaDate >= startSemana && vendaDate <= endSemana;
              }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);

              const progressoSemanal = metaSemanal?.meta_vendas && metaSemanal.meta_vendas > 0 
                ? (pontosDaSemana / metaSemanal.meta_vendas) * 100 
                : 0;

              // Calcular comissionamento
              const metaSemanalisConfig = nivelConfig?.meta_semanal_vendedor || metaSemanal?.meta_vendas || 0;
              const variavelSemanal = nivelConfig?.variavel_semanal || 0;
              const percentualObtido = metaSemanalisConfig > 0 ? (pontosDaSemana / metaSemanalisConfig) * 100 : 0;
              
              // Simular o cálculo de comissão (sem async por ser em map)
              const calcularMultiplicador = (percentual: number) => {
                if (percentual >= 120) return 3;
                if (percentual >= 100) return 2;
                if (percentual >= 80) return 1;
                return 0;
              };
              
              const multiplicador = calcularMultiplicador(percentualObtido);
              const valorComissao = variavelSemanal * multiplicador;
              
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
                          Meta: {metaSemanal?.meta_vendas || 0} pts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {pontosDaSemana.toFixed(1)}/{metaSemanal?.meta_vendas || 0} pts
                        </span>
                      </div>
                    </div>

                    {/* Período da semana */}
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {periodoSemana}
                      </span>
                    </div>
                    
                    {/* Progresso da semana */}
                    {metaSemanal && metaSemanal.meta_vendas > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Progress 
                          value={Math.min(progressoSemanal, 100)} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-xs font-medium min-w-fit">
                          {Math.round(progressoSemanal)}%
                        </span>
                      </div>
                    )}

                    {/* Informações de comissionamento */}
                    {metaSemanal && metaSemanal.meta_vendas > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-muted/30 rounded">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Percentual</div>
                          <div className="text-xs font-medium">{Math.round(percentualObtido)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Multiplicador</div>
                          <div className="text-xs font-medium">{multiplicador}x</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">Comissão</div>
                          <div className="text-xs font-medium text-green-600">
                            R$ {valorComissao.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!metaSemanal && (
                      <p className="text-xs text-muted-foreground">
                        Meta não definida para esta semana
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    {metaSemanal && pontosDaSemana >= metaSemanal.meta_vendas && (
                      <Trophy className="h-4 w-4 text-green-500" />
                    )}
                    {valorComissao > 0 && (
                      <DollarSign className="h-4 w-4 text-green-600" />
                    )}
                  </div>
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