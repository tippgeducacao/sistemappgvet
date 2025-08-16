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
import { debugSemanasAgosto2025 } from '@/utils/semanasDebug';
import { getVendaPeriod } from '@/utils/semanaUtils';

interface VendedorMetasProps {
  selectedMonth: number;
  selectedYear: number;
}

const VendedorMetas: React.FC<VendedorMetasProps> = ({
  selectedMonth,
  selectedYear
}) => {
  console.log('🚨 VENDEDOR METAS - Props recebidas:', { selectedMonth, selectedYear });
  const { metasSemanais, getSemanaAtual, getMesAnoSemanaAtual, getSemanasDoMes, getDataInicioSemana, getDataFimSemana, syncMetasWithNivel, loading: metasSemanaisLoading } = useMetasSemanais();
  const { vendas, isLoading: vendasLoading } = useAllVendas();
  const { profile } = useAuthStore();
  const { niveis } = useNiveis();
  const { vendedores } = useVendedores();
  
  // Buscar respostas do formulário para usar data de matrícula
  const { vendasWithResponses, isLoading: isLoadingResponses } = useVendaWithFormResponses(vendas);
  
  // Estado para armazenar os cálculos de comissão de cada semana
  const [comissoesPorSemana, setComissoesPorSemana] = useState<{[key: string]: {valor: number, multiplicador: number, percentual: number}}>({});

  // Função para obter meta baseada no nível do vendedor
  const getMetaBaseadaNivel = (semana: number) => {
    console.log('🚨 DEBUG META - Iniciando função getMetaBaseadaNivel');
    console.log('🚨 DEBUG META - Profile completo:', profile);
    console.log('🚨 DEBUG META - Níveis disponíveis:', niveis);
    console.log('🚨 DEBUG META - Loading niveis:', metasSemanaisLoading);
    
    if (!profile?.nivel || !profile?.user_type) {
      console.log('⚠️ Profile ou nível não encontrado:', { nivel: profile?.nivel, user_type: profile?.user_type });
      return 0;
    }
    
    console.log('🔍 Buscando nível para:', { nivel: profile.nivel, user_type: profile.user_type });
    
    if (!niveis || niveis.length === 0) {
      console.log('⚠️ Array de níveis vazio ou não carregado');
      return 0;
    }
    
    const nivelConfig = niveis.find(n => {
      console.log('🔍 Comparando:', { 
        nivel_busca: profile.nivel, 
        nivel_encontrado: n.nivel,
        tipo_busca: profile.user_type,
        tipo_encontrado: n.tipo_usuario 
      });
      return n.nivel === profile.nivel && n.tipo_usuario === profile.user_type;
    });
    
    console.log('⚙️ Configuração encontrada:', nivelConfig);
    
    if (!nivelConfig) {
      console.warn('❌ Configuração de nível não encontrada');
      return 0;
    }
    
    const meta = profile.user_type === 'vendedor' ? 
      nivelConfig.meta_semanal_vendedor : 
      nivelConfig.meta_semanal_inbound || 0;
      
    console.log('🎯 Meta calculada:', meta);
    return meta;
  };

  // Sincronizar metas com o nível atual do vendedor
  useEffect(() => {
    const sincronizarMetas = async () => {
      if (!profile?.id || metasSemanaisLoading) return;
      
      try {
        console.log(`🔄 CARLOS DEBUG - Iniciando sincronização para vendedor:`, {
          id: profile.id,
          email: profile.email,
          nome: profile.name,
          periodo: `${selectedMonth}/${selectedYear}`
        });
        
        const metasAtualizadas = await syncMetasWithNivel(profile.id, selectedYear, selectedMonth);
        
        console.log(`✅ CARLOS DEBUG - Metas sincronizadas:`, metasAtualizadas);
        console.log(`✅ CARLOS DEBUG - Total de metas atualizadas: ${metasAtualizadas.length}`);
        
      } catch (error) {
        console.error('❌ CARLOS DEBUG - Erro ao sincronizar metas:', error);
      }
    };
    
    sincronizarMetas();
  }, [profile?.id, selectedMonth, selectedYear, metasSemanaisLoading]);

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
  
  // Debug específico para agosto 2025
  if (selectedMonth === 8 && selectedYear === 2025) {
    debugSemanasAgosto2025();
    
    // Debug das vendas do vendedor teste
    if (profile?.name?.includes('teste')) {
      const vendasMatriculadas = vendas.filter(v => 
        v.vendedor_id === profile.id && v.status === 'matriculado'
      );
      
      console.log(`🎯 VENDEDOR TESTE - Total de vendas matriculadas:`, vendasMatriculadas.length);
      vendasMatriculadas.forEach(v => {
        console.log(`  📝 Venda ${v.id.substring(0, 8)}: ${v.aluno?.nome} - ${v.pontuacao_validada || v.pontuacao_esperada} pts - Data assinatura: ${v.data_assinatura_contrato || 'N/A'} - Enviado: ${v.enviado_em}`);
      });
    }
  }
  
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

              // Calcular pontos da semana usando data de assinatura do contrato
              // CORREÇÃO: Verificar se a venda realmente pertence ao período selecionado
              const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                if (venda.vendedor_id !== profile.id) return false;
                if (venda.status !== 'matriculado') return false;
                
                // Usar data_assinatura_contrato se existir, senão usar data de matrícula das respostas
                let dataVenda: Date;
                
                if (venda.data_assinatura_contrato) {
                  dataVenda = new Date(venda.data_assinatura_contrato + 'T12:00:00');
                } else {
                  const dataMatricula = getDataMatriculaFromRespostas(respostas);
                  if (dataMatricula) {
                    dataVenda = dataMatricula;
                  } else {
                    dataVenda = new Date(venda.enviado_em);
                  }
                }
                
                // NOVA LÓGICA: Verificar se a venda pertence ao período correto usando a mesma regra das semanas
                const vendaPeriod = getVendaPeriod(dataVenda);
                const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                
                // Verificar se está na semana específica
                dataVenda.setHours(0, 0, 0, 0);
                const startSemanaUTC = new Date(startSemana);
                startSemanaUTC.setHours(0, 0, 0, 0);
                const endSemanaUTC = new Date(endSemana);
                endSemanaUTC.setHours(23, 59, 59, 999);
                const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                
                // Só incluir se AMBOS forem verdadeiros: está na semana E pertence ao período
                const incluirVenda = periodoCorreto && isInRange;
                
                // Debug para vendedor teste
                if (venda.status === 'matriculado' && profile?.name?.includes('teste')) {
                  console.log(`🔍 VENDEDOR TESTE - Análise venda:`, {
                    venda_id: venda.id.substring(0, 8),
                    aluno: venda.aluno?.nome,
                    data_assinatura_contrato: venda.data_assinatura_contrato,
                    data_usada: dataVenda.toLocaleDateString('pt-BR'),
                    pontos: venda.pontuacao_validada || venda.pontuacao_esperada || 0,
                    venda_period: vendaPeriod,
                    periodo_exibindo: `${mesParaExibir}/${anoParaExibir}`,
                    periodo_correto: periodoCorreto,
                    semana_periodo: `${formatDate(startSemana)} - ${formatDate(endSemana)}`,
                    numero_semana: numeroSemana,
                    isInRange,
                    incluir_venda: incluirVenda,
                    motivo: !incluirVenda ? (
                      !periodoCorreto ? 'Período incorreto' : 'Fora da semana'
                    ) : 'Incluído'
                  });
                }
                
                return incluirVenda;
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
                    <Badge variant="default" className="text-[10px] h-4 px-1">
                      {getMetaBaseadaNivel(numeroSemana)}
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
                    return total + getMetaBaseadaNivel(numeroSemana);
                  }, 0)}
                </div>
                <div className="font-bold text-primary">
                  {semanasDoMes.reduce((total, numeroSemana) => {
                    const startSemana = getDataInicioSemana(anoParaExibir, mesParaExibir, numeroSemana);
                    const endSemana = getDataFimSemana(anoParaExibir, mesParaExibir, numeroSemana);
                    
                    const pontosDaSemana = vendasWithResponses.filter(({ venda, respostas }) => {
                      if (venda.vendedor_id !== profile.id) return false;
                      if (venda.status !== 'matriculado') return false;
                      
                      // Usar data_assinatura_contrato se existir, senão usar data de matrícula das respostas
                      let dataVenda: Date;
                      
                      if (venda.data_assinatura_contrato) {
                        dataVenda = new Date(venda.data_assinatura_contrato + 'T12:00:00');
                      } else {
                        const dataMatricula = getDataMatriculaFromRespostas(respostas);
                        if (dataMatricula) {
                          dataVenda = dataMatricula;
                        } else {
                          dataVenda = new Date(venda.enviado_em);
                        }
                      }
                      
                      // CORREÇÃO: Aplicar a mesma lógica de validação de período
                      const vendaPeriod = getVendaPeriod(dataVenda);
                      const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                      
                      // Verificar se está na semana específica
                      dataVenda.setHours(0, 0, 0, 0);
                      const startSemanaUTC = new Date(startSemana);
                      startSemanaUTC.setHours(0, 0, 0, 0);
                      const endSemanaUTC = new Date(endSemana);
                      endSemanaUTC.setHours(23, 59, 59, 999);
                      const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                      
                      return periodoCorreto && isInRange;
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
                        
                        // Usar data_assinatura_contrato se existir, senão usar data de matrícula das respostas
                        let dataVenda: Date;
                        
                        if (venda.data_assinatura_contrato) {
                          dataVenda = new Date(venda.data_assinatura_contrato + 'T12:00:00');
                        } else {
                          const dataMatricula = getDataMatriculaFromRespostas(respostas);
                          if (dataMatricula) {
                            dataVenda = dataMatricula;
                          } else {
                            dataVenda = new Date(venda.enviado_em);
                          }
                        }
                        
                        // CORREÇÃO: Aplicar a mesma lógica de validação de período
                        const vendaPeriod = getVendaPeriod(dataVenda);
                        const periodoCorreto = vendaPeriod.mes === mesParaExibir && vendaPeriod.ano === anoParaExibir;
                        
                        // Verificar se está na semana específica
                        dataVenda.setHours(0, 0, 0, 0);
                        const startSemanaUTC = new Date(startSemana);
                        startSemanaUTC.setHours(0, 0, 0, 0);
                        const endSemanaUTC = new Date(endSemana);
                        endSemanaUTC.setHours(23, 59, 59, 999);
                        const isInRange = dataVenda >= startSemanaUTC && dataVenda <= endSemanaUTC;
                        
                        return periodoCorreto && isInRange;
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