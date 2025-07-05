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
  // Novos campos para integração SprintHub
  sprinthub_id?: string;
  fonte_captura?: string;
  vendedor_atribuido_profile?: {
    name: string;
    email: string;
  } | null;
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
      
      return (data || []).map(lead => ({
        ...lead,
        data_captura: lead.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: lead.vendedor_atribuido_profile && 
          typeof lead.vendedor_atribuido_profile === 'object' && 
          'name' in lead.vendedor_atribuido_profile
          ? lead.vendedor_atribuido_profile as { name: string; email: string }
          : null
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
      
      return {
        ...data,
        data_captura: data.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: data.vendedor_atribuido_profile && 
          typeof data.vendedor_atribuido_profile === 'object' && 
          'name' in data.vendedor_atribuido_profile
          ? data.vendedor_atribuido_profile as { name: string; email: string }
          : null
      } as Lead;
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
        .select(`*`)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(interaction => ({
        ...interaction,
        user_id: interaction.user_id || 'system',
        user: { name: 'Sistema', email: 'system@example.com' }
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
