import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';
import { useMetasSemanaisSDR } from '@/hooks/useMetasSemanaisSDR';
import { useNiveis } from '@/hooks/useNiveis';
import { useAuthStore } from '@/stores/AuthStore';
import { SDRMetasHistoryService } from '@/services/sdr/SDRMetasHistoryService';
import SDRMetasMonthGroup from './SDRMetasMonthGroup';

interface SDRMetasHistoryProps {
  userId: string;
}

const SDRMetasHistory: React.FC<SDRMetasHistoryProps> = ({ userId }) => {
  const [agendamentosData, setAgendamentosData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth() + 1);

  const { profile } = useAuthStore();
  const { getSemanasDoMes: getSemanasSDR, getDataInicioSemana: getDataInicioSDR, getDataFimSemana: getDataFimSDR } = useMetasSemanaisSDR();
  const { niveis } = useNiveis();
  const metasHistoryService = SDRMetasHistoryService.getInstance();

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
      const agendamentos = await metasHistoryService.fetchAgendamentosForSDR(profile.id);
      setAgendamentosData(agendamentos);
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      setAgendamentosData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gerar dados usando o service
  const generateMonthsData = () => {
    if (!profile?.nivel) return {};
    
    return metasHistoryService.generateMonthlyData(
      agendamentosData,
      selectedYear,
      getSemanasSDR,
      getDataInicioSDR,
      getDataFimSDR,
      niveis,
      profile.nivel
    );
  };

  // Gerar dados com cache específico por combinação de filtros
  const mesesData = useMemo(() => {
    const cacheKey = `${selectedYear}-${selectedMonth}-${agendamentosData.length}`;
    console.log(`🔄 SDRMetasHistory: REGENERANDO DADOS COMPLETOS - Cache Key: ${cacheKey}`);
    
    const resultado = generateMonthsData();
    console.log(`✅ SDRMetasHistory: Dados gerados para cache ${cacheKey}:`, Object.keys(resultado));
    return resultado;
  }, [agendamentosData, selectedYear, selectedMonth, profile?.nivel, niveis]);
  
  console.log('📊 Meses disponíveis final:', Object.keys(mesesData));
  
  // Filtrar dados baseado na seleção usando o service
  const filteredMesesData = useMemo(() => {
    return metasHistoryService.filterDataByMonth(mesesData, selectedYear, selectedMonth);
  }, [mesesData, selectedYear, selectedMonth]);

  console.log('📊 Dados filtrados:', Object.keys(filteredMesesData));

  // Gerar anos disponíveis
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  
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
      {/* Performance Semanal Detalhada com Filtros Integrados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Semanal Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês (opcional)</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : parseInt(value))}>
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

          {/* Dados das Semanas */}
          <div className="space-y-6">
            {Object.keys(filteredMesesData).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhuma semana histórica encontrada para o período selecionado
                </p>
              </div>
            ) : (
              Object.entries(filteredMesesData)
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
        </CardContent>
      </Card>

      {/* Informações explicativas */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Como funciona o histórico:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Período:</strong> Sistema respeita a regra das terças-feiras - a semana vai de quarta a terça</li>
            <li>• <strong>Histórico:</strong> Mostra semanas passadas, atual e futuras automaticamente</li>
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