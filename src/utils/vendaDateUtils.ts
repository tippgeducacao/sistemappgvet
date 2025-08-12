/**
 * Utilitários para trabalhar com datas de vendas e contratos
 */

import { getVendaPeriod } from './semanaUtils';

/**
 * Extrai a data de assinatura do contrato das observações
 */
export const extractDataAssinaturaContrato = (observacoes: string | null): Date | null => {
  if (!observacoes) return null;
  
  // Buscar por padrão: "📅 Data de assinatura do contrato: DD/MM/AAAA"
  const regex = /📅 Data de assinatura do contrato:\s*(\d{1,2}\/\d{1,2}\/\d{4})/;
  const match = observacoes.match(regex);
  
  if (match) {
    const [day, month, year] = match[1].split('/');
    // Criar data no formato correto (mês é 0-indexed)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
};

/**
 * Obtém a data efetiva da venda (data de assinatura do contrato ou data de envio)
 * Para vendas matriculadas, usa a data de assinatura se disponível
 * Para outras, usa a data de envio
 */
export const getDataEfetivaVenda = (venda: any): Date => {
  // Se a venda está matriculada, tentar usar a data de assinatura do contrato
  if (venda.status === 'matriculado') {
    const dataAssinatura = extractDataAssinaturaContrato(venda.observacoes);
    if (dataAssinatura) {
      return dataAssinatura;
    }
  }
  
  // Fallback para data de envio
  return new Date(venda.enviado_em);
};

/**
 * Verifica se uma venda pertence a uma semana específica usando a data efetiva
 */
export const isVendaInWeek = (
  venda: any, 
  startDate: Date, 
  endDate: Date
): boolean => {
  const dataEfetiva = getDataEfetivaVenda(venda);
  return dataEfetiva >= startDate && dataEfetiva <= endDate;
};

/**
 * Obtém o período (mês/ano) de uma venda baseado na data efetiva
 */
export const getVendaEffectivePeriod = (venda: any): { mes: number; ano: number } => {
  const dataEfetiva = getDataEfetivaVenda(venda);
  return getVendaPeriod(dataEfetiva);
};