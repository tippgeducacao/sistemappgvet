
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminVendasService } from '@/services/vendas/AdminVendasService';
import { SupervisorVendaQueryService } from '@/services/vendas/SupervisorVendaQueryService';
import { SimpleUpdateService } from '@/services/vendas/SimpleUpdateService';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import type { VendaCompleta } from '@/hooks/useVendas';

export const useSimpleAdminVendas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSupervisor } = useUserRoles();
  
  const { data: vendas, isLoading, error, refetch } = useQuery({
    queryKey: ['simple-admin-vendas'],
    queryFn: async (): Promise<VendaCompleta[]> => {
      console.log('🚀 Carregando vendas...');
      if (isSupervisor) {
        console.log('👥 Carregando vendas da equipe do supervisor...');
        return SupervisorVendaQueryService.getAllVendasForSupervisor();
      } else {
        console.log('🔐 Carregando todas as vendas (admin/secretaria/diretor)...');
        return AdminVendasService.getAllVendasForAdmin();
      }
    },
    refetchInterval: false, // OTIMIZADA: Removido polling
    staleTime: 300000, // 5 minutos
    refetchOnWindowFocus: false,
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
