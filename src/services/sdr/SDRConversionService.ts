import { supabase } from '@/integrations/supabase/client';

export interface SDRConversionData {
  sdrId: string;
  totalReunioes: number;
  reunioesComComparecimento: number;
  reunioesComVenda: number;
  taxaComparecimento: number; // percentual de reuniões onde cliente compareceu
  taxaConversao: number; // percentual de reuniões que resultaram em venda
}

export interface SDRWeeklyConversionData {
  sdrId: string;
  semana: number;
  ano: number;
  totalReunioes: number;
  reunioesComComparecimento: number;
  reunioesComVenda: number;
  taxaComparecimento: number;
  taxaConversao: number;
}

export class SDRConversionService {
  /**
   * Calcula taxa de conversão semanal de um SDR (quarta a terça) - NOVA LÓGICA
   */
  static async calcularTaxaConversaoSDRSemanal(sdrId: string, ano: number, semana: number): Promise<SDRWeeklyConversionData> {
    // Calcular datas da semana (quarta a terça)
    const startOfYear = new Date(ano, 0, 1);
    let dataInicioSemana = new Date(startOfYear.getTime() + (semana - 1) * 7 * 24 * 60 * 60 * 1000);
    
    // Ajustar para começar na quarta-feira
    while (dataInicioSemana.getDay() !== 3) { // 3 = quarta-feira
      dataInicioSemana.setDate(dataInicioSemana.getDate() + 1);
    }
    
    const dataFimSemana = new Date(dataInicioSemana);
    dataFimSemana.setDate(dataFimSemana.getDate() + 6); // terça-feira
    dataFimSemana.setHours(23, 59, 59, 999);

    // Buscar agendamentos do SDR na semana especificada
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select(`
        id,
        sdr_id,
        vendedor_id,
        data_agendamento,
        resultado_reuniao,
        status
      `)
      .eq('sdr_id', sdrId)
      .gte('data_agendamento', dataInicioSemana.toISOString())
      .lte('data_agendamento', dataFimSemana.toISOString());

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      throw agendamentosError;
    }

    const totalReunioes = agendamentos?.length || 0;
    
    // NOVA LÓGICA: Contar reuniões com comparecimento (incluindo "comprou")
    const reunioesComComparecimento = agendamentos?.filter(ag => 
      ag.resultado_reuniao && [
        'presente', 'compareceu', 'realizada', 'comprou', 
        'compareceu_nao_comprou', 'nao_comprou'
      ].includes(ag.resultado_reuniao.toLowerCase())
    ).length || 0;

    // NOVA LÓGICA: Buscar vendas aprovadas com assinatura na semana (independente da data da reunião)
    const { data: vendasAprovadas, error: vendasError } = await supabase
      .from('form_entries')
      .select(`
        id, 
        sdr_id, 
        status, 
        data_assinatura_contrato, 
        data_aprovacao,
        enviado_em
      `)
      .eq('sdr_id', sdrId)
      .eq('status', 'matriculado');

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas aprovadas:', vendasError);
      throw vendasError;
    }

    // Contar vendas com assinatura na semana atual
    let reunioesComVenda = 0;
    vendasAprovadas?.forEach(venda => {
      // Usar data de assinatura ou data de aprovação como fallback
      const dataEfetiva = venda.data_assinatura_contrato 
        ? new Date(venda.data_assinatura_contrato) 
        : venda.data_aprovacao 
          ? new Date(venda.data_aprovacao)
          : new Date(venda.enviado_em);
      
      if (dataEfetiva >= dataInicioSemana && dataEfetiva <= dataFimSemana) {
        reunioesComVenda++;
      }
    });

    const taxaComparecimento = totalReunioes > 0 ? (reunioesComComparecimento / totalReunioes) * 100 : 0;
    const taxaConversao = (reunioesComComparecimento + reunioesComVenda) > 0 
      ? (reunioesComVenda / (reunioesComComparecimento + reunioesComVenda)) * 100 
      : 0;

    return {
      sdrId,
      semana,
      ano,
      totalReunioes,
      reunioesComComparecimento,
      reunioesComVenda,
      taxaComparecimento,
      taxaConversao
    };
  }

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
      .eq('user_type', 'sdr')
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