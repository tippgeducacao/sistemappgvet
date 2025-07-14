import { supabase } from '@/integrations/supabase/client';

export interface NivelVendedor {
  id: string;
  nivel: 'junior' | 'pleno' | 'senior';
  fixo_mensal: number;
  vale: number;
  variavel_semanal: number;
  meta_semanal_pontos: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export class NiveisService {
  static async fetchNiveis(): Promise<NivelVendedor[]> {
    console.log('🔍 Buscando níveis de vendedores...');
    
    const { data, error } = await supabase
      .from('niveis_vendedores')
      .select('*')
      .order('meta_semanal_pontos');

    if (error) {
      console.error('❌ Erro ao buscar níveis:', error);
      throw error;
    }
    
    console.log('✅ Níveis encontrados:', data?.length);
    return (data || []).map(item => ({
      ...item,
      nivel: item.nivel as 'junior' | 'pleno' | 'senior'
    }));
  }

  static async updateNivel(id: string, dados: Partial<Omit<NivelVendedor, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    console.log('📝 Atualizando nível:', id, dados);
    
    const { error } = await supabase
      .from('niveis_vendedores')
      .update(dados)
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao atualizar nível:', error);
      throw error;
    }
    
    console.log('✅ Nível atualizado com sucesso');
  }

  static async updateVendedorNivel(vendedorId: string, nivel: 'junior' | 'pleno' | 'senior'): Promise<void> {
    console.log('🔄 Atualizando nível do vendedor:', vendedorId, 'para', nivel);
    
    const { error } = await supabase
      .from('profiles')
      .update({ nivel })
      .eq('id', vendedorId);

    if (error) {
      console.error('❌ Erro ao atualizar nível do vendedor:', error);
      throw error;
    }
    
    console.log('✅ Nível do vendedor atualizado com sucesso');
  }

  static getNivelLabel(nivel: string): string {
    switch (nivel) {
      case 'junior':
        return 'Vendedor Júnior';
      case 'pleno':
        return 'Vendedor Pleno';
      case 'senior':
        return 'Vendedor Sênior';
      default:
        return 'Indefinido';
    }
  }

  static getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'junior':
        return 'bg-green-100 text-green-800';
      case 'pleno':
        return 'bg-blue-100 text-blue-800';
      case 'senior':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}