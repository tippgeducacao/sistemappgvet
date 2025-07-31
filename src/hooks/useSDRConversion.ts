import { useQuery } from '@tanstack/react-query';
import { SDRConversionService, SDRConversionData } from '@/services/sdr/SDRConversionService';

export const useSDRConversion = (sdrId: string, startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['sdr-conversion', sdrId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => SDRConversionService.calcularTaxaConversaoSDR(sdrId, startDate, endDate),
    enabled: !!sdrId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useSDRWeeklyConversions = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['sdr-weekly-conversions', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => SDRConversionService.calcularTaxasConversaoSemana(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};