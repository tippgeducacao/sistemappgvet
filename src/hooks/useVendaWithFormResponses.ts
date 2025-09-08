import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendaWithFormResponses {
  venda: any;
  respostas: any[];
}

export const useVendaWithFormResponses = (vendas: any[]) => {
  const [vendasWithResponses, setVendasWithResponses] = useState<VendaWithFormResponses[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFormResponses = async () => {
      if (!vendas || vendas.length === 0) {
        setVendasWithResponses([]);
        setIsLoading(false);
        return;
      }

      try {
        // Filtrar apenas vendas que precisam das respostas (sem data_assinatura_contrato)
        const vendasQueNecessitamRespostas = vendas.filter(v => 
          !v.data_assinatura_contrato && v.status === 'matriculado'
        );
        
        console.log('🔍 Buscando respostas apenas para', vendasQueNecessitamRespostas.length, 'vendas (de', vendas.length, 'total)');
        
        if (vendasQueNecessitamRespostas.length === 0) {
          // Se não precisa buscar respostas, retornar vendas com arrays vazios
          const vendasSemNecessidadeRespostas = vendas.map(venda => ({
            venda,
            respostas: []
          }));
          setVendasWithResponses(vendasSemNecessidadeRespostas);
          setIsLoading(false);
          return;
        }
        
        const vendaIds = vendasQueNecessitamRespostas.map(v => v.id);
        
        const { data: respostas, error } = await supabase
          .from('respostas_formulario')
          .select('form_entry_id, campo_nome, valor_informado') // Selecionar apenas campos necessários
          .in('form_entry_id', vendaIds);

        if (error) {
          console.error('Erro ao buscar respostas do formulário:', error);
          throw error;
        }

        console.log('✅ Respostas encontradas:', respostas?.length || 0);

        // Agrupar respostas por form_entry_id
        const respostasPorVenda = (respostas || []).reduce((acc, resposta) => {
          if (!acc[resposta.form_entry_id]) {
            acc[resposta.form_entry_id] = [];
          }
          acc[resposta.form_entry_id].push(resposta);
          return acc;
        }, {} as Record<string, any[]>);

        // Combinar vendas com suas respostas
        const vendasComRespostas = vendas.map(venda => ({
          venda,
          respostas: respostasPorVenda[venda.id] || []
        }));

        setVendasWithResponses(vendasComRespostas);
      } catch (error) {
        console.error('Erro ao processar vendas com respostas:', error);
        // Em caso de erro, retornar vendas sem respostas
        const vendasSemRespostas = vendas.map(venda => ({
          venda,
          respostas: []
        }));
        setVendasWithResponses(vendasSemRespostas);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormResponses();
  }, [vendas]);

  return {
    vendasWithResponses,
    isLoading
  };
};

// Função helper para extrair data de assinatura de contrato de uma venda específica
export const getDataAssinaturaFromRespostas = (respostas: any[]): Date | null => {
  const dataAssinaturaResponse = respostas.find(r => r.campo_nome === 'Data de Assinatura do Contrato');
  
  if (!dataAssinaturaResponse?.valor_informado) {
    return null;
  }

  try {
    const dataString = dataAssinaturaResponse.valor_informado;
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
    console.warn('Erro ao parsear data de assinatura de contrato:', error);
  }

  return null;
};

// Função helper para extrair data de matrícula de uma venda específica (mantida para compatibilidade)
export const getDataMatriculaFromRespostas = (respostas: any[]): Date | null => {
  const dataMatriculaResponse = respostas.find(r => r.campo_nome === 'Data de Matrícula');
  
  if (!dataMatriculaResponse?.valor_informado) {
    return null;
  }

  try {
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

  return null;
};