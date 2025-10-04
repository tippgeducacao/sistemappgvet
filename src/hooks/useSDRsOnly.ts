import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { filterUsersByInactivationDate, type UserProfile } from '@/utils/userInactivationUtils';

export interface SDROnly extends UserProfile {
  name: string;
  email: string;
  user_type: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  nivel?: string;
}

export const useSDRsOnly = () => {
  const [sdrs, setSdrs] = useState<SDROnly[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSDRs = async (referenceDate?: Date) => {
    try {
      setLoading(true);
      console.log('🔄 Buscando SDRs considerando data de inativação...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['sdr', 'sdr_inbound', 'sdr_outbound'])
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar SDRs:', error);
        throw new Error(`Erro ao buscar SDRs: ${error.message}`);
      }

      // Filtrar usuários baseado na data de inativação
      const filteredData = filterUsersByInactivationDate(data || [], referenceDate);

      console.log('✅ SDRs encontrados (antes do filtro):', data?.length || 0);
      console.log('✅ SDRs válidos (após filtro de inativação):', filteredData.length);
      setSdrs(filteredData as SDROnly[]);
      
    } catch (error) {
      console.error('❌ Erro ao buscar SDRs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar SDRs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSDRs();
  }, []);

  return {
    sdrs,
    loading,
    fetchSDRs,
  };
};
