import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Agendamento {
  id: string;
  lead_id: string;
  sdr_id: string;
  vendedor_id: string;
  data_agendamento: string;
  pos_graduacao_interesse: string;
  observacoes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome: string;
    email?: string;
    whatsapp?: string;
  };
  sdr?: {
    name: string;
    email: string;
  };
  vendedor?: {
    name: string;
    email: string;
  };
}

export const useAgendamentos = () => {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          lead:leads(nome, email, whatsapp),
          sdr:profiles!agendamentos_sdr_id_fkey(name, email),
          vendedor:profiles!agendamentos_vendedor_id_fkey(name, email)
        `)
        .order('data_agendamento', { ascending: false });

      if (error) throw error;
      return (data || []) as Agendamento[];
    },
  });
};