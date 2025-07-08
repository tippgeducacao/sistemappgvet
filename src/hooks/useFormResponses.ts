import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormResponse {
  campo_nome: string;
  valor_informado: string;
}

export const useFormResponses = (formEntryId: string | null) => {
  return useQuery({
    queryKey: ['form-responses', formEntryId],
    queryFn: async (): Promise<FormResponse[]> => {
      if (!formEntryId) return [];

      const { data, error } = await supabase
        .from('respostas_formulario')
        .select('campo_nome, valor_informado')
        .eq('form_entry_id', formEntryId);

      if (error) {
        console.error('Erro ao buscar respostas do formulário:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!formEntryId,
  });
};