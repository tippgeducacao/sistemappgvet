import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Calendar, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Minus } from 'lucide-react';
import { useMetasSemanais } from '@/hooks/useMetasSemanais';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useMetas } from '@/hooks/useMetas';
import { useMetasHistoricas, useNiveisHistoricos } from '@/hooks/useHistoricoMensal';
import { useAllVendas } from '@/hooks/useVendas';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface MetasHistoryTabProps {
  userId: string;
  userType: string;
}

const MetasHistoryTab: React.FC<MetasHistoryTabProps> = ({ userId, userType }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  
  const { profile } = useAuthStore();
  const { metas: metasMensais } = useMetas();
  const { metasSemanais, getDataInicioSemana, getDataFimSemana, getSemanasDoMes } = useMetasSemanais();
  const { getMetaSemanalSDR, getSemanasDoMes: getSemanasSDR, getDataInicioSemana: getDataInicioSDR, getDataFimSemana: getDataFimSDR } = useMetasSemanaisSDR();
  const { data: metasHistoricas } = useMetasHistoricas(selectedYear, selectedMonth);
  const { data: niveisHistoricos } = useNiveisHistoricos(selectedYear, selectedMonth);
  const { vendas } = useAllVendas();
  const { niveis } = useNiveis();

  // Determinar se é SDR
  const isSDR = userType?.includes('sdr') || false;

  // State para dados de agendamentos SDR
  const [agendamentosData, setAgendamentosData] = useState<any[]>([]);

  // Buscar agendamentos para SDRs
  useEffect(() => {
    if (isSDR && profile?.id) {
      fetchAgendamentosSDR();
    }
  }, [isSDR, profile?.id]); // Removido selectedYear e selectedMonth para buscar todos os dados

  const fetchAgendamentosSDR = async () => {
    if (!profile?.id) return;

    try {
      console.log('🔄 Buscando agendamentos para SDR:', profile.id);
      
      // Buscar TODOS os agendamentos do SDR (não filtrar por ano/mês aqui)
      // Vamos filtrar depois para ter mais flexibilidade
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        throw error;
      }

      console.log('📊 Total de agendamentos encontrados:', agendamentos?.length || 0);
      console.log('🔍 Primeiros agendamentos:', agendamentos?.slice(0, 3));
      
      setAgendamentosData(agendamentos || []);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      setAgendamentosData([]);
    }
  };

  // Função para obter agendamentos de uma semana específica
  const getAgendamentosSemana = (ano: number, semana: number) => {
    if (!isSDR) return { realizados: 0, meta: 0 };

    // Encontrar qual mês contém esta semana
    let mesEncontrado = 1;
    for (let mes = 1; mes <= 12; mes++) {
      const semanasDoMes = getSemanasSDR(ano, mes);
      if (semanasDoMes.includes(semana)) {
        mesEncontrado = mes;
        break;
      }
    }

    const dataInicio = getDataInicioSDR(ano, mesEncontrado, semana);
    const dataFim = getDataFimSDR(ano, mesEncontrado, semana);
    
    console.log(`🔍 Buscando agendamentos para semana ${semana}/${ano} (${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()})`);
    
    const agendamentosRealizados = agendamentosData.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      
      // Critérios mais amplos para contar agendamentos realizados
      const foiRealizado = agendamento.status === 'finalizado' && (
        agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
        agendamento.resultado_reuniao === 'comprou' ||
        agendamento.resultado_reuniao === 'presente' ||
        agendamento.resultado_reuniao === 'compareceu' ||
        agendamento.resultado_reuniao === 'realizada'
      );
      
      const estaNaSemana = dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
      
      if (estaNaSemana) {
        console.log(`📅 Agendamento encontrado:`, {
          data: dataAgendamento.toLocaleDateString(),
          status: agendamento.status,
          resultado: agendamento.resultado_reuniao,
          foiRealizado
        });
      }
      
      return estaNaSemana && foiRealizado;
    });

    // Buscar meta baseada no nível do SDR
    const nivel = profile?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;

    console.log(`📊 Semana ${semana}/${ano}: ${agendamentosRealizados.length} agendamentos realizados, Meta: ${metaAgendamentos}`);

    return {
      realizados: agendamentosRealizados.length,
      meta: metaAgendamentos
    };
  };

  // Função para calcular semanas consecutivas
  const calcularSemanasConsecutivas = (ano: number, semana: number): number => {
    if (!isSDR) return 0;
    
    // Buscar meta do nível
    const nivel = profile?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;
    
    let consecutivas = 0;
    let anoAtual = ano;
    let semanaAtual = semana;
    
    // Verificar semanas anteriores até encontrar uma que não bateu a meta
    for (let i = 0; i < 20; i++) {
      const { realizados } = getAgendamentosSemana(anoAtual, semanaAtual);
      
      if (realizados >= metaAgendamentos) {
        consecutivas++;
      } else {
        break;
      }
      
      // Ir para semana anterior
      semanaAtual--;
      if (semanaAtual <= 0) {
        anoAtual--;
        semanaAtual = 52;
      }
    }
    
    return consecutivas;
  };

  // Função para calcular comissão baseada na regra de comissionamento
  const calcularComissao = async (realizados: number, meta: number): Promise<{valor: number, multiplicador: number}> => {
    if (!isSDR || meta === 0) return {valor: 0, multiplicador: 0};
    
    const percentual = (realizados / meta) * 100;
    const nivel = profile?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const variabelSemanal = nivelConfig?.variavel_semanal || 0;
    
    try {
      // Buscar regras de comissionamento para SDR
      const { data: regras, error } = await supabase
        .from('regras_comissionamento')
        .select('*')
        .eq('tipo_usuario', 'sdr')
        .order('percentual_minimo', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar regras de comissionamento:', error);
        return {valor: 0, multiplicador: 0};
      }
      
      // Encontrar regra aplicável baseada no percentual de atingimento
      const regraAplicavel = regras?.find(regra => 
        percentual >= regra.percentual_minimo && 
        (percentual <= regra.percentual_maximo || regra.percentual_maximo === 999)
      );
      
      const multiplicador = regraAplicavel?.multiplicador || 0;
      const valor = variabelSemanal * multiplicador;
      
      return {valor, multiplicador};
    } catch (error) {
      console.error('Erro ao calcular comissão:', error);
      return {valor: 0, multiplicador: 0};
    }
  };

  // Filtrar vendas aprovadas do usuário
  const userVendas = vendas.filter(venda => 
    venda.vendedor_id === userId && 
    venda.status === 'matriculado' &&
    venda.data_aprovacao
  );

  // Filtrar metas do usuário
  const userMetasMensais = metasMensais.filter(meta => meta.vendedor_id === userId);
  const userMetasSemanais = metasSemanais.filter(meta => meta.vendedor_id === userId);

  // Função para calcular vendas de uma semana específica
  const getVendasSemana = (ano: number, semana: number) => {
    // Encontrar qual mês contém esta semana
    let mesEncontrado = 1;
    for (let mes = 1; mes <= 12; mes++) {
      const semanasDoMes = getSemanasDoMes(ano, mes);
      if (semanasDoMes.includes(semana)) {
        mesEncontrado = mes;
        break;
      }
    }

    const dataInicio = getDataInicioSemana(ano, mesEncontrado, semana);
    const dataFim = getDataFimSemana(ano, mesEncontrado, semana);
    
    return userVendas.filter(venda => {
      const dataAprovacao = new Date(venda.data_aprovacao!);
      return dataAprovacao >= dataInicio && dataAprovacao <= dataFim;
    });
  };

  // Função para obter status da meta
  const getStatusMeta = (pontuacao: number, meta: number) => {
    const percentual = (pontuacao / meta) * 100;
    
    if (percentual >= 100) {
      return { 
        status: 'Bateu a meta', 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        percentual: Math.round(percentual)
      };
    } else if (percentual >= 80) {
      return { 
        status: 'Quase lá', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle,
        percentual: Math.round(percentual)
      };
    } else {
      return { 
        status: 'Abaixo da meta', 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        percentual: Math.round(percentual)
      };
    }
  };

  // Função para obter status da meta de agendamentos
  const getStatusMetaAgendamentos = (realizados: number, meta: number) => {
    const percentual = meta > 0 ? (realizados / meta) * 100 : 0;
    
    if (percentual >= 100) {
      return { 
        status: 'Meta Batida', 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        percentual: Math.round(percentual)
      };
    } else if (percentual >= 80) {
      return { 
        status: 'Quase lá', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle,
        percentual: Math.round(percentual)
      };
    } else {
      return { 
        status: 'Abaixo da meta', 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        percentual: Math.round(percentual)
      };
    }
  };

  // Função para renderizar tabela de metas SDR
  function renderSDRMetasTable() {
    const hoje = new Date();
    const semanas: Array<{semana: number, ano: number, mes: number, dataInicio: Date, dataFim: Date}> = [];
    
    if (selectedMonth) {
      // Mostrar apenas semanas do mês selecionado
      const semanasDoMes = getSemanasSDR(selectedYear, selectedMonth);
      semanasDoMes.forEach(numeroSemana => {
        const dataInicio = getDataInicioSDR(selectedYear, selectedMonth, numeroSemana);
        const dataFim = getDataFimSDR(selectedYear, selectedMonth, numeroSemana);
        
        // Adicionar apenas semanas que já passaram ou são a atual
        if (dataFim <= hoje || (dataInicio <= hoje && dataFim >= hoje)) {
          semanas.push({ 
            semana: numeroSemana, 
            ano: selectedYear, 
            mes: selectedMonth,
            dataInicio,
            dataFim
          });
        }
      });
    } else {
      // Gerar semanas históricas (últimos 6 meses)
      const mesesAtras = 6;
      for (let i = 0; i < mesesAtras; i++) {
        const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const anoRef = dataReferencia.getFullYear();
        const mesRef = dataReferencia.getMonth() + 1;
        
        if (anoRef === selectedYear || selectedYear === hoje.getFullYear()) {
          const semanasDoMes = getSemanasSDR(anoRef, mesRef);
          semanasDoMes.forEach(numeroSemana => {
            const dataInicio = getDataInicioSDR(anoRef, mesRef, numeroSemana);
            const dataFim = getDataFimSDR(anoRef, mesRef, numeroSemana);
            
            // Adicionar apenas semanas que já passaram ou são a atual
            if (dataFim <= hoje || (dataInicio <= hoje && dataFim >= hoje)) {
              semanas.push({ 
                semana: numeroSemana, 
                ano: anoRef, 
                mes: mesRef,
                dataInicio,
                dataFim
              });
            }
          });
        }
      }
    }

    // Ordenar semanas (mais recente primeiro)
    semanas.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      if (a.mes !== b.mes) return b.mes - a.mes;
      return b.semana - a.semana;
    });

    if (semanas.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {selectedMonth 
            ? `Nenhuma semana histórica encontrada para ${months.find(m => m.value === selectedMonth)?.label} de ${selectedYear}`
            : `Nenhuma semana histórica encontrada para ${selectedYear}`
          }
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium border-r border-border">Período da semana</th>
              <th className="text-left p-3 font-medium border-r border-border">Atingimento e meta</th>
              <th className="text-left p-3 font-medium border-r border-border">Comissão</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {semanas.slice(0, 20).map(({ semana, ano, mes, dataInicio, dataFim }, index) => {
              const agendamentosInfo = getAgendamentosSemana(ano, semana);
              const percentual = agendamentosInfo.meta > 0 ? Math.round((agendamentosInfo.realizados / agendamentosInfo.meta) * 100 * 100) / 100 : 0;
              const metaAtingida = agendamentosInfo.realizados >= agendamentosInfo.meta;
              const semanasConsecutivas = metaAtingida ? calcularSemanasConsecutivas(ano, semana) : 0;
              
              // Buscar variável semanal do nível
              const nivel = profile?.nivel || 'junior';
              const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
              const variabelSemanal = nivelConfig?.variavel_semanal || 0;
              
              // Formatar período conforme a regra das terças-feiras
              const periodo = `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}/${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
              
              // Verificar se é semana atual
              const now = new Date();
              const isCurrentWeek = now >= dataInicio && now <= dataFim;

              return (
                <tr key={`${ano}-${semana}`} className={`border-b hover:bg-muted/20 ${isCurrentWeek ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                  <td className="p-3 border-r border-border">
                    <div className="flex flex-col">
                      <span className="font-medium">{periodo}</span>
                      {isCurrentWeek && <Badge variant="secondary" className="text-xs mt-1 w-fit">Semana Atual</Badge>}
                    </div>
                  </td>
                  <td className="p-3 border-r border-border">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium">
                        {agendamentosInfo.realizados}/{agendamentosInfo.meta}
                      </span>
                      <span className={`text-sm font-bold ${percentual >= 100 ? 'text-green-600' : percentual >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {percentual}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-border">
                    <span className="font-medium">
                      {variabelSemanal}×({metaAtingida ? '1' : '0'}) = {metaAtingida ? variabelSemanal : 0}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={metaAtingida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {metaAtingida ? 'Meta atingida' : 'Meta não atingida'}
                      </Badge>
                      {semanasConsecutivas > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          {semanasConsecutivas} STREAK
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Informações explicativas */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">Como funciona o histórico:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Período:</strong> Sistema respeita a regra das terças-feiras - a semana vai de quarta a terça</li>
            <li>• <strong>Histórico:</strong> Mostra apenas semanas que já passaram ou a semana atual</li>
            <li>• <strong>Atingimento:</strong> Quantidade de agendamentos comparecidos / meta semanal definida</li>
            <li>• <strong>Comissão:</strong> Variável semanal × (regra de comissionamento) = valor</li>
            <li>• <strong>Semanas consecutivas:</strong> Contabiliza quando atinge meta; reseta quando não atinge após uma sequência</li>
          </ul>
        </div>
      </div>
    );
  }

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Mês (opcional)</label>
              <Select value={selectedMonth?.toString() || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? undefined : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Semanal Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Semanal Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSDR ? (
            // Renderizar tabela de metas de agendamentos para SDRs
            renderSDRMetasTable()
          ) : userMetasSemanais.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma meta semanal encontrada para este usuário.
            </div>
          ) : (
            <div className="space-y-4">
              {userMetasSemanais
                .filter(meta => {
                  if (selectedMonth) {
                    // Verificar se a semana está no mês selecionado
                    const semanasDoMes = getSemanasDoMes(selectedYear, selectedMonth);
                    return meta.ano === selectedYear && semanasDoMes.includes(meta.semana);
                  }
                  return meta.ano === selectedYear;
                })
                .sort((a, b) => {
                  if (a.ano !== b.ano) return b.ano - a.ano;
                  return b.semana - a.semana;
                })
                .slice(0, 50) // Limitar para performance
                .map((meta) => {
                  const vendasSemana = getVendasSemana(meta.ano, meta.semana);
                  const pontuacao = vendasSemana.reduce((total, venda) => 
                    total + (venda.pontuacao_validada || venda.pontuacao_esperada || 0), 0
                  );
                  const statusInfo = getStatusMeta(pontuacao, meta.meta_vendas);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={meta.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">
                              Semana {meta.semana} - {meta.ano}
                            </h4>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-blue-600 font-medium">Meta</p>
                              <p className="text-xl font-bold text-blue-800">{meta.meta_vendas}</p>
                              <p className="text-xs text-blue-600">vendas</p>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-green-600 font-medium">Pontuação</p>
                              <p className="text-xl font-bold text-green-800">{pontuacao.toFixed(1)}</p>
                              <p className="text-xs text-green-600">pontos</p>
                            </div>
                            
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-sm text-purple-600 font-medium">Vendas</p>
                              <p className="text-xl font-bold text-purple-800">{vendasSemana.length}</p>
                              <p className="text-xs text-purple-600">aprovadas</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Progresso da Meta</span>
                              <span className="text-sm font-medium">{statusInfo.percentual}%</span>
                            </div>
                            <Progress 
                              value={Math.min(statusInfo.percentual, 100)} 
                              className="h-2"
                            />
                          </div>

                          {/* Lista de Vendas da Semana */}
                          {vendasSemana.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">Vendas da Semana:</h5>
                              <div className="space-y-1">
                                {vendasSemana.slice(0, 5).map((venda, index) => (
                                  <div key={venda.id} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                                    <span>Venda #{index + 1}</span>
                                    <span className="font-medium">{(venda.pontuacao_validada || venda.pontuacao_esperada || 0).toFixed(1)} pts</span>
                                  </div>
                                ))}
                                {vendasSemana.length > 5 && (
                                  <div className="text-xs text-muted-foreground text-center py-1">
                                    +{vendasSemana.length - 5} vendas adicionais
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Meta criada em: {new Date(meta.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetasHistoryTab;