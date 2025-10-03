import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComissionamentoService } from '@/services/comissionamentoService';
import { OptimizedCacheService } from '@/services/cache/OptimizedCacheService';
import { ComissionamentoCacheService } from '@/services/cache/ComissionamentoCache';
import { Logger } from '@/services/logger/LoggerService';

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
        if ((window as any).DEBUG_COMMISSION) {
          Logger.debug(`🚀 useComissionamentoCalculation: Cache HIT para ${calculationKey}`);
        }
        return cached;
      }

      if ((window as any).DEBUG_COMMISSION) {
        Logger.debug(`🔄 useComissionamentoCalculation: Cache MISS - Calculando para ${calculationKey}`);
      }
      
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
  const cacheConfig = OptimizedCacheService.getCacheConfig('COMISSIONAMENTO_CALCULOS');

  const keyPart = (calculations || []).map((c) =>
    `${c.tipoUsuario ?? 'vendedor'}_${c.pontosObtidos}_${c.metaSemanal}_${c.variabelSemanal}`
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['comissionamento-calculo-batch', keyPart],
    queryFn: async () => {
      const results = await Promise.all(
        (calculations || []).map(async (params) => {
          const {
            pontosObtidos,
            metaSemanal,
            variabelSemanal,
            tipoUsuario = 'vendedor',
            enabled: itemEnabled = true,
          } = params;

          const valid =
            itemEnabled &&
            typeof pontosObtidos === 'number' &&
            typeof metaSemanal === 'number' &&
            typeof variabelSemanal === 'number' &&
            !isNaN(pontosObtidos) &&
            !isNaN(metaSemanal) &&
            !isNaN(variabelSemanal);

          if (!valid) return null;

          const cached = ComissionamentoCacheService.getCalculo(
            pontosObtidos,
            metaSemanal,
            variabelSemanal,
            tipoUsuario
          );
          if (cached) {
            return cached;
          }

          const result = await ComissionamentoService.calcularComissao(
            pontosObtidos,
            metaSemanal,
            variabelSemanal,
            tipoUsuario
          );
          return result;
        })
      );
      return results;
    },
    enabled: enabled && Array.isArray(calculations) && calculations.length > 0,
    ...cacheConfig,
    retry: 1,
  });

  return {
    data: data?.filter((r) => r != null) ?? [],
    loading: isLoading,
    error,
  };
};