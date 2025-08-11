import { supabase } from '@/integrations/supabase/client';

export interface NivelVendedor {
  id: string;
  nivel: 'junior' | 'pleno' | 'senior';
  tipo_usuario: 'vendedor' | 'sdr';
  fixo_mensal: number;
  vale: number;
  variavel_semanal: number;
  meta_semanal_vendedor: number;
  meta_semanal_inbound: number;
  meta_semanal_outbound: number;
  meta_vendas_cursos: number;
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
      .order('tipo_usuario', { ascending: true })
      .order('meta_semanal_vendedor', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar níveis:', error);
      throw error;
    }
    
    console.log('✅ Níveis encontrados:', data?.length);
    return (data || []).map(item => ({
      ...item,
      nivel: item.nivel as 'junior' | 'pleno' | 'senior',
      tipo_usuario: item.tipo_usuario as 'vendedor' | 'sdr'
    }));
  }

  static async updateNivel(id: string, dados: Partial<Omit<NivelVendedor, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    console.log('📝 Atualizando nível:', id, dados);
    
    const { data, error } = await supabase
      .from('niveis_vendedores')
      .update(dados)
      .eq('id', id)
      .select();

    if (error) {
      console.error('❌ Erro ao atualizar nível:', error);
      throw error;
    }
    
    console.log('✅ Nível atualizado com sucesso:', data);
  }

  static async updateVendedorNivel(vendedorId: string, nivel: 'junior' | 'pleno' | 'senior'): Promise<void> {
    console.log('🔄 Atualizando nível do vendedor:', vendedorId, 'para', nivel);
    
    // Manter o user_type existente, apenas atualizar o nível
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', vendedorId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      throw profileError;
    }
    
    const user_type = profileData.user_type;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        nivel,
        user_type 
      })
      .eq('id', vendedorId);

    if (error) {
      console.error('❌ Erro ao atualizar nível do vendedor:', error);
      throw error;
    }
    
    console.log('✅ Nível e tipo do vendedor atualizado com sucesso');
  }

  static getNivelLabel(nivel: string, tipoUsuario?: string): string {
    // Se for SDR, mostrar apenas "Junior", "Pleno" ou "Senior"
    if (tipoUsuario === 'sdr') {
      switch (nivel) {
        case 'junior':
          return 'Junior';
        case 'pleno':
          return 'Pleno';
        case 'senior':
          return 'Senior';
        default:
          return 'Junior'; // Default para SDR
      }
    }
    
    // Para vendedores, usar o padrão
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