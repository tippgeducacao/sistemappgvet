import { useQuery } from '@tanstack/react-query';
import { SDRConversionService, SDRWeeklyConversionData } from '@/services/sdr/SDRConversionService';
import { VendedorConversionService, VendedorWeeklyConversionData } from '@/services/vendedor/VendedorConversionService';

export const useSDRWeeklyConversion = (sdrId: string, ano: number, semana: number) => {
  return useQuery({
    queryKey: ['sdr-weekly-conversion', sdrId, ano, semana],
    queryFn: () => SDRConversionService.calcularTaxaConversaoSDRSemanal(sdrId, ano, semana),
    enabled: !!sdrId && !!ano && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useVendedorWeeklyConversion = (vendedorId: string, ano: number, semana: number) => {
  return useQuery({
    queryKey: ['vendedor-weekly-conversion', vendedorId, ano, semana],
    queryFn: () => VendedorConversionService.calcularTaxaConversaoVendedorSemanal(vendedorId, ano, semana),
    enabled: !!vendedorId && !!ano && !!semana,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCurrentWeekConversions = (userIds: string[], userType: 'vendedor' | 'sdr') => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Calcular a semana atual baseado na regra quarta a terça
  const startOfYear = new Date(currentYear, 0, 1);
  const daysPassed = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil((daysPassed + startOfYear.getDay()) / 7);

  return useQuery({
    queryKey: ['current-week-conversions', userIds, userType, currentYear, currentWeek],
    queryFn: async () => {
      const conversions = await Promise.all(
        userIds.map(async (userId) => {
          try {
            if (userType === 'sdr') {
              return await SDRConversionService.calcularTaxaConversaoSDRSemanal(userId, currentYear, currentWeek);
            } else {
              return await VendedorConversionService.calcularTaxaConversaoVendedorSemanal(userId, currentYear, currentWeek);
            }
          } catch (error) {
            console.error(`Erro ao calcular conversão para ${userType} ${userId}:`, error);
            return null;
          }
        })
      );
      
      return conversions.filter(conv => conv !== null);
    },
    enabled: userIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  });
};