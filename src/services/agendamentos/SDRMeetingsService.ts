import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço unificado para buscar reuniões de SDRs
 * Garante que todos os componentes usem EXATAMENTE o mesmo filtro
 */
export class SDRMeetingsService {
  /**
   * Busca reuniões de SDRs por período usando o filtro padrão
   * MESMO filtro usado na planilha detalhada de SDR
   */
  static async fetchSDRMeetingsByPeriod(
    sdrIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, any[]>> {
    if (sdrIds.length === 0) {
      return new Map();
    }

    // Normalizar datas EXATAMENTE como na planilha detalhada
    const startDateFormatted = new Date(startDate);
    startDateFormatted.setHours(0, 0, 0, 0);
    
    const endDateFormatted = new Date(endDate);
    endDateFormatted.setHours(23, 59, 59, 999);

    const startISO = startDateFormatted.toISOString();
    const endISO = endDateFormatted.toISOString();

    console.log('🔎 SDR MEETINGS SERVICE - Buscando reuniões:', {
      sdrCount: sdrIds.length,
      periodo: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startISO,
      endISO,
      filtro: "resultado_reuniao IN ['comprou', 'compareceu_nao_comprou']"
    });

    // Query IDÊNTICA à planilha detalhada de SDR
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('sdr_id, id, data_agendamento, resultado_reuniao, status')
      .in('sdr_id', sdrIds)
      .gte('data_agendamento', startISO)
      .lte('data_agendamento', endISO)  // INCLUSIVO (lte), não exclusivo (lt)
      .in('resultado_reuniao', ['comprou', 'compareceu_nao_comprou']);  // SEM filtro de status

    if (error) {
      console.error('❌ SDR MEETINGS SERVICE - Erro ao buscar reuniões:', error);
      return new Map();
    }

    console.log('📊 SDR MEETINGS SERVICE - Reuniões encontradas:', {
      total: agendamentos?.length || 0,
      resultados: Array.from(new Set((agendamentos || []).map(a => a.resultado_reuniao))),
      status: Array.from(new Set((agendamentos || []).map(a => a.status)))
    });

    // Agrupar por sdr_id
    const agendamentosPorSDR = new Map<string, any[]>();
    agendamentos?.forEach(agendamento => {
      const sdrId = agendamento.sdr_id;
      if (!agendamentosPorSDR.has(sdrId)) {
        agendamentosPorSDR.set(sdrId, []);
      }
      agendamentosPorSDR.get(sdrId)!.push(agendamento);
    });

    // Log por SDR para debug
    agendamentosPorSDR.forEach((reunioes, sdrId) => {
      console.log(`📈 SDR ${sdrId}: ${reunioes.length} reuniões encontradas`);
    });

    return agendamentosPorSDR;
  }

  /**
   * Busca reuniões de um único SDR por período
   */
  static async fetchSingleSDRMeetingsByPeriod(
    sdrId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const result = await this.fetchSDRMeetingsByPeriod([sdrId], startDate, endDate);
    return result.get(sdrId) || [];
  }
}