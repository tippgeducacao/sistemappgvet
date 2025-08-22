import React, { useMemo } from 'react';
import { useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';

interface WeeklyDataProviderProps {
  supervisorId: string;
  year: number;
  month: number;
  week: number;
  memberId: string;
  memberType: 'sdr' | 'vendedor';
  children: (data: { reunioesRealizadas: number; metaSemanal: number; percentual: number }) => React.ReactNode;
}

export const WeeklyDataProvider: React.FC<WeeklyDataProviderProps> = ({
  supervisorId,
  year,
  month,
  week,
  memberId,
  memberType,
  children
}) => {
  console.log('🔍 WeeklyDataProvider:', { supervisorId, year, month, week, memberId, memberType });
  console.log('🆔 Procurando membro com ID:', memberId);
  
  // Usar o hook que busca dados da planilha detalhada para a semana específica
  const { data: weekData, isLoading, error } = useSupervisorComissionamento(supervisorId, year, month, week);
  
  console.log('📊 WeeklyDataProvider data:', {
    memberId,
    hasWeekData: !!weekData,
    sdrsDetalhesCount: weekData?.sdrsDetalhes?.length || 0,
    sdrsDetalhesIds: weekData?.sdrsDetalhes?.map(sdr => ({ id: sdr.id.substring(0, 8), nome: sdr.nome })),
    isLoading,
    error
  });
  
  const memberData = useMemo(() => {
    if (!weekData?.sdrsDetalhes) {
      console.log('⚠️ Sem sdrsDetalhes para membro:', memberId);
      return { reunioesRealizadas: 0, metaSemanal: 0, percentual: 0 };
    }
    
    const member = weekData.sdrsDetalhes.find(sdr => sdr.id === memberId);
    console.log('👤 Membro encontrado:', { 
      memberId, 
      found: !!member, 
      memberData: member 
    });
    
    if (!member) {
      return { reunioesRealizadas: 0, metaSemanal: 0, percentual: 0 };
    }
    
    const result = {
      reunioesRealizadas: member.reunioesRealizadas || 0,
      metaSemanal: member.metaSemanal || 0,
      percentual: member.percentualAtingimento || 0
    };
    
    console.log('📈 Resultado final para membro:', { memberId, result });
    
    return result;
  }, [weekData, memberId]);
  
  return <>{children(memberData)}</>;
};