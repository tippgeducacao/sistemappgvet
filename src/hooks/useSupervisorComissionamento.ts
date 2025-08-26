import { useQuery } from '@tanstack/react-query';
import { SupervisorComissionamentoService } from '@/services/supervisor/SupervisorComissionamentoService';
import { getWeekRange } from '@/utils/semanaUtils';

export const useSupervisorComissionamento = (supervisorId: string, ano: number, mes: number, semana: number) => {
  console.log(`🔍 Hook useSupervisorComissionamento chamado para SEMANA ${semana}:`, { supervisorId, ano, mes, semana });
  
  return useQuery({
    queryKey: ['supervisor-comissionamento', supervisorId, ano, mes, semana],
    queryFn: async () => {
      console.log(`📞 SEMANA ${semana}: Chamando SupervisorComissionamentoService.calcularComissionamentoSupervisor:`, { supervisorId, ano, mes, semana });
      const result = await SupervisorComissionamentoService.calcularComissionamentoSupervisor(supervisorId, ano, mes, semana);
      console.log(`📊 SEMANA ${semana}: Resultado retornado:`, {
        totalMembros: result?.sdrsDetalhes?.length || 0,
        membrosComDados: result?.sdrsDetalhes?.filter(sdr => sdr.reunioesRealizadas > 0).length || 0,
        detalhes: result?.sdrsDetalhes?.map(sdr => ({
          nome: sdr.nome,
          reunioes: sdr.reunioesRealizadas,
          meta: sdr.metaSemanal,
          percentual: sdr.percentualAtingimento
        })) || []
      });
      return result;
    },
    enabled: !!supervisorId && !!ano && !!mes && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useSupervisorComissionamentoAtual = (supervisorId: string) => {
  const now = new Date();
  
  return useQuery({
    queryKey: ['supervisor-comissionamento-atual', supervisorId, now.toDateString()],
    queryFn: () => SupervisorComissionamentoService.calcularComissionamentoSupervisorSemanaAtual(supervisorId),
    enabled: !!supervisorId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};