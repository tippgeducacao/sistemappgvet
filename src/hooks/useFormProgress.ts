
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
    return ScoringCalculationService.calculateTotalPoints(formData, rules);
  }, [formData, rules]);

  return {
    totalPoints,
    isLoading: !rules
  };
};
