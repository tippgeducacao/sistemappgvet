import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBulkDeleteLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteLeadsMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      console.log('🗑️ Iniciando exclusão em lote de', leadIds.length, 'leads');

      // 1. Deletar todas as interações relacionadas aos leads
      const { error: interactionsError } = await supabase
        .from('lead_interactions')
        .delete()
        .in('lead_id', leadIds);

      if (interactionsError) {
        console.error('❌ Erro ao excluir interações:', interactionsError);
        throw new Error('Erro ao excluir interações dos leads');
      }

      console.log('✅ Interações excluídas com sucesso');

      // 2. Deletar os leads
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (leadsError) {
        console.error('❌ Erro ao excluir leads:', leadsError);
        throw new Error('Erro ao excluir leads');
      }

      console.log('✅ Leads excluídos com sucesso');
      return { deletedCount: leadIds.length };
    },
    onSuccess: (data) => {
      console.log('🎉 Exclusão em lote concluída! Atualizando interface...');

      toast({
        title: '✅ Exclusão Concluída',
        description: `${data.deletedCount} ${data.deletedCount === 1 ? 'lead foi excluído' : 'leads foram excluídos'} com sucesso.`,
      });

      // Invalidar todas as queries relacionadas a leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['all-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-count'] });
      queryClient.invalidateQueries({ queryKey: ['leads-filter-data'] });
    },
    onError: (error) => {
      console.error('❌ ERRO na exclusão em lote:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir leads';

      toast({
        title: 'Erro na Exclusão',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  return {
    deleteLeads: deleteLeadsMutation.mutateAsync,
    isDeleting: deleteLeadsMutation.isPending,
  };
};
