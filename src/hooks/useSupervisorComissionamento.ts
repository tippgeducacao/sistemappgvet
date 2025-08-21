import { useQuery } from '@tanstack/react-query';
import { SupervisorComissionamentoService } from '@/services/supervisor/SupervisorComissionamentoService';

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
  const currentYear = now.getFullYear();
  
  // Calcular semana atual baseado na regra quarta a terça
  const startOfYear = new Date(currentYear, 0, 1);
  const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil((daysPassed + startOfYear.getDay()) / 7);

  return useQuery({
    queryKey: ['supervisor-comissionamento-atual', supervisorId, currentYear, currentWeek],
    queryFn: () => SupervisorComissionamentoService.calcularComissionamentoSupervisor(supervisorId, currentYear, currentWeek),
    enabled: !!supervisorId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};