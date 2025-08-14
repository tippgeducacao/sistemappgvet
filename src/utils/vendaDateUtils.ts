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
 * Obtém a data efetiva da venda (data de matrícula ou data de envio)
 * Para vendas matriculadas, usa a data de matrícula das respostas do formulário se disponível
 * Para outras, usa a data de envio
 */
export const getDataEfetivaVenda = (venda: any, respostasFormulario?: any[]): Date => {
  // Se a venda está matriculada, tentar usar a data de matrícula do formulário
  if (venda.status === 'matriculado' && respostasFormulario) {
    const dataMatriculaResponse = respostasFormulario.find(r => 
      r.campo_nome === 'Data de Matrícula' && r.form_entry_id === venda.id
    );
    
    if (dataMatriculaResponse?.valor_informado) {
      try {
        // Tentar parsear a data do formulário (formato YYYY-MM-DD ou DD/MM/YYYY)
        const dataString = dataMatriculaResponse.valor_informado;
        let date: Date | null = null;
        
        if (dataString.includes('-')) {
          // Formato ISO: YYYY-MM-DD
          date = new Date(dataString + 'T00:00:00');
        } else if (dataString.includes('/')) {
          // Formato brasileiro: DD/MM/YYYY
          const [dia, mes, ano] = dataString.split('/');
          if (dia && mes && ano) {
            date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
          }
        }
        
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        console.warn('Erro ao parsear data de matrícula:', error);
      }
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
  endDate: Date,
  respostasFormulario?: any[]
): boolean => {
  const dataEfetiva = getDataEfetivaVenda(venda, respostasFormulario);
  return dataEfetiva >= startDate && dataEfetiva <= endDate;
};

/**
 * Obtém o período (mês/ano) de uma venda baseado na data efetiva
 */
export const getVendaEffectivePeriod = (venda: any, respostasFormulario?: any[]): { mes: number; ano: number } => {
  const dataEfetiva = getDataEfetivaVenda(venda, respostasFormulario);
  return getVendaPeriod(dataEfetiva);
};