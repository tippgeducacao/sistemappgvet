
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

export const useLeads = (page: number = 1, itemsPerPage: number = 10) => {
  return useQuery({
    queryKey: ['leads', page, itemsPerPage],
    queryFn: async () => {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from('leads')
        .select(`
          *,
          vendedor_atribuido_profile:profiles!vendedor_atribuido(name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Map to ensure all required fields are present
      const leads = (data || []).map(item => ({
        ...item,
        data_captura: item.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: item.vendedor_atribuido_profile || undefined
      })) as Lead[];

      return {
        leads,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage)
      };
    },
  });
};

export const useAllLeads = () => {
  return useQuery({
    queryKey: ['all-leads'],
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
      const leads = (data || []).map(item => ({
        ...item,
        data_captura: item.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: item.vendedor_atribuido_profile || undefined
      })) as Lead[];

      return leads;
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
          id,
          lead_id,
          user_id,
          tipo,
          descricao,
          created_at
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar informações dos usuários separadamente para evitar erros de relacionamento
      const interactionsWithUsers = await Promise.all(
        (data || []).map(async (interaction) => {
          let userData = null;
          
          if (interaction.user_id) {
            const { data: user } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', interaction.user_id)
              .single();
            userData = user;
          }

          return {
            ...interaction,
            user: userData || undefined
          };
        })
      );
      
      return interactionsWithUsers as LeadInteraction[];
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
