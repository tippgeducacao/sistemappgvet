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
    
    const regraAplicavel = regras.find(regra => 
      percentual >= regra.percentual_minimo && 
      (percentual <= regra.percentual_maximo || regra.percentual_maximo === 999)
    );

    const multiplicador = regraAplicavel?.multiplicador || 0;
    const valor = variabelSemanal * multiplicador;

    return {
      valor,
      multiplicador,
      percentual: Math.round(percentual * 100) / 100
    };
  }
}