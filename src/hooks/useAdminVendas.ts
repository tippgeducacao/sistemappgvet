
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
    staleTime: 30000, // 30 segundos - dados considerados "frescos"
    gcTime: 300000,   // 5 minutos - tempo no cache
    refetchInterval: false, // Remover auto-refetch que pode conflitar com atualizações manuais
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      vendaId,
      status,
      pontuacaoValidada,
      motivoPendencia,
      dataAssinaturaContrato
    }: {
      vendaId: string;
      status: 'pendente' | 'matriculado' | 'desistiu';
      pontuacaoValidada?: number;
      motivoPendencia?: string;
      dataAssinaturaContrato?: string;
    }) => {
      console.log('⚡ useAdminVendas: Usando AdminVendasService para performance otimizada');
      
      const result = await AdminVendasService.updateVendaStatus(
        vendaId,
        status,
        pontuacaoValidada,
        motivoPendencia,
        dataAssinaturaContrato
      );
      
      if (!result) {
        throw new Error('Falha na atualização rápida');
      }
      
      console.log('✅ MUTATION FAST: Concluída');
      return { vendaId, status, result };
    },
    onSuccess: async (data) => {
      console.log('🎉 MUTATION SUCCESS: Invalidando cache de forma otimizada...');
      
      // Invalidar cache de vendas
      await queryClient.invalidateQueries({ 
        queryKey: ['admin-vendas'],
        exact: true 
      });
      
      // Invalidar também os detalhes da venda para atualizar a interface imediatamente
      await queryClient.invalidateQueries({ 
        queryKey: ['form-details', data.vendaId],
        exact: true 
      });
      
      // Invalidar todas as queries relacionadas a vendas para garantir consistência
      await queryClient.invalidateQueries({ 
        queryKey: ['vendas']
      });
      
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
