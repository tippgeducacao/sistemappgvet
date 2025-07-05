
import { supabase } from '@/integrations/supabase/client';

export interface ScoringRule {
  id: string;
  campo_nome: string;
  opcao_valor: string;
  pontos: number;
  created_at: string;
  criado_por?: string;
}

export interface NewScoringRule {
  campo_nome: string;
  opcao_valor: string;
  pontos: number;
}

export class ScoringService {
  static async fetchScoringRules(): Promise<ScoringRule[]> {
    const { data, error } = await supabase
      .from('regras_pontuacao')
      .select('*')
      .order('campo_nome', { ascending: true })
      .order('opcao_valor', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar regras de pontuação:', error);
      throw error;
    }
    
    console.log('Regras de pontuação carregadas:', data);
    return data as ScoringRule[];
  }

  static async updateScoringRule(id: string, pontos: number): Promise<void> {
    const { error } = await supabase
      .from('regras_pontuacao')
      .update({ pontos })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async addScoringRule(rule: NewScoringRule): Promise<void> {
    const { error } = await supabase
      .from('regras_pontuacao')
      .insert([{
        campo_nome: rule.campo_nome,
        opcao_valor: rule.opcao_valor,
        pontos: rule.pontos
      }]);
    
    if (error) throw error;
  }

  static async deleteScoringRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('regras_pontuacao')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static getPointsForOption(rules: ScoringRule[], fieldName: string, optionValue: string): number {
    const rule = rules.find(r => r.campo_nome === fieldName && r.opcao_valor === optionValue);
    console.log(`Buscando regra para: ${fieldName} = ${optionValue}, encontrada:`, rule);
    return rule?.pontos || 0;
  }
}
