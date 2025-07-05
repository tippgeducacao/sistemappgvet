
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminVendasService } from '@/services/vendas/AdminVendasService';
import { useToast } from '@/hooks/use-toast';
import type { VendaCompleta } from '@/hooks/useVendas';

export const useAdminVendas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: vendas, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-vendas'],
    queryFn: async (): Promise<VendaCompleta[]> => {
      console.log('🚀 useAdminVendas: Carregando vendas...');
      const result = await AdminVendasService.getAllVendasForAdmin();
      console.log('📊 Vendas carregadas:', {
        total: result.length,
        pendentes: result.filter(v => v.status === 'pendente').length,
        matriculadas: result.filter(v => v.status === 'matriculado').length
      });
      return result;
    },
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
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
      console.log('🎯 MUTATION SIMPLES: Iniciando atualização', { 
        vendaId: vendaId.substring(0, 8), 
        status 
      });
      
      const result = await AdminVendasService.updateVendaStatus(
        vendaId,
        status,
        pontuacaoValidada,
        motivoPendencia
      );
      
      console.log('✅ MUTATION SIMPLES: Concluída');
      return { vendaId, status, result };
    },
    onSuccess: async () => {
      console.log('🎉 MUTATION SUCCESS: Invalidando cache...');
      
      // Invalidar cache e aguardar
      await queryClient.invalidateQueries({ queryKey: ['admin-vendas'] });
      
      toast({
        title: 'Sucesso',
        description: 'Status da venda atualizado com sucesso!',
      });
    },
    onError: (error) => {
      console.error('❌ ERRO NA MUTATION:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro',
        description: `Erro ao atualizar status: ${errorMessage}`,
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
