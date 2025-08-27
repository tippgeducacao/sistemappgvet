import { supabase } from '@/integrations/supabase/client';

export interface RegraComissionamento {
  id: string;
  tipo_usuario: string;
  percentual_minimo: number;
  percentual_maximo: number;
  multiplicador: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export class ComissionamentoService {
  static async fetchRegras(tipoUsuario = 'vendedor'): Promise<RegraComissionamento[]> {
    const { data, error } = await supabase
      .from('regras_comissionamento')
      .select('*')
      .eq('tipo_usuario', tipoUsuario)
      .order('percentual_minimo', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar regras de comissionamento:', error);
      throw error;
    }

    return data || [];
  }

  static async updateRegra(
    id: string, 
    dados: Partial<Omit<RegraComissionamento, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('regras_comissionamento')
      .update(dados)
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao atualizar regra de comissionamento:', error);
      throw error;
    }
  }

  static async calcularComissao(
    pontosObtidos: number, 
    metaSemanal: number, 
    variabelSemanal: number,
    tipoUsuario = 'vendedor'
  ): Promise<{ valor: number; multiplicador: number; percentual: number }> {
    const percentualBruto = (pontosObtidos / metaSemanal) * 100;
    const percentual = Math.round(percentualBruto); // ARREDONDAR antes da comparação
    const regras = await this.fetchRegras(tipoUsuario);
    
    console.log('🔢 DEBUG COMISSIONAMENTO:', {
      pontosObtidos,
      metaSemanal, 
      percentualBruto,
      percentualArredondado: percentual,
      regras: regras.map(r => `${r.percentual_minimo}-${r.percentual_maximo}: ${r.multiplicador}x`)
    });
    
    // LÓGICA CORRIGIDA: encontrar a regra mais específica aplicável
    let regraAplicavel = null;
    
    // Ordenar regras por percentual_minimo DESC para pegar a mais específica primeiro
    const regrasOrdenadas = [...regras].sort((a, b) => b.percentual_minimo - a.percentual_minimo);
    
    for (const regra of regrasOrdenadas) {
      // Para percentuais >= 999 (ou seja, muito altos) - deve ser verificado primeiro
      if (regra.percentual_maximo >= 999 && percentual >= regra.percentual_minimo) {
        regraAplicavel = regra;
        break;
      }
      // Para outros percentuais, usar >= minimo e <= maximo
      else if (percentual >= regra.percentual_minimo && percentual <= regra.percentual_maximo) {
        regraAplicavel = regra;
        break;
      }
    }

    console.log('✅ REGRA SELECIONADA:', {
      percentual,
      regra: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}: ${regraAplicavel.multiplicador}x` : 'NENHUMA'
    });

    const multiplicador = regraAplicavel?.multiplicador || 0;
    const valor = variabelSemanal * multiplicador;

    return {
      valor,
      multiplicador,
      percentual: Math.round(percentualBruto * 100) / 100 // Retornar percentual original para display
    };
  }
}