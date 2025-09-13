import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgendamentoLinkingService, LinkingResult } from '@/services/agendamentos/AgendamentoLinkingService';
import { toast } from 'sonner';

export const useAgendamentoLinking = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const queryClient = useQueryClient();

  // Query para buscar agendamentos sem vinculação
  const {
    data: agendamentosSemVinculo,
    isLoading: isLoadingAgendamentos,
    refetch: refetchAgendamentos
  } = useQuery({
    queryKey: ['agendamentos-sem-vinculo'],
    queryFn: AgendamentoLinkingService.buscarAgendamentosSemVinculo,
    staleTime: 30000, // 30 segundos
  });

  // Mutation para executar vinculação automática
  const vincularAutomaticamenteMutation = useMutation({
    mutationFn: AgendamentoLinkingService.vincularAgendamentosVendas,
    onSuccess: (results: LinkingResult[]) => {
      const sucessos = results.filter(r => r.success).length;
      const falhas = results.filter(r => !r.success).length;

      toast.success(
        `Vinculação concluída: ${sucessos} vinculações realizadas${falhas > 0 ? `, ${falhas} falhas` : ''}`
      );

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-vinculo'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
    },
    onError: (error: any) => {
      console.error('Erro na vinculação automática:', error);
      toast.error('Erro ao executar vinculação automática: ' + error.message);
    }
  });

  // Mutation para vinculação manual
  const vincularManualmenteMutation = useMutation({
    mutationFn: ({ agendamentoId, formEntryId }: { agendamentoId: string; formEntryId: string }) =>
      AgendamentoLinkingService.vincularManualmente(agendamentoId, formEntryId),
    onSuccess: () => {
      toast.success('Agendamento vinculado manualmente com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-vinculo'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
    onError: (error: any) => {
      console.error('Erro na vinculação manual:', error);
      toast.error('Erro ao vincular manualmente: ' + error.message);
    }
  });

  // Query para buscar vendas candidatas
  const buscarVendasCandidatas = (agendamentoId: string | null) =>
    useQuery({
      queryKey: ['vendas-candidatas', agendamentoId],
      queryFn: () => AgendamentoLinkingService.buscarVendasCandidatas(agendamentoId!),
      enabled: !!agendamentoId,
    });

  const executarVinculacaoAutomatica = async () => {
    setIsExecuting(true);
    try {
      await vincularAutomaticamenteMutation.mutateAsync();
    } finally {
      setIsExecuting(false);
    }
  };

  const vincularManualmente = async (agendamentoId: string, formEntryId: string) => {
    await vincularManualmenteMutation.mutateAsync({ agendamentoId, formEntryId });
  };

  return {
    // Estados
    agendamentosSemVinculo,
    isLoadingAgendamentos,
    isExecuting: isExecuting || vincularAutomaticamenteMutation.isPending,
    
    // Ações
    executarVinculacaoAutomatica,
    vincularManualmente,
    refetchAgendamentos,
    buscarVendasCandidatas,
    
    // Status das mutations
    isVinculandoManualmente: vincularManualmenteMutation.isPending,
  };
};