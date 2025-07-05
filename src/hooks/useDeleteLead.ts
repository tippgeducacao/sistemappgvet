
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteLead = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      console.log('🗑️ Iniciando exclusão do lead:', leadId.substring(0, 8));

      // Primeiro, excluir todas as interações do lead
      const { error: interactionsError } = await supabase
        .from('lead_interactions')
        .delete()
        .eq('lead_id', leadId);

      if (interactionsError) {
        console.error('❌ Erro ao excluir interações:', interactionsError);
        throw new Error('Erro ao excluir interações do lead');
      }

      console.log('✅ Interações excluídas com sucesso');

      // Depois, excluir o lead
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (leadError) {
        console.error('❌ Erro ao excluir lead:', leadError);
        throw new Error('Erro ao excluir lead');
      }

      console.log('✅ Lead excluído com sucesso');
      return true;
    },
    onSuccess: () => {
      console.log('🎉 Exclusão concluída! Atualizando interface...');
      
      toast({
        title: '✅ Lead Excluído',
        description: 'O lead foi removido com sucesso do sistema.',
      });
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      console.error('❌ ERRO na exclusão:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir lead';
      
      toast({
        title: 'Erro na Exclusão',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    deleteLead: deleteLeadMutation.mutateAsync,
    isDeleting: deleteLeadMutation.isPending,
  };
};
