
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VendaDeleteService } from '@/services/vendas/VendaDeleteService';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/AuthStore';

export const useDeleteVenda = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser, profile } = useAuthStore();

  const deleteVendaMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      const userEmail = profile?.email || currentUser?.email || '';
      
      console.log('🗑️ useDeleteVenda: Iniciando exclusão com constraints corrigidas:', {
        vendaId: vendaId.substring(0, 8),
        userEmail
      });

      // Verificar permissão
      if (!VendaDeleteService.hasDeletePermission(userEmail)) {
        throw new Error('Você não tem permissão para excluir vendas.');
      }

      // Toast inicial
      toast({
        title: 'Iniciando Exclusão',
        description: 'Processando exclusão com nova estrutura de banco...',
      });

      return await VendaDeleteService.deleteVenda(vendaId, userEmail);
    },
    onSuccess: async (success, vendaId) => {
      if (success) {
        console.log('✅ Exclusão confirmada! Limpando cache e recarregando...');
        
        // Toast de sucesso
        toast({
          title: '🎉 Venda Excluída com Sucesso',
          description: 'A venda foi removida permanentemente do sistema.',
        });
        
        // Limpar todo o cache para forçar recarregamento
        queryClient.clear();
        
        // Aguardar para garantir limpeza do cache
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Toast de confirmação final
        toast({
          title: 'Sistema Atualizado',
          description: 'Dados foram atualizados. Recarregando página...',
        });

        // Recarregar página após delay para mostrar mudanças
        console.log('🔄 Recarregando página para refletir mudanças...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('❌ ERRO CRÍTICO na exclusão:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir venda';
      
      // Toast de erro principal
      toast({
        title: 'Erro na Exclusão',
        description: errorMessage,
        variant: 'destructive',
      });

      // Se for erro de permissão
      if (errorMessage.includes('permissão')) {
        setTimeout(() => {
          toast({
            title: 'Acesso Negado',
            description: `Apenas ${VendaDeleteService.getAuthorizedEmail()} pode excluir vendas.`,
            variant: 'destructive',
          });
        }, 2000);
      } else {
        // Toast adicional com instruções técnicas
        setTimeout(() => {
          toast({
            title: 'Detalhes Técnicos',
            description: 'Verifique o console do navegador (F12) para logs detalhados do erro.',
          });
        }, 2000);
      }
    },
  });

  // Verificar se o usuário atual tem permissão
  const canDelete = () => {
    const userEmail = profile?.email || currentUser?.email || '';
    return VendaDeleteService.hasDeletePermission(userEmail);
  };

  return {
    deleteVenda: deleteVendaMutation.mutateAsync,
    isDeleting: deleteVendaMutation.isPending,
    canDelete: canDelete(),
    authorizedEmail: VendaDeleteService.getAuthorizedEmail()
  };
};
