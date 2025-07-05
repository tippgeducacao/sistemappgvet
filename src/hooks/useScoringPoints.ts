
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ScoringRule {
  id: string;
  campo_nome: string;
  opcao_valor: string;
  pontos: number;
}

export const useScoringPoints = () => {
  return useQuery({
    queryKey: ['scoring-points'],
    queryFn: async (): Promise<ScoringRule[]> => {
      console.log('🔍 Buscando regras de pontuação...');
      
      const { data, error } = await supabase
        .from('regras_pontuacao')
        .select('id, campo_nome, opcao_valor, pontos')
        .order('campo_nome', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar regras de pontuação:', error);
        throw error;
      }

      console.log('✅ Regras encontradas:', data?.length || 0);
      console.log('📊 Dados das regras:', data);

      return data || [];
    },
  });
};

export const getPointsForFieldValue = (rules: ScoringRule[], fieldName: string, value: string): number => {
  console.log(`🔍 Buscando pontos para campo "${fieldName}" com valor "${value}"`);
  console.log('📋 Regras disponíveis:', rules.length);
  
  const rule = rules.find(r => {
    const fieldMatch = r.campo_nome === fieldName;
    const valueMatch = r.opcao_valor === value;
    console.log(`Verificando regra: ${r.campo_nome} = ${r.opcao_valor} (${r.pontos} pts) - Field: ${fieldMatch}, Value: ${valueMatch}`);
    return fieldMatch && valueMatch;
  });
  
  const points = rule?.pontos || 0;
  console.log(`🎯 Pontos encontrados: ${points}`);
  
  return points;
};
