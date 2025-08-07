import { useQuery } from '@tanstack/react-query';
import { SDRComissionamentoService, type SDRComissionamentoData } from '@/services/sdr/SDRComissionamentoService';

export const useSDRComissionamentoSemanal = (sdrId: string, ano: number, semana: number) => {
  return useQuery({
    queryKey: ['sdr-comissionamento-semanal', sdrId, ano, semana],
    queryFn: () => SDRComissionamentoService.calcularComissionamentoSDRSemanal(sdrId, ano, semana),
    enabled: !!sdrId && !!ano && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useSDRComissionamentoTodosSemanal = (ano: number, semana: number) => {
  return useQuery({
    queryKey: ['sdr-comissionamento-todos-semanal', ano, semana],
    queryFn: () => SDRComissionamentoService.calcularComissionamentoTodosSDRs(ano, semana),
    enabled: !!ano && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useSDRComissionamentoAtual = (sdrId: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Calcular semana atual baseado na regra quarta a terça
  const startOfYear = new Date(currentYear, 0, 1);
  const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil((daysPassed + startOfYear.getDay()) / 7);

  return useQuery({
    queryKey: ['sdr-comissionamento-atual', sdrId, currentYear, currentWeek],
    queryFn: () => SDRComissionamentoService.calcularComissionamentoSDRSemanal(sdrId, currentYear, currentWeek),
    enabled: !!sdrId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};