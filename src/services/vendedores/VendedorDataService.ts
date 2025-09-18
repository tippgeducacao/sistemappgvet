
import { supabase } from '@/integrations/supabase/client';
import type { Vendedor } from '../vendedoresService';
import { filterUsersByInactivationDate } from '@/utils/userInactivationUtils';

export class VendedorDataService {
  static async fetchVendedores(referenceDate?: Date): Promise<Vendedor[]> {
    console.log('🔍 Buscando vendedores considerando data de inativação...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('user_type', ['vendedor', 'sdr'])
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      throw error;
    }
    
    // Filtrar usuários baseado na data de inativação
    const filteredData = filterUsersByInactivationDate(data || [], referenceDate);
    
    console.log('✅ Vendedores encontrados (antes do filtro):', data?.length);
    console.log('✅ Vendedores válidos (após filtro de inativação):', filteredData.length);
    console.log('📸 Vendedores com fotos:', filteredData.filter(v => v.photo_url).length);
    
    return filteredData.map(item => ({
      ...item,
      nivel: item.nivel as 'junior' | 'pleno' | 'senior'
    })) as Vendedor[];
  }
}
