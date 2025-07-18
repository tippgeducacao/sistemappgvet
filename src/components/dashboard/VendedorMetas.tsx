import React, { useEffect, useState } from 'react';
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
  
  // Estado para armazenar os cálculos de comissão de cada semana
  const [comissoesPorSemana, setComissoesPorSemana] = useState<{[key: string]: {valor: number, multiplicador: number, percentual: number}}>({});

  // Calcular comissões quando os dados mudarem
  useEffect(() => {
    const calcularComissoes = async () => {
      if (!profile?.id || vendasLoading || metasSemanaisLoading) return;
      
      const vendedorInfo = vendedores.find(v => v.id === profile.id);
      const vendedorNivel = vendedorInfo?.nivel || 'junior';
      const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
      
      if (!nivelConfig) return;
      
      const semanasDoMes = getSemanasDoMes(selectedYear, selectedMonth);
      const novasComissoes: {[key: string]: {valor: number, multiplicador: number, percentual: number}} = {};
      
      for (const numeroSemana of semanasDoMes) {
        const metaSemanal = metasSemanais.find(meta => 
          meta.vendedor_id === profile.id && 
          meta.ano === selectedYear && 
          meta.semana === numeroSemana
        );
        
        if (metaSemanal && metaSemanal.meta_vendas > 0) {
          const startSemana = getDataInicioSemana(selectedYear, selectedMonth, numeroSemana);
          const endSemana = getDataFimSemana(selectedYear, selectedMonth, numeroSemana);
          
          const pontosDaSemana = vendas.filter(venda => {
            if (venda.vendedor_id !== profile.id) return false;
            if (venda.status !== 'matriculado') return false;
            
            const vendaDate = new Date(venda.enviado_em);
            return vendaDate >= startSemana && vendaDate <= endSemana;
          }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
          
          try {
            const comissaoData = await ComissionamentoService.calcularComissao(
              pontosDaSemana,
              metaSemanal.meta_vendas,
              nivelConfig.variavel_semanal,
              'vendedor'
            );
            
            novasComissoes[`${selectedYear}-${selectedMonth}-${numeroSemana}`] = comissaoData;
          } catch (error) {
            console.error('Erro ao calcular comissão:', error);
            novasComissoes[`${selectedYear}-${selectedMonth}-${numeroSemana}`] = {
              valor: 0,
              multiplicador: 0,
              percentual: 0
            };
          }
        }
      }
      
      setComissoesPorSemana(novasComissoes);
    };
    
    calcularComissoes();
  }, [profile?.id, vendas, metasSemanais, niveis, vendedores, selectedMonth, selectedYear, vendasLoading, metasSemanaisLoading]);

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
          <div className="space-y-2">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-8 gap-2 p-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground border-b">
              <div>Semana</div>
              <div>Período</div>
              <div>Meta</div>
              <div>Pontos</div>
              <div>%</div>
              <div>Mult.</div>
              <div>Comissão</div>
              <div>Status</div>
            </div>
            
            {/* Linhas das semanas */}
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
                const isInRange = vendaDate >= startSemana && vendaDate <= endSemana;
                
                // Debug para entender melhor
                console.log(`📅 Semana ${numeroSemana}: ${formatDate(startSemana)} - ${formatDate(endSemana)}, Venda: ${venda.aluno?.nome}, Data: ${vendaDate.toLocaleDateString('pt-BR')}, InRange: ${isInRange}, Pontos: ${venda.pontuacao_validada || venda.pontuacao_esperada || 0}`);
                
                return isInRange;
              }).reduce((total, venda) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
              
              console.log(`📊 Semana ${numeroSemana} - Total de pontos: ${pontosDaSemana}`);

              const progressoSemanal = metaSemanal?.meta_vendas && metaSemanal.meta_vendas > 0 
                ? (pontosDaSemana / metaSemanal.meta_vendas) * 100 
                : 0;

              // Buscar dados de comissão calculados
              const chaveComissao = `${selectedYear}-${selectedMonth}-${numeroSemana}`;
              const comissaoData = comissoesPorSemana[chaveComissao] || {
                valor: 0,
                multiplicador: 0,
                percentual: 0
              };
              
              return (
                <div 
                  key={numeroSemana} 
                  className={`grid grid-cols-8 gap-2 p-2 text-xs border rounded hover:bg-muted/30 transition-colors ${
                    isAtual ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-card'
                  }`}
                >
                  {/* Semana */}
                  <div className="flex items-center gap-1 font-medium">
                    <span>{numeroSemana}</span>
                    {isAtual && (
                      <Badge variant="default" className="text-[10px] h-4 px-1">
                        Atual
                      </Badge>
                    )}
                  </div>
                  
                  {/* Período */}
                  <div className="text-muted-foreground text-[10px] flex items-center">
                    {periodoSemana}
                  </div>
                  
                  {/* Meta */}
                  <div className="flex items-center">
                    <Badge variant={metaSemanal ? "default" : "outline"} className="text-[10px] h-4 px-1">
                      {metaSemanal?.meta_vendas || 0}
                    </Badge>
                  </div>
                  
                  {/* Pontos */}
                  <div className="flex items-center font-medium">
                    {pontosDaSemana.toFixed(1)}
                  </div>
                  
                  {/* Percentual */}
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      comissaoData.percentual >= 100 ? 'text-green-600' : 
                      comissaoData.percentual >= 80 ? 'text-yellow-600' : 'text-muted-foreground'
                    }`}>
                      {comissaoData.percentual.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Multiplicador */}
                  <div className="flex items-center">
                    <Badge variant={comissaoData.multiplicador > 0 ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                      {comissaoData.multiplicador}x
                    </Badge>
                  </div>
                  
                  {/* Comissão */}
                  <div className="flex items-center font-medium text-green-600">
                    R$ {comissaoData.valor.toFixed(0)}
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center justify-center gap-1">
                    {metaSemanal && pontosDaSemana >= metaSemanal.meta_vendas && (
                      <Trophy className="h-3 w-3 text-green-500" />
                    )}
                    {comissaoData.valor > 0 && (
                      <DollarSign className="h-3 w-3 text-green-600" />
                    )}
                    {!metaSemanal && (
                      <span className="text-muted-foreground text-[10px]">N/D</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Linha de Total */}
            {semanasDoMes.length > 0 && (
              <div className="grid grid-cols-8 gap-2 p-2 text-xs font-medium bg-muted/70 rounded border-t-2 border-primary/20">
                <div>TOTAL</div>
                <div className="text-muted-foreground">-</div>
                <div className="font-bold">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const metaSemanal = metasSemanais.find(meta => 
                      meta.vendedor_id === profile.id && 
                      meta.ano === selectedYear && 
                      meta.semana === numeroSemana
                    );
                    return total + (metaSemanal?.meta_vendas || 0);
                  }, 0)}
                </div>
                <div className="font-bold text-primary">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const startSemana = getDataInicioSemana(selectedYear, selectedMonth, numeroSemana);
                    const endSemana = getDataFimSemana(selectedYear, selectedMonth, numeroSemana);
                    const pontosDaSemana = vendas.filter(venda => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      const vendaDate = new Date(venda.enviado_em);
                      return vendaDate >= startSemana && vendaDate <= endSemana;
                    }).reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                    return total + pontosDaSemana;
                  }, 0).toFixed(1)}
                </div>
                <div className="font-bold">
                  {(() => {
                    const totalMeta = semanasDoMes.reduce((total, numeroSemana) => {
                      const metaSemanal = metasSemanais.find(meta => 
                        meta.vendedor_id === profile.id && 
                        meta.ano === selectedYear && 
                        meta.semana === numeroSemana
                      );
                      return total + (metaSemanal?.meta_vendas || 0);
                    }, 0);
                    const totalPontos = semanasDoMes.reduce((total, numeroSemana) => {
                      const startSemana = getDataInicioSemana(selectedYear, selectedMonth, numeroSemana);
                      const endSemana = getDataFimSemana(selectedYear, selectedMonth, numeroSemana);
                      const pontosDaSemana = vendas.filter(venda => {
                        if (venda.vendedor_id !== profile.id) return false;
                        if (venda.status !== 'matriculado') return false;
                        const vendaDate = new Date(venda.enviado_em);
                        return vendaDate >= startSemana && vendaDate <= endSemana;
                      }).reduce((sum, venda) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                      return total + pontosDaSemana;
                    }, 0);
                    const percentualTotal = totalMeta > 0 ? (totalPontos / totalMeta) * 100 : 0;
                    return `${percentualTotal.toFixed(0)}%`;
                  })()}
                </div>
                <div>-</div>
                <div className="font-bold text-green-600">
                  R$ {Object.values(comissoesPorSemana).reduce((total, comissao) => total + comissao.valor, 0).toFixed(0)}
                </div>
                <div className="flex justify-center">
                  {Object.values(comissoesPorSemana).some(c => c.valor > 0) && (
                    <DollarSign className="h-3 w-3 text-green-600" />
                  )}
                </div>
              </div>
            )}
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