
import React from 'react';
import { useFormProgress } from '@/hooks/useFormProgress';
import { ScoringCalculationService } from '@/services/scoring/ScoringCalculationService';
import { useFormStore } from '@/store/FormStore';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

const FormProgressBar: React.FC = () => {
  const { totalPoints, isLoading } = useFormProgress();
  const { formData } = useFormStore();
  const { user } = useAuth();

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

  const { data: basePoints = 0 } = useQuery({
    queryKey: ['base-points', formData.modalidadeCurso, userProfile?.user_type],
    queryFn: () => ScoringCalculationService.getBasePoints(formData.modalidadeCurso, userProfile?.user_type),
    enabled: !!userProfile
  });

  if (isLoading || !userProfile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">Carregando pontuação...</span>
          </div>
        </div>
      </div>
    );
  }

  const additionalPoints = totalPoints - basePoints;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <span className="text-lg font-bold text-ppgvet-teal">
              Pontuação Total: {totalPoints.toFixed(1)} pontos
            </span>
            <div className="text-xs text-gray-600 mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                  Base: +{basePoints}
                </span>
                {additionalPoints > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                    Formulário: +{additionalPoints.toFixed(1)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProgressBar;
