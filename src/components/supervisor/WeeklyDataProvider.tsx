import React, { useMemo } from 'react';
import { useSupervisorComissionamento } from '@/hooks/useSupervisorComissionamento';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  // Calcular datas da semana específica
  const getWeekDatesForWeek = (year: number, month: number, week: number) => {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const tuesdays = [];
    let currentDate = new Date(firstDayOfMonth);
    
    while (currentDate.getDay() !== 2) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentDate.getDate() > 7) {
      const previousTuesday = new Date(currentDate);
      previousTuesday.setDate(currentDate.getDate() - 7);
      if (previousTuesday.getMonth() === month - 1) {
        tuesdays.push(new Date(previousTuesday));
      }
    }
    
    while (currentDate.getMonth() === month - 1) {
      tuesdays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    if (week <= tuesdays.length) {
      const endWeek = tuesdays[week - 1];
      const startWeek = new Date(endWeek);
      startWeek.setDate(endWeek.getDate() - 6);
      return { start: startWeek, end: endWeek };
    }
    
    return { start: new Date(), end: new Date() };
  };

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-member-data', memberId, year, month, week, memberType],
    queryFn: async () => {
      const { start, end } = getWeekDatesForWeek(year, month, week);
      
      // Buscar meta do membro
      const { data: memberProfile } = await supabase
        .from('profiles')
        .select('nivel, user_type')
        .eq('id', memberId)
        .maybeSingle();

      if (!memberProfile) return { atingimento: 0, meta: 0, percentual: 0 };

      const { data: nivelData } = await supabase
        .from('niveis_vendedores')
        .select('meta_semanal_inbound, meta_semanal_vendedor')
        .eq('nivel', memberProfile.nivel)
        .eq('tipo_usuario', memberType)
        .maybeSingle();

      const meta = memberType === 'vendedor' 
        ? (nivelData?.meta_semanal_vendedor || 0)
        : (nivelData?.meta_semanal_inbound || 0);

      let atingimento = 0;

      if (memberType === 'vendedor') {
        // Para vendedores: somar pontuações das vendas matriculadas na semana
        const { data: vendas } = await supabase
          .from('form_entries')
          .select('pontuacao_validada')
          .eq('vendedor_id', memberId)
          .eq('status', 'matriculado')
          .gte('data_aprovacao', start.toISOString())
          .lte('data_aprovacao', end.toISOString());

        atingimento = vendas?.reduce((total, venda) => 
          total + (venda.pontuacao_validada || 0), 0) || 0;
      } else {
        // Para SDRs: contar reuniões realizadas
        const { data: agendamentos } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('sdr_id', memberId)
          .gte('data_agendamento', start.toISOString())
          .lte('data_agendamento', end.toISOString())
          .not('resultado_reuniao', 'is', null);

        atingimento = agendamentos?.length || 0;
      }

      const percentual = meta > 0 ? (atingimento / meta) * 100 : 0;

      return {
        atingimento: Math.round(atingimento * 10) / 10, // Arredondar para 1 casa decimal
        meta,
        percentual: Math.round(percentual * 10) / 10
      };
    },
    enabled: !!memberId && !!year && !!month && !!week
  });
  
  const memberData = {
    reunioesRealizadas: weeklyData?.atingimento || 0,
    metaSemanal: weeklyData?.meta || 0,
    percentual: weeklyData?.percentual || 0
  };
  
  return <>{children(memberData)}</>;
};