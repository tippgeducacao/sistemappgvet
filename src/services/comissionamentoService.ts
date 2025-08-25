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
    const percentual = (pontosObtidos / metaSemanal) * 100;
    const regras = await this.fetchRegras(tipoUsuario);
    
    // Log específico para debug do problema
    if (pontosObtidos === 7.0 && Math.round(percentual) === 100) {
      console.log('🎯 CASO ESPECÍFICO 7.0 pontos:', {
        pontosObtidos,
        metaSemanal,
        percentual,
        regras: regras.map(r => `${r.percentual_minimo}-${r.percentual_maximo}: ${r.multiplicador}x`)
      });
    }
    
    const regraAplicavel = regras.find(regra => 
      percentual >= regra.percentual_minimo && 
      percentual <= regra.percentual_maximo
    );

    if (pontosObtidos === 7.0 && Math.round(percentual) === 100) {
      console.log('🎯 REGRA PARA 7.0 pontos:', {
        percentual,
        regra: regraAplicavel ? `${regraAplicavel.percentual_minimo}-${regraAplicavel.percentual_maximo}: ${regraAplicavel.multiplicador}x` : 'NENHUMA'
      });
    }

    const multiplicador = regraAplicavel?.multiplicador || 0;
    const valor = variabelSemanal * multiplicador;

    return {
      valor,
      multiplicador,
      percentual: Math.round(percentual * 100) / 100
    };
  }
}