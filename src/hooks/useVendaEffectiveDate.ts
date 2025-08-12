import { useMemo } from 'react';
import { getDataEfetivaVenda, getVendaEffectivePeriod, isVendaInWeek } from '@/utils/vendaDateUtils';
import type { VendaCompleta } from './useVendas';

/**
 * Hook para trabalhar com datas efetivas de vendas
 * (data de assinatura do contrato para vendas matriculadas)
 */
export const useVendaEffectiveDate = () => {
  const filterVendasByPeriod = useMemo(() => {
    return (vendas: VendaCompleta[], selectedMonth: number, selectedYear: number) => {
      return vendas.filter(venda => {
        if (!venda.enviado_em) return false;
        const vendaPeriod = getVendaEffectivePeriod(venda);
        return vendaPeriod.mes === selectedMonth && vendaPeriod.ano === selectedYear;
      });
    };
  }, []);

  const filterVendasByWeek = useMemo(() => {
    return (vendas: VendaCompleta[], startDate: Date, endDate: Date) => {
      return vendas.filter(venda => {
        if (!venda.enviado_em) return false;
        return isVendaInWeek(venda, startDate, endDate);
      });
    };
  }, []);

  const getVendaEffectiveDate = useMemo(() => {
    return (venda: VendaCompleta) => {
      return getDataEfetivaVenda(venda);
    };
  }, []);

  const getVendaPeriod = useMemo(() => {
    return (venda: VendaCompleta) => {
      return getVendaEffectivePeriod(venda);
    };
  }, []);

  return {
    filterVendasByPeriod,
    filterVendasByWeek,
    getVendaEffectiveDate,
    getVendaPeriod
  };
};