
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormDetailsResponse {
  id: string;
  campo_nome: string;
  valor_informado: string;
  form_entry_id: string;
}

export const useFormDetails = (vendaId: string | undefined) => {
  return useQuery({
    queryKey: ['form-details', vendaId],
    queryFn: async () => {
      if (!vendaId) return [];
      
      console.log('🔍 Buscando detalhes do formulário para venda:', vendaId);
      
      const { data, error } = await supabase
        .from('respostas_formulario')
        .select('id, campo_nome, valor_informado, form_entry_id')
        .eq('form_entry_id', vendaId);

      if (error) {
        console.error('❌ Erro ao buscar detalhes do formulário:', error);
        throw error;
      }

      console.log('✅ Detalhes do formulário encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!vendaId,
  });
};
