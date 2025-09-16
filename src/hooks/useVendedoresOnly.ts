import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendedorOnly {
  id: string;
  name: string;
  email: string;
  user_type: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  nivel?: string;
}

export const useVendedoresOnly = () => {
  const [vendedores, setVendedores] = useState<VendedorOnly[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchVendedores = async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando apenas vendedores ativos...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'vendedor')
        .eq('ativo', true)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar vendedores:', error);
        throw new Error(`Erro ao buscar vendedores: ${error.message}`);
      }

      console.log('✅ Vendedores encontrados:', data?.length || 0);
      setVendedores(data || []);
      
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