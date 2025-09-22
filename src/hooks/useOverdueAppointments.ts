import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOverdueAppointments = () => {
  useEffect(() => {
    // Função para verificar e atualizar agendamentos atrasados
    const checkOverdueAppointments = async () => {
      try {
        const { error } = await supabase.rpc('check_and_update_overdue_appointments');
        if (error) {
          console.error('Erro ao verificar agendamentos atrasados:', error);
        }
      } catch (error) {
        console.error('Erro ao executar verificação de agendamentos atrasados:', error);
      }
    };

    // Verificar imediatamente quando o hook é montado
    checkOverdueAppointments();

    // Verificar a cada 15 minutos (reduzido de 2 minutos)
    const interval = setInterval(checkOverdueAppointments, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};