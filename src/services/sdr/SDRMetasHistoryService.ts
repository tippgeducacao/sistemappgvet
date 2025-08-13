import { supabase } from '@/integrations/supabase/client';

export interface WeeklyData {
  numero: number;
  periodo: string;
  metaAgendamentos: number;
  agendamentosRealizados: number;
  percentual: number;
  variabelSemanal: number;
  metaAtingida: boolean;
  semanasConsecutivas: number;
  isCurrentWeek: boolean;
  isFutureWeek: boolean;
}

export interface MonthlyData {
  [monthYear: string]: WeeklyData[];
}

export class SDRMetasHistoryService {
  private static instance: SDRMetasHistoryService;
  
  static getInstance(): SDRMetasHistoryService {
    if (!this.instance) {
      this.instance = new SDRMetasHistoryService();
    }
    return this.instance;
  }

  async fetchAgendamentosForSDR(sdrId: string): Promise<any[]> {
    try {
      console.log('🔄 SDRMetasHistoryService: Buscando agendamentos para SDR:', sdrId);
      
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('sdr_id', sdrId)
        .order('data_agendamento', { ascending: false });

      if (error) {
        console.error('❌ SDRMetasHistoryService: Erro ao buscar agendamentos:', error);
        throw error;
      }

      console.log('📊 SDRMetasHistoryService: Total de agendamentos encontrados:', agendamentos?.length || 0);
      return agendamentos || [];
    } catch (error) {
      console.error('❌ SDRMetasHistoryService: Erro ao buscar agendamentos:', error);
      return [];
    }
  }

  calculateWeeklyData(
    agendamentosData: any[],
    ano: number,
    mes: number,
    numeroSemana: number,
    getDataInicio: (ano: number, mes: number, semana: number) => Date,
    getDataFim: (ano: number, mes: number, semana: number) => Date,
    niveis: any[],
    userLevel: string
  ): WeeklyData {
    const dataInicio = getDataInicio(ano, mes, numeroSemana);
    const dataFim = getDataFim(ano, mes, numeroSemana);
    const chaveUnica = `${ano}-${mes.toString().padStart(2, '0')}-S${numeroSemana}`;
    
    console.log(`🔍 [${chaveUnica}] SDRMetasHistoryService: Calculando dados da semana`);
    console.log(`📅 [${chaveUnica}] Período: ${dataInicio.toLocaleDateString()} - ${dataFim.toLocaleDateString()}`);
    
    // Filtrar agendamentos apenas para esta semana específica
    const agendamentosDestaSemanaNova = agendamentosData.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.data_agendamento);
      const estaDentroDoPerido = dataAgendamento >= dataInicio && dataAgendamento <= dataFim;
      
      if (estaDentroDoPerido) {
        console.log(`✅ [${chaveUnica}] Agendamento encontrado:`, {
          id: agendamento.id,
          data: dataAgendamento.toLocaleDateString(),
          status: agendamento.status,
          resultado: agendamento.resultado_reuniao
        });
      }
      
