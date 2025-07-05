
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  whatsapp?: string;
  fonte_referencia?: string;
  dispositivo?: string;
  regiao?: string;
  pagina_id?: string;
  pagina_nome?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ip_address?: string;
  user_agent?: string;
  data_captura: string;
  status: string;
  vendedor_atribuido?: string;
  observacoes?: string;
  convertido_em_venda: boolean;
  venda_id?: string;
  created_at: string;
  updated_at: string;
  // Campos para integração SprintHub
  sprinthub_id?: string;
  fonte_captura?: string;
  vendedor_atribuido_profile?: {
    name: string;
    email: string;
  };
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  tipo: string;
  descricao?: string;
  resultado?: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          vendedor_atribuido_profile:profiles!vendedor_atribuido(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map to ensure all required fields are present
      return (data || []).map(item => ({
        ...item,
        data_captura: item.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: item.vendedor_atribuido_profile || undefined
      })) as Lead[];
    },
  });
};

export const useLeadById = (leadId: string) => {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          vendedor_atribuido_profile:profiles!vendedor_atribuido(name, email)
        `)
        .eq('id', leadId)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!leadId,
  });
};

export const useLeadInteractions = (leadId: string) => {
  return useQuery({
    queryKey: ['lead-interactions', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_interactions')
        .select(`
          *,
          user:profiles!user_id(name, email)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface
      return (data || []).map(item => ({
        ...item,
        user_id: item.user_id || '',
        user: item.user || undefined
      })) as LeadInteraction[];
    },
    enabled: !!leadId,
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    },
  });
};

export const useAddLeadInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interaction: Omit<LeadInteraction, 'id' | 'created_at' | 'user'>) => {
      const { data, error } = await supabase
        .from('lead_interactions')
        .insert([interaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-interactions', variables.lead_id] });
      toast.success('Interação registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao registrar interação:', error);
      toast.error('Erro ao registrar interação');
    },
  });
};
