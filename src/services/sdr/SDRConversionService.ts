import { supabase } from '@/integrations/supabase/client';

export interface SDRConversionData {
  sdrId: string;
  totalReunioes: number;
  reunioesComComparecimento: number;
  reunioesComVenda: number;
  taxaComparecimento: number; // percentual de reuniões onde cliente compareceu
  taxaConversao: number; // percentual de reuniões que resultaram em venda
}

export class SDRConversionService {
  /**
   * Calcula taxa de conversão de um SDR para um período específico
   */
  static async calcularTaxaConversaoSDR(
    sdrId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SDRConversionData> {
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('sdr_id', sdrId)
      .gte('data_agendamento', startDate.toISOString())
      .lte('data_agendamento', endDate.toISOString());

    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error);
      throw error;
    }

    const totalReunioes = agendamentos?.length || 0;
    
    // Reuniões onde o cliente compareceu (independente se comprou ou não)
    const reunioesComComparecimento = agendamentos?.filter(ag => 
      ag.resultado_reuniao === 'presente' || 
      ag.resultado_reuniao === 'compareceu' ||
      ag.resultado_reuniao === 'compareceu_nao_comprou' ||
      ag.resultado_reuniao === 'comprou'
    ).length || 0;

    // Reuniões que resultaram em venda
    const reunioesComVenda = agendamentos?.filter(ag => 
      ag.resultado_reuniao === 'comprou'
    ).length || 0;

    const taxaComparecimento = totalReunioes > 0 ? (reunioesComComparecimento / totalReunioes) * 100 : 0;
    const taxaConversao = reunioesComComparecimento > 0 ? (reunioesComVenda / reunioesComComparecimento) * 100 : 0;

    return {
      sdrId,
      totalReunioes,
      reunioesComComparecimento,
      reunioesComVenda,
      taxaComparecimento,
      taxaConversao
    };
  }

  /**
   * Calcula taxa de conversão para todos os SDRs de uma semana
   */
  static async calcularTaxasConversaoSemana(
    startDate: Date,
    endDate: Date
  ): Promise<SDRConversionData[]> {
    // Buscar todos os SDRs ativos
    const { data: sdrs, error: sdrsError } = await supabase
      .from('profiles')
      .select('id')
      .in('user_type', ['sdr_inbound', 'sdr_outbound'])
      .eq('ativo', true);

    if (sdrsError) {
      console.error('❌ Erro ao buscar SDRs:', sdrsError);
      throw sdrsError;
    }

    const results: SDRConversionData[] = [];

    for (const sdr of sdrs || []) {
      try {
        const conversionData = await this.calcularTaxaConversaoSDR(sdr.id, startDate, endDate);
        results.push(conversionData);
      } catch (error) {
        console.error(`❌ Erro ao calcular conversão do SDR ${sdr.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Obtém status da taxa de conversão com cor (verde/vermelho)
   */
  static getConversionStatus(taxaConversao: number) {
    // Meta padrão: 30% de conversão (reuniões com comparecimento que resultaram em venda)
    const metaConversao = 30;
    
    return {
      isGood: taxaConversao >= metaConversao,
      color: taxaConversao >= metaConversao ? 'bg-green-500' : 'bg-red-500',
      textColor: taxaConversao >= metaConversao ? 'text-green-600' : 'text-red-600',
      label: `${taxaConversao.toFixed(1)}%`,
      meta: metaConversao
    };
  }

  /**
   * Obtém status da taxa de comparecimento com cor
   */
  static getAttendanceStatus(taxaComparecimento: number) {
    // Meta padrão: 70% de comparecimento
    const metaComparecimento = 70;
    
    return {
      isGood: taxaComparecimento >= metaComparecimento,
      color: taxaComparecimento >= metaComparecimento ? 'bg-green-500' : 'bg-red-500',
      textColor: taxaComparecimento >= metaComparecimento ? 'text-green-600' : 'text-red-600',
      label: `${taxaComparecimento.toFixed(1)}%`,
      meta: metaComparecimento
    };
  }
}