
import { useQuery } from '@tanstack/react-query';
import { ScoringService } from '@/services/scoringService';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';
import { useFormStore } from '@/store/FormStore';
import { useAuth } from '@/hooks/useAuth';

export const useFormProgress = () => {
  const { formData } = useFormStore();
  const { user } = useAuth();
  
  const { data: rules } = useQuery({
    queryKey: ['scoring-rules'],
    queryFn: ScoringService.fetchScoringRules
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const { data: totalPoints = 0, isLoading: pointsLoading } = useQuery({
    queryKey: ['form-points', formData, rules, userProfile?.user_type],
    queryFn: async () => {
      if (!rules) return 0;
      console.log('🔢 FormProgress - Dados do formulário:', formData);
      console.log('🎯 FormProgress - ModalidadeCurso atual:', formData.modalidadeCurso);
      const points = await ScoringCalculationService.calculateTotalPoints(formData, rules, userProfile?.user_type);
      console.log('📊 FormProgress - Pontos calculados:', points);
      return points;
    },
    enabled: !!rules
  });

  return {
    totalPoints,
    isLoading: !rules || pointsLoading
  };
};
