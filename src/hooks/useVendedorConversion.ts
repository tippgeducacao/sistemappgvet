import { useQuery } from '@tanstack/react-query';
import { VendedorConversionService, VendedorConversionData } from '@/services/vendedor/VendedorConversionService';

export const useVendedorConversion = (vendedorId: string, startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['vendedor-conversion', vendedorId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => VendedorConversionService.calcularTaxaConversaoVendedor(vendedorId, startDate, endDate),
    enabled: !!vendedorId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useVendedoresWeeklyConversions = (vendedorIds: string[], startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['vendedores-weekly-conversions', vendedorIds, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      console.log('🚀 Hook executando query com:', { vendedorIds: vendedorIds.length, startDate, endDate });
      try {
        const result = await VendedorConversionService.calcularTaxasConversaoSemana(vendedorIds, startDate, endDate);
        console.log('✅ Hook resultado:', result?.length || 0, 'conversões calculadas');
        return result;
      } catch (error) {
        console.error('❌ Erro no hook de conversões:', error);
        throw error;
      }
    },
    enabled: vendedorIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 3,
    retryDelay: 1000,
  });
};