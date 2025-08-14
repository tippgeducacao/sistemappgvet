
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormDetailsResponse {
  id: string;
  campo_nome: string;
  valor_informado: string;
  form_entry_id: string;
}

export const useFormDetails = (vendaId: string | undefined) => {
  console.log('🚀 useFormDetails iniciado com vendaId:', vendaId);
  
  return useQuery({
    queryKey: ['form-details', vendaId],
    queryFn: async () => {
      if (!vendaId) {
        console.log('❌ vendaId não fornecido');
        return [];
      }
      
      console.log('🔍 Buscando detalhes do formulário para venda:', vendaId);
      
      const { data, error } = await supabase
        .from('respostas_formulario')
        .select('id, campo_nome, valor_informado, form_entry_id')
        .eq('form_entry_id', vendaId);

      if (error) {
        console.error('❌ Erro ao buscar detalhes do formulário:', error);
        throw error;
      }

      console.log('✅ Dados encontrados:', data?.length || 0, 'respostas');
      console.log('📋 TODOS OS CAMPOS DISPONÍVEIS:');
      data?.forEach((resp, index) => {
        console.log(`  ${index + 1}. "${resp.campo_nome}" = "${resp.valor_informado}"`);
      });
      
      // Buscar especificamente campos relacionados à data de assinatura
      const camposAssinatura = data?.filter(r => 
        r.campo_nome.toLowerCase().includes('assinatura') ||
        r.campo_nome.toLowerCase().includes('contrato') ||
        r.campo_nome.toLowerCase().includes('data') && r.campo_nome.toLowerCase().includes('assin')
      );
      
      console.log('🔍 CAMPOS RELACIONADOS À ASSINATURA ENCONTRADOS:');
      camposAssinatura?.forEach((campo, index) => {
        console.log(`  ${index + 1}. "${campo.campo_nome}" = "${campo.valor_informado}"`);
      });
      
      return data || [];
    },
    enabled: !!vendaId,
  });
};
