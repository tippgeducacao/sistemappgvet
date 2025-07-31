import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AvaliacaoSemanalService, AvaliacaoSemanal } from '@/services/vendedores/AvaliacaoSemanalService';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/AuthStore';

export const useAvaliacaoSemanal = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  // Buscar avaliações do vendedor logado
  const { data: minhasAvaliacoes, isLoading: loadingMinhas } = useQuery({
    queryKey: ['avaliacoes-semanais', profile?.id],
    queryFn: () => profile?.id ? AvaliacaoSemanalService.getAvaliacoesByVendedor(profile.id) : Promise.resolve([]),
    enabled: !!profile?.id && profile.user_type === 'vendedor'
  });

  // Buscar todas as avaliações (para admins)
  const { data: todasAvaliacoes, isLoading: loadingTodas } = useQuery({
    queryKey: ['todas-avaliacoes-semanais'],
    queryFn: () => AvaliacaoSemanalService.getAllAvaliacoes(),
    enabled: profile?.user_type === 'admin' || profile?.user_type === 'diretor' || profile?.user_type === 'secretaria'
  });

  // Buscar vendedores em risco
  const { data: vendedoresEmRisco, isLoading: loadingRisco } = useQuery({
    queryKey: ['vendedores-em-risco'],
    queryFn: () => AvaliacaoSemanalService.getVendedoresEmRisco(),
    enabled: profile?.user_type === 'admin' || profile?.user_type === 'diretor' || profile?.user_type === 'secretaria'
  });

  // Mutation para calcular avaliação de um vendedor
  const calcularAvaliacaoMutation = useMutation({
    mutationFn: ({ vendedorId, ano, semana }: { vendedorId: string; ano: number; semana: number }) =>
      AvaliacaoSemanalService.calcularAvaliacaoSemanal(vendedorId, ano, semana),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-semanais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-avaliacoes-semanais'] });
      queryClient.invalidateQueries({ queryKey: ['vendedores-em-risco'] });
      toast({
        title: "Sucesso",
        description: "Avaliação semanal calculada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao calcular avaliação: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para calcular avaliações de todos os vendedores da semana
  const calcularAvaliacoesDaSemanaMutation = useMutation({
    mutationFn: ({ ano, semana }: { ano: number; semana: number }) =>
      AvaliacaoSemanalService.calcularAvaliacoesDaSemana(ano, semana),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-semanais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-avaliacoes-semanais'] });
      queryClient.invalidateQueries({ queryKey: ['vendedores-em-risco'] });
      toast({
        title: "Sucesso",
        description: "Avaliações da semana calculadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao calcular avaliações da semana: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation para adicionar observação
  const adicionarObservacaoMutation = useMutation({
    mutationFn: ({ avaliacaoId, observacao }: { avaliacaoId: string; observacao: string }) =>
      AvaliacaoSemanalService.adicionarObservacao(avaliacaoId, observacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-semanais'] });
      queryClient.invalidateQueries({ queryKey: ['todas-avaliacoes-semanais'] });
      toast({
        title: "Sucesso",
        description: "Observação adicionada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar observação: " + error.message,
        variant: "destructive",
      });
    }
  });

  return {
    // Dados
    minhasAvaliacoes: minhasAvaliacoes || [],
    todasAvaliacoes: todasAvaliacoes || [],
    vendedoresEmRisco: vendedoresEmRisco || [],
    
    // Loading states
    loadingMinhas,
    loadingTodas,
    loadingRisco,
    
    // Mutations
    calcularAvaliacao: calcularAvaliacaoMutation.mutate,
    calcularAvaliacoesDaSemana: calcularAvaliacoesDaSemanaMutation.mutate,
    adicionarObservacao: adicionarObservacaoMutation.mutate,
    
    // Loading states das mutations
    calculandoAvaliacao: calcularAvaliacaoMutation.isPending,
    calculandoSemana: calcularAvaliacoesDaSemanaMutation.isPending,
    adicionandoObservacao: adicionarObservacaoMutation.isPending,
  };
};

// Hook específico para buscar avaliações de um vendedor específico
export const useAvaliacoesVendedor = (vendedorId: string, ano?: number) => {
  return useQuery({
    queryKey: ['avaliacoes-vendedor', vendedorId, ano],
    queryFn: () => AvaliacaoSemanalService.getAvaliacoesByVendedor(vendedorId, ano),
    enabled: !!vendedorId
  });
};

// Hook para buscar avaliações filtradas
export const useAvaliacoesSemanaisFiltradas = (ano?: number, semana?: number) => {
  const { profile } = useAuthStore();
  
  return useQuery({
    queryKey: ['avaliacoes-filtradas', ano, semana],
    queryFn: () => AvaliacaoSemanalService.getAllAvaliacoes(ano, semana),
    enabled: (profile?.user_type === 'admin' || profile?.user_type === 'diretor' || profile?.user_type === 'secretaria') && (!!ano || !!semana)
  });
};