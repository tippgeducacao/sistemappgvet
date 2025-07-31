import { supabase } from '@/integrations/supabase/client';

export interface VendedorConversionData {
  vendedorId: string;
  totalReunioes: number;
  reunioesRealizadas: number;
  matriculas: number;
  taxaConversao: number; // percentual de reuniões realizadas que resultaram em matrícula
}

export class VendedorConversionService {
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

    // Buscar matrículas do vendedor no período
    const { data: vendas, error: vendasError } = await supabase
      .from('form_entries')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .eq('status', 'matriculado')
      .gte('data_aprovacao', startDate.toISOString())
      .lte('data_aprovacao', endDate.toISOString());

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