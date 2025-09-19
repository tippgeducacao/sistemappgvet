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
    queryKey: ['supervisor-comissionamento-batch', supervisorId, ano, mes, semanas.join(',')],
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
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Estratégia de background refetch para melhor UX
    refetchInterval: 1000 * 60 * 10, // 10 minutos em background
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