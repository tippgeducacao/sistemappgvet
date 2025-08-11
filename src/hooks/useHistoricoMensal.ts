import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HistoricoMensalService, HistoricoMensal } from '@/services/HistoricoMensalService';
import { toast } from 'sonner';

export const useHistoricoMensal = () => {
  // Apenas retorna funções para consulta de histórico
  return {
    historicos: [],
    isLoadingHistoricos: false,
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