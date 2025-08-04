import { supabase } from '@/integrations/supabase/client';

export interface NivelVendedor {
  id: string;
  nivel: 'junior' | 'pleno' | 'senior' | 'sdr_inbound_junior' | 'sdr_inbound_pleno' | 'sdr_inbound_senior' | 'sdr_outbound_junior' | 'sdr_outbound_pleno' | 'sdr_outbound_senior';
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
      nivel: item.nivel as 'junior' | 'pleno' | 'senior' | 'sdr_inbound_junior' | 'sdr_inbound_pleno' | 'sdr_inbound_senior' | 'sdr_outbound_junior' | 'sdr_outbound_pleno' | 'sdr_outbound_senior',
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

  static async updateVendedorNivel(vendedorId: string, nivel: 'junior' | 'pleno' | 'senior' | 'sdr_inbound_junior' | 'sdr_inbound_pleno' | 'sdr_inbound_senior' | 'sdr_outbound_junior' | 'sdr_outbound_pleno' | 'sdr_outbound_senior'): Promise<void> {
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
      case 'sdr_inbound_junior':
        return 'SDR Inbound Júnior';
      case 'sdr_inbound_pleno':
        return 'SDR Inbound Pleno';
      case 'sdr_inbound_senior':
        return 'SDR Inbound Sênior';
      case 'sdr_outbound_junior':
        return 'SDR Outbound Júnior';
      case 'sdr_outbound_pleno':
        return 'SDR Outbound Pleno';
      case 'sdr_outbound_senior':
        return 'SDR Outbound Sênior';
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
      case 'sdr_inbound_junior':
        return 'bg-emerald-100 text-emerald-800';
      case 'sdr_inbound_pleno':
        return 'bg-teal-100 text-teal-800';
      case 'sdr_inbound_senior':
        return 'bg-cyan-100 text-cyan-800';
      case 'sdr_outbound_junior':
        return 'bg-amber-100 text-amber-800';
      case 'sdr_outbound_pleno':
        return 'bg-orange-100 text-orange-800';
      case 'sdr_outbound_senior':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}