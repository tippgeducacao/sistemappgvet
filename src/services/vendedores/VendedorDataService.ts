
import { supabase } from '@/integrations/supabase/client';
import type { Vendedor } from '../vendedoresService';

export class VendedorDataService {
  static async fetchVendedores(): Promise<Vendedor[]> {
    console.log('🔍 Buscando vendedores ativos...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'vendedor')
      .eq('ativo', true)
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      throw error;
    }
    
    console.log('✅ Vendedores encontrados:', data?.length);
    console.log('📸 Vendedores com fotos:', data?.filter(v => v.photo_url).length);
    
    return (data || []).map(item => ({
      ...item,
      nivel: item.nivel as 'junior' | 'pleno' | 'senior'
    }));
  }
}
