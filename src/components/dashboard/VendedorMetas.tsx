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
import { useVendaWithFormResponses, getDataMatriculaFromRespostas } from '@/hooks/useVendaWithFormResponses';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  console.log('🚨 VENDEDOR METAS - Props recebidas:', { selectedMonth, selectedYear });
  const { metasSemanais, getSemanaAtual, getMesAnoSemanaAtual, getSemanasDoMes, getDataInicioSemana, getDataFimSemana, loading: metasSemanaisLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { profile } = useAuthStore();
  const { niveis } = useNiveis();
  const { vendedores } = useVendedores();
  
  // Buscar respostas do formulário para usar data de matrícula
  const { vendasWithResponses, isLoading: isLoadingResponses } = useVendaWithFormResponses(vendas);
  
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

  // Obter o mês e ano corretos baseados na semana atual
  const { mes: mesCorretoSemana, ano: anoCorretoSemana } = getMesAnoSemanaAtual();
  
  // Decidir qual mês/ano usar para exibir - priorizar a semana atual se estiver selecionada
  // Usar diretamente a lógica de semanas, sem usar new Date().getMonth()
  const semanaAtual = getSemanaAtual();
  
  // Se o mês/ano selecionado corresponde ao mês/ano da semana atual, mostrar o mês da semana
  // Senão, mostrar o mês selecionado normalmente
  const { mesParaExibir, anoParaExibir, isSemanaAtual } = 
    (selectedMonth === mesCorretoSemana && selectedYear === anoCorretoSemana)
    ? { 
        mesParaExibir: mesCorretoSemana, 
        anoParaExibir: anoCorretoSemana, 
        isSemanaAtual: true 
      }
    : { 
        mesParaExibir: selectedMonth, 
        anoParaExibir: selectedYear, 
        isSemanaAtual: false 
      };

  // Usar a mesma lógica do admin para calcular semanas
  const semanasDoMes = getSemanasDoMes(anoParaExibir, mesParaExibir);

  const mesNome = new Date(anoParaExibir, mesParaExibir - 1).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  console.log('🔍 DEBUG VendedorMetas:');
  console.log('  📅 Selecionado:', selectedMonth, '/', selectedYear);
  console.log('  📅 Semana atual pertence a:', mesCorretoSemana, '/', anoCorretoSemana);
  console.log('  📅 Exibindo:', mesParaExibir, '/', anoParaExibir);
  console.log('  📅 É semana atual?', isSemanaAtual);
  
  // Só buscar meta da semana atual se estivermos no mês correto da semana
  const metaSemanaAtual = isSemanaAtual
    ? metasSemanais.find(meta => 
        meta.vendedor_id === profile.id && 
        meta.ano === anoCorretoSemana && 
        meta.semana === semanaAtual
      )
    : null;


  return (
    <div className="space-y-4">
      {/* Metas Semanais Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metas Semanais - {mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}
            {isSemanaAtual && (
              <Badge variant="default" className="text-xs">
                Semana Atual
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-9 gap-2 p-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground border-b">
              <div>Semana</div>
              <div>Período</div>
              <div>Base</div>
              <div>Meta</div>
              <div>Pontos</div>
              <div>%</div>
              <div>Mult.</div>
              <div>Comissão</div>
              <div>Status</div>
            </div>
            
            {/* Linhas das semanas */}
            {semanasDoMes.map((numeroSemana) => {
              // Buscar meta semanal para o mês e semana específicos (usando os valores corretos)
              const metaSemanal = metasSemanais.find(meta => 
                meta.vendedor_id === profile.id && 
                meta.ano === anoParaExibir && 
                meta.semana === numeroSemana
              );
              
              // Verificar se é a semana atual (apenas se estivermos vendo o mês da semana atual)
              const isAtual = isSemanaAtual && numeroSemana === semanaAtual;
              
              // Usar as funções auxiliares do hook para obter as datas corretas
              const startSemana = getDataInicioSemana(anoParaExibir, mesParaExibir, numeroSemana);
              const endSemana = getDataFimSemana(anoParaExibir, mesParaExibir, numeroSemana);

              // Formatar datas para exibição (DD/MM)
              const formatDate = (date: Date) => {
                return date.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                });
              };

              const periodoSemana = `${formatDate(startSemana)} - ${formatDate(endSemana)}`;

              // Calcular pontos da semana usando data de matrícula do formulário
              const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                // NOVA LÓGICA: Usar data de matrícula das respostas do formulário
                let dataVenda: Date;
                const dataMatricula = getDataMatriculaFromRespostas(respostas);
                
                if (dataMatricula) {
                  dataVenda = dataMatricula;
                } else {
                  // Fallback para data de envio se não houver data de matrícula
                  dataVenda = new Date(venda.enviado_em);
                }
                
                // Ajustar para considerar a zona de tempo corretamente
                dataVenda.setHours(0, 0, 0, 0);
                
                const startSemanaUTC = new Date(startSemana);
                startSemanaUTC.setHours(0, 0, 0, 0);
                
                const endSemanaUTC = new Date(endSemana);
                endSemanaUTC.setHours(23, 59, 59, 999);
                
                const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                
                // Debug detalhado para identificar inconsistências no dashboard pessoal
                if (profile?.name === 'Adones') {
                  console.log(`🔍 DASHBOARD PESSOAL - Processando venda do Adones:`, {
                    venda_id: venda.id.substring(0, 8),
                    aluno: venda.aluno?.nome,
                    data_matricula_formulario: dataMatricula?.toLocaleDateString('pt-BR'),
                    data_enviado: venda.enviado_em,
                    data_usada: dataVenda.toISOString(),
                    data_usada_br: dataVenda.toLocaleDateString('pt-BR'),
                    pontos: venda.pontuacao_validada || venda.pontuacao_esperada || 0,
                    periodo_semana: `${formatDate(startSemana)} - ${formatDate(endSemana)}`,
                    numero_semana: numeroSemana,
                    isInRange
                  });
                }
                
                return isInRange;
              }).reduce((total, { venda }) => total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
              
              console.log(`📊 Semana ${numeroSemana} - Total de pontos: ${pontosDaSemana}`);

              // Buscar valor da variável semanal do nível do vendedor
              const vendedorInfo = vendedores.find(v => v.id === profile.id);
              const vendedorNivel = vendedorInfo?.nivel || 'junior';
              const nivelConfig = niveis.find(n => n.nivel === vendedorNivel && n.tipo_usuario === 'vendedor');
              const variavelSemanal = nivelConfig?.variavel_semanal || 0;

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
                  className={`grid grid-cols-9 gap-2 p-2 text-xs border rounded hover:bg-muted/30 transition-colors ${
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
                  
                  {/* Base (Variável Semanal) */}
                  <div className="font-medium text-muted-foreground text-[10px] flex items-center">
                    R$ {variavelSemanal.toLocaleString('pt-BR')}
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
                       progressoSemanal >= 100 ? 'text-green-600' : 
                       progressoSemanal >= 80 ? 'text-yellow-600' : 'text-muted-foreground'
                     }`}>
                       {progressoSemanal.toFixed(0)}%
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
              <div className="grid grid-cols-9 gap-2 p-2 text-xs font-medium bg-muted/70 rounded border-t-2 border-primary/20">
                <div>TOTAL</div>
                <div className="text-muted-foreground">-</div>
                <div className="text-muted-foreground">-</div>
                <div className="font-bold">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const metaSemanal = metasSemanais.find(meta => 
                      meta.vendedor_id === profile.id && 
                      meta.ano === anoParaExibir && 
                      meta.semana === numeroSemana
                    );
                    return total + (metaSemanal?.meta_vendas || 0);
                  }, 0)}
                </div>
                <div className="font-bold text-primary">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const startSemana = getDataInicioSemana(anoParaExibir, mesParaExibir, numeroSemana);
                    const endSemana = getDataFimSemana(anoParaExibir, mesParaExibir, numeroSemana);
                    
                    const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      
                      // NOVA LÓGICA: Usar data de matrícula das respostas do formulário
                      let dataVenda: Date;
                      const dataMatricula = getDataMatriculaFromRespostas(respostas);
                      
                      if (dataMatricula) {
                        dataVenda = dataMatricula;
                      } else {
                        // Fallback para data de envio se não houver data de matrícula
                        dataVenda = new Date(venda.enviado_em);
                      }
                      
                      return dataVenda >= startSemana && dataVenda <= endSemana;
                    }).reduce((sum, { venda }) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                    
                    return total + pontosDaSemana;
                  }, 0).toFixed(1)}
                </div>
                <div className="font-bold">
                  {(() => {
                    const totalMeta = semanasDoMes.reduce((total, numeroSemana) => {
                      const metaSemanal = metasSemanais.find(meta => 
                        meta.vendedor_id === profile.id && 
                        meta.ano === anoParaExibir && 
                        meta.semana === numeroSemana
                      );
                      return total + (metaSemanal?.meta_vendas || 0);
                    }, 0);
                    
                    const totalPontos = semanasDoMes.reduce((total, numeroSemana) => {
                      const startSemana = getDataInicioSemana(anoParaExibir, mesParaExibir, numeroSemana);
                      const endSemana = getDataFimSemana(anoParaExibir, mesParaExibir, numeroSemana);
                      
                      const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                        if (venda.vendedor_id !== profile.id) return false;
                        if (venda.status !== 'matriculado') return false;
                        
                        // NOVA LÓGICA: Usar data de matrícula das respostas do formulário
                        let dataVenda: Date;
                        const dataMatricula = getDataMatriculaFromRespostas(respostas);
                        
                        if (dataMatricula) {
                          dataVenda = dataMatricula;
                        } else {
                          // Fallback para data de envio se não houver data de matrícula
                          dataVenda = new Date(venda.enviado_em);
                        }
                        
                        return dataVenda >= startSemana && dataVenda <= endSemana;
                      }).reduce((sum, { venda }) => sum + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0);
                      
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