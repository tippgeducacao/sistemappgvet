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
import SDRMetasHistory from './sdr/SDRMetasHistory';

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
  const { data: metasHistoricas } = useMetasHistoricas(selectedYear, selectedMonth);
  const { data: niveisHistoricos } = useNiveisHistoricos(selectedYear, selectedMonth);
  const { vendas } = useAllVendas();

  // Determinar se é SDR
  const isSDR = userType?.includes('sdr') || false;

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
      {/* Filtros - só para não-SDR */}
      {!isSDR && (
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
      )}

      {/* Performance Semanal Detalhada */}
      {isSDR ? (
        // Renderizar componente específico para SDRs (sem card wrapper para evitar duplicação)
        <SDRMetasHistory userId={userId} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Semanal Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userMetasSemanais.length === 0 ? (
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
      )}
    </div>
  );
};

export default MetasHistoryTab;