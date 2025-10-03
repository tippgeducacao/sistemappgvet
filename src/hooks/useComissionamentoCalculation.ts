import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { OptimizedCacheService } from '@/services/cache/OptimizedCacheService';
import { ComissionamentoCacheService } from '@/services/cache/ComissionamentoCache';

interface ComissionamentoCalculationParams {
  pontosObtidos: number;
  metaSemanal: number;
  variabelSemanal: number;
  tipoUsuario?: string;
  enabled?: boolean;
}

/**
 * Hook otimizado para cálculos de comissionamento
 * Combina busca de regras + cálculo com cache inteligente
 */
export const useComissionamentoCalculation = ({
  pontosObtidos,
  metaSemanal,
  variabelSemanal,
  tipoUsuario = 'vendedor',
  enabled = true
}: ComissionamentoCalculationParams) => {
  
  // Cache configuration para cálculos
  const cacheConfig = OptimizedCacheService.getCacheConfig('COMISSIONAMENTO_CALCULOS');

  // Chave única baseada nos parâmetros para evitar recálculos desnecessários
  const calculationKey = useMemo(() => 
    `${tipoUsuario}_${pontosObtidos}_${metaSemanal}_${variabelSemanal}`,
    [tipoUsuario, pontosObtidos, metaSemanal, variabelSemanal]
  );

  const {
    data: resultado,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['comissionamento-calculo', calculationKey],
    queryFn: async () => {
      // Verificar cache global primeiro
      const cached = ComissionamentoCacheService.getCalculo(
        pontosObtidos,
        metaSemanal,
        variabelSemanal,
        tipoUsuario
      );
      
      if (cached) {
        console.log(`🚀 useComissionamentoCalculation: Cache HIT para ${calculationKey}`);
        return cached;
      }

      console.log(`🔄 useComissionamentoCalculation: Cache MISS - Calculando para ${calculationKey}`);
      
      // Calcular novo resultado
      const result = await ComissionamentoService.calcularComissao(
        pontosObtidos,
        metaSemanal,
        variabelSemanal,
        tipoUsuario
      );

      // Salvar no cache global
      ComissionamentoCacheService.setCalculo(
        pontosObtidos,
        metaSemanal,
        variabelSemanal,
        tipoUsuario,
        result
      );

      return result;
    },
    enabled: enabled && 
             typeof pontosObtidos === 'number' && 
             typeof metaSemanal === 'number' && 
             typeof variabelSemanal === 'number' &&
             !isNaN(pontosObtidos) &&
             !isNaN(metaSemanal) &&
             !isNaN(variabelSemanal),
    ...cacheConfig,
    retry: 1,
  });

  // Memoizar resultado para evitar recálculos em re-renders
  const memoizedResult = useMemo(() => {
    if (!resultado) return null;
    
    return {
      valor: resultado.valor,
      multiplicador: resultado.multiplicador,
      percentual: resultado.percentual,
      // Informações extras para debug
      _meta: {
        pontosObtidos,
        metaSemanal,
        variabelSemanal,
        tipoUsuario,
        calculationKey
      }
    };
  }, [resultado, pontosObtidos, metaSemanal, variabelSemanal, tipoUsuario, calculationKey]);

  return {
    resultado: memoizedResult,
    loading,
    error,
    // Utilitários para debug
    calculationKey,
    cacheStats: ComissionamentoCacheService.getStats(),
  };
};

/**
 * Hook para múltiplos cálculos em batch (para componentes como VendorsRanking)
 */
export const useBatchComissionamentoCalculation = (
  calculations: ComissionamentoCalculationParams[],
  enabled = true
) => {
  const results = calculations.map((params, index) => 
    useComissionamentoCalculation({
      ...params,
      enabled: enabled && Boolean(params.pontosObtidos !== undefined)
    })
  );

  const loading = results.some(r => r.loading);
  const error = results.find(r => r.error)?.error;
  
  const data = results.map(r => r.resultado).filter(Boolean);

  return {
    data,
    loading,
    error,
    results, // Acesso individual se necessário
  };
};