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
        
        // Debug específico para Pedro Garbelini
        if (venda.id === '53af0209-9b2d-4b76-b6a2-2c9d8e4f7a8c' || 
            venda.aluno?.nome === 'Pedro Garbelini' || venda.aluno?.nome?.includes('Pedro')) {
          console.log(`🚨 HOOK useVendaEffectiveDate - Pedro:`, {
            venda_id: venda.id.substring(0, 8),
            nome_aluno: venda.aluno?.nome || 'N/A',
            data_assinatura_contrato: venda.data_assinatura_contrato,
            data_enviado: venda.enviado_em,
            vendaPeriod,
            selectedMonth,
            selectedYear,
            match: vendaPeriod.mes === selectedMonth && vendaPeriod.ano === selectedYear
          });
        }
        
        // Debug específico para vendas do dia 20/08/2025
        if (venda.data_assinatura_contrato === '2025-08-20') {
          console.log(`🚨 HOOK useVendaEffectiveDate - Venda 20/08:`, {
            venda_id: venda.id.substring(0, 8),
            data_assinatura_contrato: venda.data_assinatura_contrato,
            data_enviado: venda.enviado_em,
            vendaPeriod,
            selectedMonth,
            selectedYear,
            match: vendaPeriod.mes === selectedMonth && vendaPeriod.ano === selectedYear
          });
        }
        
        return vendaPeriod.mes === selectedMonth && vendaPeriod.ano === selectedYear;
      });
    };
  }, []);

  const filterVendasByWeek = useMemo(() => {
    return (vendas: VendaCompleta[], startDate: Date, endDate: Date) => {
      return vendas.filter(venda => {
        if (!venda.enviado_em) return false;
        const isInWeek = isVendaInWeek(venda, startDate, endDate);
        
        // Debug específico para Pedro Garbelini
        if (venda.id === '53af0209-9b2d-4b76-b6a2-2c9d8e4f7a8c' || 
            venda.aluno?.nome === 'Pedro Garbelini' || venda.aluno?.nome?.includes('Pedro')) {
          console.log(`🚨 HOOK useVendaEffectiveDate - filterVendasByWeek Pedro:`, {
            venda_id: venda.id.substring(0, 8),
            nome_aluno: venda.aluno?.nome || 'N/A',
            data_assinatura_contrato: venda.data_assinatura_contrato,
            data_enviado: venda.enviado_em,
            startDate: startDate.toLocaleDateString('pt-BR'),
            endDate: endDate.toLocaleDateString('pt-BR'),
            isInWeek
          });
        }
        
        // Debug específico para vendas do dia 20/08/2025
        if (venda.data_assinatura_contrato === '2025-08-20') {
          console.log(`🚨 HOOK useVendaEffectiveDate - filterVendasByWeek 20/08:`, {
            venda_id: venda.id.substring(0, 8),
            data_assinatura_contrato: venda.data_assinatura_contrato,
            data_enviado: venda.enviado_em,
            startDate: startDate.toLocaleDateString('pt-BR'),
            endDate: endDate.toLocaleDateString('pt-BR'),
            isInWeek
          });
        }
        
        return isInWeek;
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