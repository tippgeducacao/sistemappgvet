import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';
import { supabase } from '@/integrations/supabase/client';
import SDRMetasMonthGroup from './SDRMetasMonthGroup';

interface SDRMetasHistoryProps {
  userId: string;
}

const SDRMetasHistory: React.FC<SDRMetasHistoryProps> = ({ userId }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [agendamentosData, setAgendamentosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { profile } = useAuthStore();
  const { getSemanasDoMes: getSemanasSDR, getDataInicioSemana: getDataInicioSDR, getDataFimSemana: getDataFimSDR } = useMetasSemanaisSDR();
  const { niveis } = useNiveis();

  // Buscar todos os agendamentos do SDR
  useEffect(() => {
    if (profile?.id) {
      fetchAgendamentosSDR();
    }
  }, [profile?.id]);

  const fetchAgendamentosSDR = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Buscando agendamentos para SDR:', profile.id);
      
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
      setAgendamentosData(agendamentos || []);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      setAgendamentosData([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter agendamentos de uma semana específica
  const getAgendamentosSemana = (ano: number, mes: number, semana: number) => {
    const dataInicio = getDataInicioSDR(ano, mes, semana);
    const dataFim = getDataFimSDR(ano, mes, semana);
    
    const agendamentosRealizados = agendamentosData.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      
      const foiRealizado = agendamento.status === 'finalizado' && (
        agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
        agendamento.resultado_reuniao === 'comprou' ||
        agendamento.resultado_reuniao === 'presente' ||
        agendamento.resultado_reuniao === 'compareceu' ||
        agendamento.resultado_reuniao === 'realizada'
      );
      
      return dataAgendamento >= dataInicio && dataAgendamento <= dataFim && foiRealizado;
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

  // Função para calcular semanas consecutivas
  const calcularSemanasConsecutivas = (ano: number, mes: number, semana: number): number => {
    const nivel = profile?.nivel || 'junior';
    const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
    const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;
    
    let consecutivas = 0;
    let anoAtual = ano;
    let mesAtual = mes;
    let semanaAtual = semana;
    
    // Verificar semanas anteriores até encontrar uma que não bateu a meta
    for (let i = 0; i < 20; i++) {
      const { realizados } = getAgendamentosSemana(anoAtual, mesAtual, semanaAtual);
      
      if (realizados >= metaAgendamentos) {
        consecutivas++;
      } else {
        break;
      }
      
      // Ir para semana anterior
      semanaAtual--;
      if (semanaAtual <= 0) {
        mesAtual--;
        if (mesAtual <= 0) {
          anoAtual--;
          mesAtual = 12;
        }
        const semanasDoMesAnterior = getSemanasSDR(anoAtual, mesAtual);
        semanaAtual = Math.max(...semanasDoMesAnterior);
      }
    }
    
    return consecutivas;
  };

  // Gerar dados organizados por mês
  const generateMonthsData = () => {
    const hoje = new Date();
    const mesesData: { [key: string]: any[] } = {};

    if (selectedMonth) {
      // Mostrar apenas o mês selecionado
      const mesKey = `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;
      const semanasDoMes = getSemanasSDR(selectedYear, selectedMonth);
      
      mesesData[mesKey] = semanasDoMes
        .map(numeroSemana => {
          const dataInicio = getDataInicioSDR(selectedYear, selectedMonth, numeroSemana);
          const dataFim = getDataFimSDR(selectedYear, selectedMonth, numeroSemana);
          
          // Apenas semanas que já passaram ou são a atual
          if (dataFim <= hoje || (dataInicio <= hoje && dataFim >= hoje)) {
            const agendamentosInfo = getAgendamentosSemana(selectedYear, selectedMonth, numeroSemana);
            const percentual = agendamentosInfo.meta > 0 ? Math.round((agendamentosInfo.realizados / agendamentosInfo.meta) * 100) : 0;
            const metaAtingida = agendamentosInfo.realizados >= agendamentosInfo.meta;
            const semanasConsecutivas = metaAtingida ? calcularSemanasConsecutivas(selectedYear, selectedMonth, numeroSemana) : 0;
            const isCurrentWeek = dataInicio <= hoje && dataFim >= hoje;
            
            // Buscar variável semanal do nível
            const nivel = profile?.nivel || 'junior';
            const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
            const variabelSemanal = nivelConfig?.variavel_semanal || 0;
            
            const periodo = `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}/${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
            
            return {
              numero: numeroSemana,
              periodo,
              metaAgendamentos: agendamentosInfo.meta,
              agendamentosRealizados: agendamentosInfo.realizados,
              percentual,
              variabelSemanal,
              metaAtingida,
              semanasConsecutivas,
              isCurrentWeek
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => b.numero - a.numero); // Mais recente primeiro
    } else {
      // Mostrar últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const anoRef = dataReferencia.getFullYear();
        const mesRef = dataReferencia.getMonth() + 1;
        
        if (anoRef === selectedYear) {
          const mesKey = `${mesRef.toString().padStart(2, '0')}/${anoRef}`;
          const semanasDoMes = getSemanasSDR(anoRef, mesRef);
          
          mesesData[mesKey] = semanasDoMes
            .map(numeroSemana => {
              const dataInicio = getDataInicioSDR(anoRef, mesRef, numeroSemana);
              const dataFim = getDataFimSDR(anoRef, mesRef, numeroSemana);
              
              // Apenas semanas que já passaram ou são a atual
              if (dataFim <= hoje || (dataInicio <= hoje && dataFim >= hoje)) {
                const agendamentosInfo = getAgendamentosSemana(anoRef, mesRef, numeroSemana);
                const percentual = agendamentosInfo.meta > 0 ? Math.round((agendamentosInfo.realizados / agendamentosInfo.meta) * 100) : 0;
                const metaAtingida = agendamentosInfo.realizados >= agendamentosInfo.meta;
                const semanasConsecutivas = metaAtingida ? calcularSemanasConsecutivas(anoRef, mesRef, numeroSemana) : 0;
                const isCurrentWeek = dataInicio <= hoje && dataFim >= hoje;
                
                // Buscar variável semanal do nível
                const nivel = profile?.nivel || 'junior';
                const nivelConfig = niveis.find(n => n.nivel === nivel && n.tipo_usuario === 'sdr');
                const variabelSemanal = nivelConfig?.variavel_semanal || 0;
                
                const periodo = `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}/${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
                
                return {
                  numero: numeroSemana,
                  periodo,
                  metaAgendamentos: agendamentosInfo.meta,
                  agendamentosRealizados: agendamentosInfo.realizados,
                  percentual,
                  variabelSemanal,
                  metaAtingida,
                  semanasConsecutivas,
                  isCurrentWeek
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => b.numero - a.numero); // Mais recente primeiro
        }
      }
    }

    return mesesData;
  };

  const mesesData = generateMonthsData();
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando histórico de metas...</p>
      </div>
    );
  }

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

      {/* Histórico por Mês */}
      <div className="space-y-6">
        {Object.keys(mesesData).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {selectedMonth 
                  ? `Nenhuma semana histórica encontrada para ${months.find(m => m.value === selectedMonth)?.label} de ${selectedYear}`
                  : `Nenhuma semana histórica encontrada para ${selectedYear}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(mesesData)
            .sort((a, b) => b[0].localeCompare(a[0])) // Ordenar por mês/ano (mais recente primeiro)
            .map(([mesAno, semanas]) => (
              <SDRMetasMonthGroup
                key={mesAno}
                mesAno={months.find(m => m.value === parseInt(mesAno.split('/')[0]))?.label + ' de ' + mesAno.split('/')[1]}
                semanas={semanas}
              />
            ))
        )}
      </div>

      {/* Informações explicativas */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Como funciona o histórico:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Período:</strong> Sistema respeita a regra das terças-feiras - a semana vai de quarta a terça</li>
            <li>• <strong>Histórico:</strong> Mostra apenas semanas que já passaram ou a semana atual</li>
            <li>• <strong>Agendamentos:</strong> Contabiliza apenas reuniões com presença confirmada</li>
            <li>• <strong>Comissão:</strong> Variável semanal recebida quando a meta é atingida (100% ou mais)</li>
            <li>• <strong>Semanas consecutivas:</strong> Contador de streak quando atinge metas consecutivas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SDRMetasHistory;