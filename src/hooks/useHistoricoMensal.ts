import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HistoricoMensalService, HistoricoMensal } from '@/services/HistoricoMensalService';
import { toast } from 'sonner';

export const useHistoricoMensal = () => {
  const queryClient = useQueryClient();

  // Listar todos os históricos
  const { 
    data: historicos = [], 
    isLoading: isLoadingHistoricos 
  } = useQuery({
    queryKey: ['historico-mensal'],
    queryFn: () => HistoricoMensalService.listarHistoricos(),
  });

  // Mutation para fechar mês
  const fecharMesMutation = useMutation({
    mutationFn: ({ ano, mes }: { ano: number; mes: number }) =>
      HistoricoMensalService.fecharMes(ano, mes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-mensal'] });
      toast.success('Mês fechado com sucesso! Os dados ficaram salvos historicamente.');
    },
    onError: (error: any) => {
      console.error('Erro ao fechar mês:', error);
      toast.error('Erro ao fechar mês. Verifique as permissões.');
    },
  });

  // Mutation para reabrir mês
  const reabrirMesMutation = useMutation({
    mutationFn: ({ ano, mes }: { ano: number; mes: number }) =>
      HistoricoMensalService.reabrirMes(ano, mes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-mensal'] });
      toast.success('Mês reaberto com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao reabrir mês:', error);
      toast.error('Erro ao reabrir mês. Apenas diretores podem reabrir.');
    },
  });

  return {
    historicos,
    isLoadingHistoricos,
    fecharMes: fecharMesMutation.mutate,
    reabrirMes: reabrirMesMutation.mutate,
    isFecharMesLoading: fecharMesMutation.isPending,
    isReabrirMesLoading: reabrirMesMutation.isPending,
  };
};

// Hook para verificar se um mês está fechado
export const useMesFechado = (ano: number, mes: number) => {
  return useQuery({
    queryKey: ['mes-fechado', ano, mes],
    queryFn: () => HistoricoMensalService.isMesFechado(ano, mes),
    enabled: !!(ano && mes),
  });
};

// Hook para buscar dados históricos de metas
export const useMetasHistoricas = (ano: number, mes?: number) => {
  return useQuery({
    queryKey: ['metas-historicas', ano, mes],
    queryFn: () => HistoricoMensalService.buscarMetasSemanais(ano, mes),
    enabled: !!(ano),
  });
};

// Hook para buscar dados históricos de regras de comissionamento
export const useRegrasComissionamentoHistoricas = (ano: number, mes?: number) => {
  return useQuery({
    queryKey: ['regras-comissionamento-historicas', ano, mes],
    queryFn: () => HistoricoMensalService.buscarRegrasComissionamento(ano, mes),
    enabled: !!(ano),
  });
};

// Hook para buscar dados históricos de níveis
export const useNiveisHistoricos = (ano: number, mes?: number) => {
  return useQuery({
    queryKey: ['niveis-historicos', ano, mes],
    queryFn: () => HistoricoMensalService.buscarNiveis(ano, mes),
    enabled: !!(ano),
  });
};