      return estaDentroDoPerido;
    });
    
    // Filtrar apenas os realizados
    const agendamentosRealizados = agendamentosDestaSemanaNova.filter(agendamento => {
      return agendamento.status === 'finalizado' && (
        agendamento.resultado_reuniao === 'compareceu_nao_comprou' || 
        agendamento.resultado_reuniao === 'comprou' ||
        agendamento.resultado_reuniao === 'presente' ||
        agendamento.resultado_reuniao === 'compareceu' ||
        agendamento.resultado_reuniao === 'realizada'
      );
    });
    
    console.log(`📊 [${chaveUnica}] SDRMetasHistoryService: ${agendamentosDestaSemanaNova.length} total, ${agendamentosRealizados.length} realizados`);
    
    // Buscar configuração do nível
    const nivelConfig = niveis.find(n => n.nivel === userLevel && n.tipo_usuario === 'sdr');
    const metaAgendamentos = nivelConfig?.meta_semanal_inbound || 0;
    const variabelSemanal = nivelConfig?.variavel_semanal || 0;
    
    const percentual = metaAgendamentos > 0 ? Math.round((agendamentosRealizados.length / metaAgendamentos) * 100) : 0;
    const metaAtingida = agendamentosRealizados.length >= metaAgendamentos;
    
    const hoje = new Date();
    const isCurrentWeek = dataInicio <= hoje && dataFim >= hoje;
    const isFutureWeek = dataInicio > hoje;
    
    const periodo = `${dataInicio.getDate().toString().padStart(2, '0')}/${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}/${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
    
    return {
      numero: numeroSemana,
      periodo,
      metaAgendamentos,
      agendamentosRealizados: agendamentosRealizados.length,
      percentual,
      variabelSemanal,
      metaAtingida: isFutureWeek ? false : metaAtingida,
      semanasConsecutivas: 0, // Será calculado depois se necessário
      isCurrentWeek,
      isFutureWeek
    };
  }

  generateMonthlyData(
    agendamentosData: any[],
    selectedYear: number,
    getSemanasDoMes: (ano: number, mes: number) => number[],
    getDataInicio: (ano: number, mes: number, semana: number) => Date,
    getDataFim: (ano: number, mes: number, semana: number) => Date,
    niveis: any[],
    userLevel: string
  ): MonthlyData {
    const mesesData: MonthlyData = {};

    console.log('🗓️ SDRMetasHistoryService: Gerando dados para ano:', selectedYear);

    // Gerar dados para todos os 12 meses do ano selecionado
    for (let mes = 1; mes <= 12; mes++) {
      const mesKey = `${mes.toString().padStart(2, '0')}/${selectedYear}`;
      const semanasDoMes = getSemanasDoMes(selectedYear, mes);
      
      console.log(`📅 SDRMetasHistoryService: Processando ${mesKey}, semanas:`, semanasDoMes);

      if (semanasDoMes.length > 0) {
        mesesData[mesKey] = semanasDoMes
          .map(numeroSemana => {
            return this.calculateWeeklyData(
              agendamentosData,
              selectedYear,
              mes,
              numeroSemana,
              getDataInicio,
              getDataFim,
              niveis,
              userLevel
            );
          })
          .sort((a, b) => b.numero - a.numero); // Mais recente primeiro
      } else {
        mesesData[mesKey] = [];
      }
      
      console.log(`✅ SDRMetasHistoryService: Dados criados para ${mesKey}:`, mesesData[mesKey].length, 'semanas');
    }

    console.log('🎯 SDRMetasHistoryService: Todos os dados gerados:', Object.keys(mesesData));
    return mesesData;
  }

  filterDataByMonth(
    monthlyData: MonthlyData,
    selectedYear: number,
    selectedMonth: number | 'all'
  ): MonthlyData {
    console.log('🔍 SDRMetasHistoryService: Filtrando dados - Ano:', selectedYear, 'Mês:', selectedMonth);
    
    if (selectedMonth !== 'all' && typeof selectedMonth === 'number') {
      return Object.entries(monthlyData)
        .filter(([mesAno]) => {
          const [mes, ano] = mesAno.split('/');
          const mesInt = parseInt(mes);
          const anoInt = parseInt(ano);
          const match = mesInt === selectedMonth && anoInt === selectedYear;
          console.log(`🔍 SDRMetasHistoryService: Verificando ${mesAno}: match=${match}`);
          return match;
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as MonthlyData);
    } else {
      return Object.entries(monthlyData)
        .filter(([mesAno]) => {
          const [mes, ano] = mesAno.split('/');
          const anoInt = parseInt(ano);
          const match = anoInt === selectedYear;
          console.log(`🔍 SDRMetasHistoryService: Verificando ${mesAno}: match=${match}`);
          return match;
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as MonthlyData);
    }
  }
}