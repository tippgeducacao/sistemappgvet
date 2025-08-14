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
 * Obtém a data efetiva da venda (data de assinatura de contrato ou data de envio)
 * Para todas as vendas, usa a data de assinatura de contrato das respostas do formulário se disponível
 * Se não disponível, usa a data de envio
 */
export const getDataEfetivaVenda = (venda: any, respostasFormulario?: any[]): Date => {
  // Debug específico para venda do dia 20/08/2025
  if (venda.data_assinatura_contrato === '2025-08-20') {
    console.log(`🚨 vendaDateUtils.getDataEfetivaVenda - Venda 20/08:`, {
      venda_id: venda.id?.substring(0, 8),
      data_assinatura_contrato: venda.data_assinatura_contrato,
      data_enviado: venda.enviado_em,
      tem_respostas_formulario: !!respostasFormulario
    });
  }

  // Primeiro, verificar se existe data de assinatura de contrato no campo direto da venda
  if (venda.data_assinatura_contrato) {
    // CORREÇÃO: Garantir que a data seja interpretada no timezone local
    const dataEfetiva = new Date(venda.data_assinatura_contrato + 'T12:00:00');
    if (venda.data_assinatura_contrato === '2025-08-20') {
      console.log(`✅ Usando data_assinatura_contrato: ${dataEfetiva.toISOString()} (${dataEfetiva.toLocaleDateString('pt-BR')})`);
    }
    return dataEfetiva;
  }
  
  // Se não existe no campo direto, tentar buscar nas respostas do formulário
  if (respostasFormulario) {
    const dataAssinaturaResponse = respostasFormulario.find(r => 
      r.campo_nome === 'Data de Assinatura do Contrato' && r.form_entry_id === venda.id
    );
    
    if (dataAssinaturaResponse?.valor_informado) {
      try {
        // Tentar parsear a data do formulário (formato YYYY-MM-DD ou DD/MM/YYYY)
        const dataString = dataAssinaturaResponse.valor_informado;
        let date: Date | null = null;
        
        if (dataString.includes('-')) {
          // Formato ISO: YYYY-MM-DD - adicionar horário para evitar problemas de timezone
          date = new Date(dataString + 'T12:00:00');
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
        console.warn('Erro ao parsear data de assinatura de contrato:', error);
      }
    }
  }
  
  // Fallback para data de envio - também corrigir timezone
  const dataEnvio = new Date(venda.enviado_em);
  return dataEnvio;
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
  const periodo = getVendaPeriod(dataEfetiva);
  
  // Debug específico para venda do dia 20/08/2025
  if (venda.data_assinatura_contrato === '2025-08-20') {
    console.log(`🚨 vendaDateUtils.getVendaEffectivePeriod - Venda 20/08:`, {
      venda_id: venda.id?.substring(0, 8),
      data_efetiva: dataEfetiva.toISOString(),
      data_efetiva_br: dataEfetiva.toLocaleDateString('pt-BR'),
      periodo_calculado: periodo
    });
  }
  
  return periodo;
};