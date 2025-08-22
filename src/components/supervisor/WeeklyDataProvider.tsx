import React, { useMemo } from 'react';
import { useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';

interface WeeklyDataProviderProps {
  supervisorId: string;
  year: number;
  week: number;
  memberId: string;
  children: (data: { reunioesRealizadas: number; metaSemanal: number; percentual: number }) => React.ReactNode;
}

export const WeeklyDataProvider: React.FC<WeeklyDataProviderProps> = ({
  supervisorId,
  year,
  week,
  memberId,
  children
}) => {
  const { data: weekData } = useSupervisorComissionamento(supervisorId, year, week);
  
  const memberData = useMemo(() => {
    if (!weekData?.sdrsDetalhes) {
      return { reunioesRealizadas: 0, metaSemanal: 0, percentual: 0 };
    }
    
    const member = weekData.sdrsDetalhes.find(sdr => sdr.id === memberId);
    if (!member) {
      return { reunioesRealizadas: 0, metaSemanal: 0, percentual: 0 };
    }
    
    return {
      reunioesRealizadas: member.reunioesRealizadas || 0,
      metaSemanal: member.metaSemanal || 0,
      percentual: member.percentualAtingimento || 0
    };
  }, [weekData, memberId]);
  
  return <>{children(memberData)}</>;
};