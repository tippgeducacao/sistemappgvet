import { useQuery } from '@tanstack/react-query';
import { SupervisorComissionamentoBatchService } from '@/services/supervisor/SupervisorComissionamentoBatchService';
import type { SupervisorComissionamentoData } from '@/services/supervisor/SupervisorComissionamentoService';

export const useSupervisorComissionamentoBatch = (
  supervisorId: string, 
  ano: number, 
  mes: number, 
  semanas: number[]
) => {
  console.log(`🚀 Hook useSupervisorComissionamentoBatch chamado:`, { 
    supervisorId, 
    ano, 
    mes, 
    totalSemanas: semanas.length,
    semanas
  });
  
  return useQuery<SupervisorComissionamentoData[]>({
    queryKey: ['supervisor-comissionamento-batch', supervisorId, ano, mes, semanas.join(','), Date.now().toString().slice(-6)],
    queryFn: async () => {
      const startTime = performance.now();
      console.log(`⚡ BATCH: Iniciando busca paralela para ${semanas.length} semanas`);
      
      const result = await SupervisorComissionamentoBatchService.calcularComissionamentoMultiplasSemanasParalelo(
        supervisorId,
        ano,
        mes,
        semanas
      );
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log(`✅ BATCH: Busca paralela concluída em ${duration}ms:`, {
        totalSemanas: result.length,
        semanasComDados: result.filter(r => r.totalSDRs > 0).length,
        tempoProcessamento: `${duration}ms`,
        mediaPorSemana: `${Math.round(duration / semanas.length)}ms`,
        membrosUnicos: [...new Set(result.flatMap(r => r.sdrsDetalhes.map(s => s.id)))].length
      });
      
      return result;
    },
    enabled: !!supervisorId && !!ano && !!mes && semanas.length > 0,
    staleTime: 1000 * 30, // Reduzido para 30 segundos
    gcTime: 1000 * 60 * 2, // 2 minutos
    refetchOnMount: true, // Sempre refetch ao montar
    refetchOnWindowFocus: true, // Refetch quando voltar ao foco
    refetchOnReconnect: true, // Refetch quando reconectar
    // Polling mais frequente para dados críticos
    refetchInterval: 1000 * 60 * 2, // 2 minutos em background
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook para busca de uma única semana (fallback)
 */
export const useSupervisorComissionamentoSemanaUnica = (
  supervisorId: string, 
  ano: number, 
  mes: number, 
  semana: number
) => {
  return useSupervisorComissionamentoBatch(supervisorId, ano, mes, [semana]);
};