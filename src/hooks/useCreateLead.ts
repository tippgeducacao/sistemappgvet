import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateLeadData {
  nome: string;
  email: string;
  whatsapp: string;
  observacoes: string;
  fonte_referencia: string;
  status: string;
}

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadData: CreateLeadData) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    },
  });
};