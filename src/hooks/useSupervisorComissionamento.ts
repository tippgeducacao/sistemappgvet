import { useQuery } from '@tanstack/react-query';
import { SupervisorComissionamentoService } from '@/services/supervisor/SupervisorComissionamentoService';
import { getWeekRange } from '@/utils/semanaUtils';

export const useSupervisorComissionamento = (supervisorId: string, ano: number, semana: number) => {
  return useQuery({
    queryKey: ['supervisor-comissionamento', supervisorId, ano, semana],
    queryFn: () => SupervisorComissionamentoService.calcularComissionamentoSupervisor(supervisorId, ano, semana),
    enabled: !!supervisorId && !!ano && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
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