
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScoringService } from '@/services/scoringService';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';
import { useFormStore } from '@/store/FormStore';

export const useFormProgress = () => {
  const { formData } = useFormStore();
  
  const { data: rules } = useQuery({
    queryKey: ['scoring-rules'],
    queryFn: ScoringService.fetchScoringRules
  });

  const totalPoints = useMemo(() => {
    if (!rules) return 0;
    console.log('🔢 FormProgress - Dados do formulário:', formData);
    console.log('🎯 FormProgress - ModalidadeCurso atual:', formData.modalidadeCurso);
    const points = ScoringCalculationService.calculateTotalPoints(formData, rules);
    console.log('📊 FormProgress - Pontos calculados:', points);
    return points;
  }, [formData, rules]);

  return {
    totalPoints,
    isLoading: !rules
  };
};
