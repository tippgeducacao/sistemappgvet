import { supabase } from '@/integrations/supabase/client';

export interface VendedorConversionData {
  vendedorId: string;
  totalReunioes: number;
  reunioesRealizadas: number;
  matriculas: number;
  taxaConversao: number; // percentual de reuniões realizadas que resultaram em matrícula
}

export interface VendedorWeeklyConversionData {
  vendedorId: string;
  semana: number;
  ano: number;
  totalReunioes: number;
  reunioesComComparecimento: number;
  reunioesComVenda: number;
  taxaComparecimento: number;
  taxaConversao: number;
}

export class VendedorConversionService {
  /**
   * Calcula taxa de conversão semanal de um vendedor (quarta a terça)
   */
  static async calcularTaxaConversaoVendedorSemanal(vendedorId: string, ano: number, semana: number): Promise<VendedorWeeklyConversionData> {
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

    // Buscar agendamentos do vendedor na semana especificada
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select(`
        id,
        vendedor_id,
        data_agendamento,
        resultado_reuniao,
        status
      `)
      .eq('vendedor_id', vendedorId)
      .gte('data_agendamento', dataInicioSemana.toISOString())
      .lte('data_agendamento', dataFimSemana.toISOString());

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      throw agendamentosError;
    }

    const totalReunioes = agendamentos?.length || 0;
    
    // Contar reuniões com comparecimento (que o vendedor atendeu)
    const reunioesComComparecimento = agendamentos?.filter(ag => 
      ag.resultado_reuniao && ['presente', 'compareceu', 'realizada'].includes(ag.resultado_reuniao.toLowerCase())
    ).length || 0;

    // Buscar vendas matriculadas do vendedor na mesma semana
    const { data: vendas, error: vendasError } = await supabase
      .from('form_entries')
      .select('id, status, vendedor_id, created_at')
      .eq('vendedor_id', vendedorId)
      .gte('created_at', dataInicioSemana.toISOString())
      .lte('created_at', dataFimSemana.toISOString())
      .eq('status', 'matriculado');

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas:', vendasError);
      throw vendasError;
    }

    const reunioesComVenda = vendas?.length || 0;

    const taxaComparecimento = totalReunioes > 0 ? (reunioesComComparecimento / totalReunioes) * 100 : 0;
    const taxaConversao = reunioesComComparecimento > 0 ? (reunioesComVenda / reunioesComComparecimento) * 100 : 0;

    return {
      vendedorId,
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
   * Calcula taxa de conversão de um vendedor para um período específico
   * Taxa = (Matrículas / Reuniões Realizadas) * 100
   */
  static async calcularTaxaConversaoVendedor(
    vendedorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VendedorConversionData> {
    // Buscar reuniões do vendedor no período
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .gte('data_agendamento', startDate.toISOString())
      .lte('data_agendamento', endDate.toISOString());

    if (agendamentosError) {
      console.error('❌ Erro ao buscar agendamentos:', agendamentosError);
      throw agendamentosError;
    }

    const totalReunioes = agendamentos?.length || 0;
    
    // Reuniões realizadas (onde houve comparecimento/presença)
    const reunioesRealizadas = agendamentos?.filter(ag => 
      ag.resultado_reuniao === 'presente' || 
      ag.resultado_reuniao === 'compareceu' ||
      ag.resultado_reuniao === 'compareceu_nao_comprou' ||
      ag.resultado_reuniao === 'comprou' ||
      ag.status === 'finalizado'
    ).length || 0;

    // Buscar matrículas do vendedor no período (vendas matriculadas)
    const { data: vendas, error: vendasError } = await supabase
      .from('form_entries')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'matriculado')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (vendasError) {
      console.error('❌ Erro ao buscar vendas:', vendasError);
      throw vendasError;
    }

    const matriculas = vendas?.length || 0;

    // Calcular taxa de conversão: (Matrículas / Reuniões Realizadas) * 100
    const taxaConversao = reunioesRealizadas > 0 ? (matriculas / reunioesRealizadas) * 100 : 0;

    console.log(`📊 Taxa conversão ${vendedorId}:`, {
      periodo: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      totalReunioes,
      reunioesRealizadas,
      matriculas,
      taxaConversao: `${taxaConversao.toFixed(1)}%`
    });

    return {
      vendedorId,
      totalReunioes,
      reunioesRealizadas,
      matriculas,
      taxaConversao
    };
  }

  /**
   * Calcula taxa de conversão para todos os vendedores de uma semana
   */
  static async calcularTaxasConversaoSemana(
    vendedorIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<VendedorConversionData[]> {
    const results: VendedorConversionData[] = [];

    for (const vendedorId of vendedorIds) {
      try {
        const conversionData = await this.calcularTaxaConversaoVendedor(vendedorId, startDate, endDate);
        results.push(conversionData);
      } catch (error) {
        console.error(`❌ Erro ao calcular conversão do vendedor ${vendedorId}:`, error);
        // Adicionar resultado vazio em caso de erro
        results.push({
          vendedorId,
          totalReunioes: 0,
          reunioesRealizadas: 0,
          matriculas: 0,
          taxaConversao: 0
        });
      }
    }

    return results;
  }

  /**
   * Obtém status da taxa de conversão com cor (verde/vermelho)
   */
  static getConversionStatus(taxaConversao: number) {
    // Meta: 30% de conversão (reuniões realizadas que resultaram em matrícula)
    const metaConversao = 30;
    
    return {
      isGood: taxaConversao >= metaConversao,
      color: taxaConversao >= metaConversao ? 'bg-green-500' : 'bg-red-500',
      textColor: taxaConversao >= metaConversao ? 'text-green-600' : 'text-red-600',
      label: `${taxaConversao.toFixed(1)}%`,
      meta: metaConversao
    };
  }
}