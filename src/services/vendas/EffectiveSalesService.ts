import { supabase } from '@/integrations/supabase/client';
import { getDataEfetivaVenda } from '@/utils/vendaDateUtils';

export interface EffectiveSale {
  id: string;
  vendedor_id: string;
  aluno_id: string;
  curso_id: string;
  status: string;
  data_efetiva: Date;
  pontuacao_validada: number;
  created_at: string;
  enviado_em: string;
  data_assinatura_contrato?: string;
}

export class EffectiveSalesService {
  /**
   * Busca vendas matriculadas por período usando a data efetiva (assinatura de contrato)
   */
  static async getMatriculasByEffectiveDate(
    vendedorIds: string | string[],
    startDate: Date,
    endDate: Date
  ): Promise<EffectiveSale[]> {
    const vendedorIdArray = Array.isArray(vendedorIds) ? vendedorIds : [vendedorIds];
    
    if (vendedorIdArray.length === 0) return [];

    // Buscar vendas matriculadas dos vendedores
    const { data: vendas, error } = await supabase
      .from('form_entries')
      .select(`
        id,
        vendedor_id,
        aluno_id,
        curso_id,
        status,
        pontuacao_validada,
        created_at,
        enviado_em,
        data_assinatura_contrato
      `)
      .in('vendedor_id', vendedorIdArray)
      .eq('status', 'matriculado');

    if (error) {
      console.error('❌ Erro ao buscar vendas:', error);
      throw error;
    }

    if (!vendas || vendas.length === 0) return [];

    // Filtrar vendas por data efetiva sem buscar form_responses (usar apenas o que está disponível)
    const effectiveSales: EffectiveSale[] = [];
    
    for (const venda of vendas) {
      const dataEfetiva = getDataEfetivaVenda(venda, []); // Usar array vazio por enquanto
      
      // Verificar se a data efetiva está no período
      if (dataEfetiva >= startDate && dataEfetiva <= endDate) {
        effectiveSales.push({
          ...venda,
          data_efetiva: dataEfetiva
        });
      }
    }

    console.log(`📊 EffectiveSalesService: ${effectiveSales.length} vendas encontradas no período`, {
      periodo: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
      vendedores: vendedorIdArray.length,
      vendas_total: vendas.length,
      vendas_filtradas: effectiveSales.length
    });

    return effectiveSales;
  }

  /**
   * Conta vendas matriculadas por vendedor no período usando data efetiva
   */
  static async countMatriculasByVendedor(
    vendedorIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, number>> {
    const effectiveSales = await this.getMatriculasByEffectiveDate(vendedorIds, startDate, endDate);
    
    const countMap = new Map<string, number>();
    
    // Inicializar contador para todos os vendedores
    vendedorIds.forEach(id => countMap.set(id, 0));
    
    // Contar vendas efetivas por vendedor
    effectiveSales.forEach(sale => {
      const currentCount = countMap.get(sale.vendedor_id) || 0;
      countMap.set(sale.vendedor_id, currentCount + 1);
    });

    return countMap;
  }
}