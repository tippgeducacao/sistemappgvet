import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { filterUsersByInactivationDate, type UserProfile } from '@/utils/userInactivationUtils';

export interface VendedorOnly extends UserProfile {
  name: string;
  email: string;
  user_type: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  nivel?: string;
}

export const useVendedoresOnly = () => {
  const [vendedores, setVendedores] = useState<VendedorOnly[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVendedores = async (referenceDate?: Date) => {
    try {
      setLoading(true);
      console.log('🔄 Buscando vendedores considerando data de inativação...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendedor')
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar vendedores:', error);
        throw new Error(`Erro ao buscar vendedores: ${error.message}`);
      }

      // Filtrar usuários baseado na data de inativação
      const filteredData = filterUsersByInactivationDate(data || [], referenceDate);

      console.log('✅ Vendedores encontrados (antes do filtro):', data?.length || 0);
      console.log('✅ Vendedores válidos (após filtro de inativação):', filteredData.length);
      setVendedores(filteredData as VendedorOnly[]);
      
    } catch (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vendedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  return {
    vendedores,
    loading,
    fetchVendedores,
  };
};