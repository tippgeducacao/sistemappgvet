
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizePageSlug } from '@/utils/leadUtils';

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

export interface LeadFilters {
  searchTerm?: string;
  statusFilter?: string;
  profissaoFilter?: string;
  paginaFilter?: string;
  fonteFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const useLeads = (page: number = 1, itemsPerPage: number = 100, filters: LeadFilters = {}) => {
  return useQuery({
    queryKey: ['leads', page, itemsPerPage, filters],
    queryFn: async () => {
      console.log('🔍 INICIANDO BUSCA DE LEADS...');
      // Buscar TODOS os leads usando paginação em lotes
      let allData: any[] = [];
      let startIndex = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('leads')
          .select(`
            *,
            vendedor_atribuido_profile:profiles!vendedor_atribuido(name, email)
          `)
          .order('created_at', { ascending: false })
          .range(startIndex, startIndex + batchSize - 1);

        const { data: batchData, error: batchError } = await query;

        if (batchError) throw batchError;
        
        console.log(`📦 Lote ${Math.floor(startIndex/batchSize) + 1}: ${batchData?.length || 0} leads`);
        
        if (batchData && batchData.length > 0) {
          allData = [...allData, ...batchData];
          startIndex += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 TOTAL DE LEADS BUSCADOS: ${allData.length}`);
      
      // Map to ensure all required fields are present
      let allFilteredLeads = allData.map(item => ({
        ...item,
        data_captura: item.created_at || new Date().toISOString(),
        convertido_em_venda: false,
        vendedor_atribuido_profile: item.vendedor_atribuido_profile || undefined
      })) as Lead[];

      // Aplicar TODOS os filtros no lado cliente
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        allFilteredLeads = allFilteredLeads.filter(lead => 
          lead.nome?.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm) ||
          lead.whatsapp?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.statusFilter && filters.statusFilter !== 'todos') {
        allFilteredLeads = allFilteredLeads.filter(lead => lead.status === filters.statusFilter);
      }

      if (filters.fonteFilter && filters.fonteFilter !== 'todos') {
        allFilteredLeads = allFilteredLeads.filter(lead => lead.utm_source === filters.fonteFilter);
      }

      if (filters.profissaoFilter && filters.profissaoFilter !== 'todos') {
        allFilteredLeads = allFilteredLeads.filter(lead => {
          const match = lead.observacoes?.match(/Profissão\/Área:\s*([^\n]+)/);
          const profissao = match ? match[1].trim() : null;
          return profissao === filters.profissaoFilter;
        });
      }

      if (filters.paginaFilter && filters.paginaFilter !== 'todos') {
        console.log('🔍 [useLeads] Aplicando filtro de página:', filters.paginaFilter);
        allFilteredLeads = allFilteredLeads.filter(lead => {
          const pagina = normalizePageSlug(lead.pagina_nome);
          const match = pagina === filters.paginaFilter.toLowerCase();
          if (!match && lead.pagina_nome?.includes(filters.paginaFilter)) {
            console.log('❓ [useLeads] Possível discrepância:', {
              original: lead.pagina_nome,
              normalizado: pagina,
              filtro: filters.paginaFilter
            });
          }
          return match;
        });
        console.log('🔍 [useLeads] Leads após filtro de página:', allFilteredLeads.length);
      }

      // Filtro por data
      if (filters.dateFrom || filters.dateTo) {
        allFilteredLeads = allFilteredLeads.filter(lead => {
          const leadDate = new Date(lead.created_at);
          const matchesDateFrom = !filters.dateFrom || leadDate >= filters.dateFrom;
          const matchesDateTo = !filters.dateTo || leadDate <= filters.dateTo;
          return matchesDateFrom && matchesDateTo;
        });
      }

      // Agora aplicar a paginação nos leads já filtrados
      const totalCount = allFilteredLeads.length;
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      const paginationStart = (page - 1) * itemsPerPage;
      const paginationEnd = paginationStart + itemsPerPage;
      const paginatedLeads = allFilteredLeads.slice(paginationStart, paginationEnd);

      return {
        leads: paginatedLeads,
        totalCount,
        totalPages,
        filteredCount: totalCount // Total de leads após aplicar filtros
      };
    },
  });
};

// Hook para obter apenas o total de leads (para estatísticas)
export const useLeadsCount = () => {
  return useQuery({
    queryKey: ['leads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });
};

// Hook para obter dados únicos para filtros
export const useLeadsFilterData = () => {
  return useQuery({
    queryKey: ['leads-filter-data'],
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: 'always', // Sempre refazer query ao montar
    queryFn: async () => {
      console.log('🔍 [useLeadsFilterData] Iniciando busca de dados para filtros...');
      
      // Debug específico para mba-gestao-ia PRIMEIRO
      const { data: mbaCheck, error: mbaError } = await supabase
        .from('leads')
        .select('pagina_nome')
        .ilike('pagina_nome', '%mba-gestao-ia%');
      
      console.log('🎯 [DEBUG MBA] Leads encontrados:', mbaCheck?.length);
      mbaCheck?.forEach((lead, i) => {
        console.log(`🎯 [DEBUG MBA ${i+1}]`, lead.pagina_nome);
      });
      
      const { data, error } = await supabase
        .from('leads')
        .select('observacoes, pagina_nome, utm_source')
        .not('pagina_nome', 'is', null)
        .limit(50000);

      if (error) {
        console.error('❌ [useLeadsFilterData] Erro ao buscar dados:', error);
        throw error;
      }
      
      console.log('📊 [useLeadsFilterData] Total de leads com pagina_nome:', data?.length);
      
      // Extrair profissões únicas
      const profissoes = [...new Set(
        (data || []).map(item => {
          const match = item.observacoes?.match(/Profissão\/Área:\s*([^\n]+)/);
          return match ? match[1].trim() : null;
        }).filter(Boolean)
      )];

      // Extrair fontes únicas
      const fontes = [...new Set(
        (data || []).map(item => item.utm_source).filter(Boolean)
      )];

      // Usar a função normalizePageSlug consistentemente
      
      // Extrair slugs únicos usando a mesma função que o filtro
      console.log('🔧 [DEBUG] Processando slugs...');
      const slugsExtraidos = (data || [])
        .map((item, index) => {
          const slug = normalizePageSlug(item.pagina_nome);
          if (item.pagina_nome?.includes('mba-gestao-ia')) {
            console.log(`🎯 [DEBUG MBA SLUG ${index}] "${item.pagina_nome}" → "${slug}"`);
          }
          return slug;
        })
        .filter(Boolean);
      
      console.log('🔧 [DEBUG] Total de slugs extraídos:', slugsExtraidos.length);
      
      const paginasCaptura = [...new Set(slugsExtraidos)];
      console.log('🔧 [DEBUG] Páginas únicas após deduplicação:', paginasCaptura.length);
      
      // SEMPRE garantir que mba-gestao-ia apareça no filtro (forçado pelo usuário)
      if (!paginasCaptura.includes('mba-gestao-ia')) {
        paginasCaptura.push('mba-gestao-ia');
        console.log('➕ [FORÇADO] Adicionado mba-gestao-ia ao filtro');
      }
      
      console.log('✅ [useLeadsFilterData] Páginas únicas extraídas:', paginasCaptura.length);
      console.log('🎯 [useLeadsFilterData] Lista de páginas:', paginasCaptura.slice(0, 10));
      
      // Verificar especificamente se contém a página que o usuário mencionou
      const containsMbaGestao = paginasCaptura.includes('mba-gestao-ia');
      
      console.log('🔍 [useLeadsFilterData] Verificações específicas:');
      console.log('  ✓ mba-gestao-ia:', containsMbaGestao);
      
      // Debug para mba-gestao-ia
      const mbaPages = (data || []).filter(item => 
        item.pagina_nome?.includes('mba-gestao-ia')
      );
      console.log('🔍 [useLeadsFilterData] Leads com mba-gestao-ia encontrados:', mbaPages.length);
      mbaPages.slice(0, 3).forEach((page, index) => {
        const normalized = normalizePageSlug(page.pagina_nome);
        console.log(`  ${index + 1}. "${page.pagina_nome}" → "${normalized}"`);
      });
      
      console.log('🔚 [useLeadsFilterData] Retornando dados dos filtros');
      return { profissoes, paginasCaptura, fontes };
    },
  });
};

export const useAllLeads = () => {
  return useQuery({
    queryKey: ['all-leads'],
    queryFn: async () => {
      console.log('🔍 BUSCANDO TODOS OS LEADS PARA DASHBOARD...');
      // Buscar TODOS os leads usando paginação em lotes
      let allData: any[] = [];
      let startIndex = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase
          .from('leads')
          .select(`
            *,
            vendedor_atribuido_profile:profiles!vendedor_atribuido(name, email)
          `)
          .order('created_at', { ascending: false })
          .range(startIndex, startIndex + batchSize - 1);

        if (batchError) throw batchError;
        
        console.log(`📦 Lote ALL LEADS ${Math.floor(startIndex/batchSize) + 1}: ${batchData?.length || 0} leads`);
        
        if (batchData && batchData.length > 0) {
          allData = [...allData, ...batchData];
          startIndex += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`📊 TOTAL DE ALL LEADS BUSCADOS: ${allData.length}`);
      
      // Map to ensure all required fields are present
      const leads = allData.map(item => ({
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
