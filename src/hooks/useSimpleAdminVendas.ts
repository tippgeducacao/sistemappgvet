
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminVendasService } from '@/services/vendas/AdminVendasService';
import { SimpleUpdateService } from '@/services/vendas/SimpleUpdateService';
import { useToast } from '@/hooks/use-toast';
import type { VendaCompleta } from '@/hooks/useVendas';

export const useSimpleAdminVendas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: vendas, isLoading, error, refetch } = useQuery({
    queryKey: ['simple-admin-vendas'],
    queryFn: async (): Promise<VendaCompleta[]> => {
      console.log('🚀 Carregando vendas...');
      return AdminVendasService.getAllVendasForAdmin();
    },
    refetchInterval: 3000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      vendaId,
      status,
      pontuacaoValidada,
      motivoPendencia
    }: {
      vendaId: string;
      status: 'pendente' | 'matriculado' | 'desistiu';
      pontuacaoValidada?: number;
      motivoPendencia?: string;
    }) => {
      console.log('🎯 Iniciando atualização:', { vendaId: vendaId.substring(0, 8), status });
      
      await SimpleUpdateService.updateVendaStatus(
        vendaId,
        status,
        pontuacaoValidada,
        motivoPendencia
      );
      
      return { vendaId, status };
    },
    onSuccess: async (data) => {
      console.log('✅ Mutation concluída, invalidando cache...');
      
      // Invalidar TODOS os caches relacionados a vendas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['simple-admin-vendas'] }),
        queryClient.invalidateQueries({ queryKey: ['all-vendas'] }),
        queryClient.invalidateQueries({ queryKey: ['vendas'] })
      ]);
      
      // Forçar refetch imediato
      refetch();
      
      toast({
        title: 'Sucesso',
        description: `Venda ${data.status === 'matriculado' ? 'aprovada' : 'rejeitada'} com sucesso!`,
      });
      
      console.log('🎉 Cache invalidado e dados recarregados!');
    },
    onError: (error) => {
      console.error('❌ ERRO:', error);
      toast({
        title: 'Erro',
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    },
  });

  return {
    vendas: vendas || [],
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    refetch
  };
};
