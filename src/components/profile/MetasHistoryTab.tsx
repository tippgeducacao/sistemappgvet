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
  }, [isSDR, profile?.id, selectedYear, selectedMonth]);

  const fetchAgendamentosSDR = async () => {
    if (!profile?.id) return;

    try {
      // Buscar todos os agendamentos do SDR para o ano/mês selecionado
      let query = supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', profile.id)
        .gte('data_agendamento', `${selectedYear}-01-01`)
        .lt('data_agendamento', `${selectedYear + 1}-01-01`);

      if (selectedMonth) {
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        query = query
          .gte('data_agendamento', startOfMonth.toISOString())
          .lte('data_agendamento', endOfMonth.toISOString());
      }

      const { data: agendamentos, error } = await query;

      if (error) throw error;

      setAgendamentosData(agendamentos || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
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
    
    const agendamentosRealizados = agendamentosData.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const compareceu = agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
                         agendamento.resultado_reuniao === 'comprou';
      
      return dataAgendamento >= dataInicio && dataAgendamento <= dataFim && compareceu;
    });

    // Buscar meta baseada no nível do SDR
    const nivel = profile?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;

    return {
      realizados: agendamentosRealizados.length,
      meta: metaAgendamentos
    };
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

  // Função para renderizar tabela de metas SDR
  function renderSDRMetasTable() {
    // Gerar semanas para o período selecionado
    const semanas: Array<{semana: number, ano: number, mes: number}> = [];
    
    if (selectedMonth) {
      // Mostrar apenas semanas do mês selecionado
      const semanasDoMes = getSemanasSDR(selectedYear, selectedMonth);
      semanasDoMes.forEach(semana => {
        semanas.push({ semana, ano: selectedYear, mes: selectedMonth });
      });
    } else {
      // Mostrar todas as semanas do ano
      for (let mes = 1; mes <= 12; mes++) {
        const semanasDoMes = getSemanasSDR(selectedYear, mes);
        semanasDoMes.forEach(semana => {
          semanas.push({ semana, ano: selectedYear, mes });
        });
      }
    }

    // Ordenar semanas
    semanas.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      if (a.mes !== b.mes) return b.mes - a.mes;
      return b.semana - a.semana;
    });

    if (semanas.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma meta semanal encontrada para este usuário.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium text-muted-foreground">Semana</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Período</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Meta Agendamentos</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Agendamentos Realizados</th>
              <th className="text-left p-3 font-medium text-muted-foreground">% da Meta</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {semanas.slice(0, 20).map(({ semana, ano, mes }) => {
              const agendamentosInfo = getAgendamentosSemana(ano, semana);
              const statusInfo = getStatusMetaAgendamentos(agendamentosInfo.realizados, agendamentosInfo.meta);
              const StatusIcon = statusInfo.icon;
              
              // Formatar período
              const dataInicio = getDataInicioSDR(ano, mes, semana);
              const dataFim = getDataFimSDR(ano, mes, semana);
              const periodo = `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}/${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
              
              // Verificar se é semana atual
              const now = new Date();
              const isCurrentWeek = now >= dataInicio && now <= dataFim;

              return (
                <tr key={`${ano}-${semana}`} className={`border-b hover:bg-muted/50 ${isCurrentWeek ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{semana}</span>
                      {isCurrentWeek && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {periodo}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      {agendamentosInfo.meta}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">{agendamentosInfo.realizados}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${statusInfo.percentual >= 100 ? 'text-green-600' : statusInfo.percentual >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {statusInfo.percentual}%
                      </span>
                      <div className="w-16">
                        <Progress 
                          value={Math.min(statusInfo.percentual, 100)} 
                          className="h-1"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
};

export default MetasHistoryTab;