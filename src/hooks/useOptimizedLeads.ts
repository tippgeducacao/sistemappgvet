import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  status: string;
  vendedor_atribuido?: string;
  sdr_id?: string;
  created_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  profissao?: string;
  pagina_captura?: string;
  fonte?: string;
}

interface LeadFilters {
  searchTerm?: string;
  statusFilter?: string;
  profissaoFilter?: string;
  paginaCapturaFilter?: string;
  fonteFilter?: string;
  dataInicio?: string;
  dataFim?: string;
}

const LEADS_PER_PAGE = 50; // Reduzido de 1000 para 50

/**
 * Hook otimizado para leads com paginação real
 * Reduz carregamento de 50.000 leads para páginas de 50
 */
export const useOptimizedLeads = (
  page: number = 1,
  filters: LeadFilters = {}
) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['optimized-leads', page, filters],
    queryFn: async () => {
      console.log(`🔍 [OTIMIZADO] Carregando leads - página ${page}...`);
      
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * LEADS_PER_PAGE, page * LEADS_PER_PAGE - 1);

      // Aplicar filtros
      if (filters.searchTerm) {
        query = query.or(`nome.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,whatsapp.ilike.%${filters.searchTerm}%`);
      }

      if (filters.statusFilter) {
        query = query.eq('status', filters.statusFilter);
      }

      if (filters.profissaoFilter) {
        query = query.eq('utm_content', filters.profissaoFilter); // profissao está mapeada em utm_content
      }

      if (filters.paginaCapturaFilter) {
        query = query.eq('utm_source', filters.paginaCapturaFilter); // pagina_captura está mapeada em utm_source
      }

      if (filters.fonteFilter) {
        query = query.eq('utm_medium', filters.fonteFilter); // fonte está mapeada em utm_medium
      }

      if (filters.dataInicio && filters.dataFim) {
        query = query.gte('created_at', filters.dataInicio).lte('created_at', filters.dataFim);
      }

      const { data: leads, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao carregar leads:', error);
        throw error;
      }

      console.log(`✅ [OTIMIZADO] Carregados ${leads?.length || 0} leads da página ${page}`);

      return {
        leads: leads || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / LEADS_PER_PAGE),
        currentPage: page,
        hasNextPage: page * LEADS_PER_PAGE < (count || 0),
        hasPreviousPage: page > 1
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  return {
    leads: data?.leads || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    isLoading,
    error
  };
};

/**
 * Hook otimizado para dados de filtros - carrega apenas dados únicos necessários
 */
export const useOptimizedLeadsFilterData = () => {
  return useQuery({
    queryKey: ['optimized-leads-filter-data'],
    queryFn: async () => {
      console.log('🔍 [OTIMIZADO] Carregando dados de filtros...');
      
      // Buscar apenas valores únicos para filtros - muito mais eficiente
      const [profissoesResult, paginasResult, fontesResult] = await Promise.all([
        supabase
          .from('leads')
          .select('utm_content')
          .not('utm_content', 'is', null)
          .limit(1000), // Limita a 1000 em vez de 50.000
        
        supabase
          .from('leads')
          .select('utm_source')
          .not('utm_source', 'is', null)
          .limit(1000),
        
        supabase
          .from('leads')
          .select('utm_medium')
          .not('utm_medium', 'is', null)
          .limit(1000)
      ]);

      // Extrair valores únicos
      const profissoes = [...new Set(profissoesResult.data?.map(item => item.utm_content).filter(Boolean))];
      const paginas = [...new Set(paginasResult.data?.map(item => item.utm_source).filter(Boolean))];
      const fontes = [...new Set(fontesResult.data?.map(item => item.utm_medium).filter(Boolean))];

      console.log(`✅ [OTIMIZADO] Filtros carregados - ${profissoes.length} profissões, ${paginas.length} páginas, ${fontes.length} fontes`);

      return {
        profissoes,
        paginasCaptura: paginas,
        fontes
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - dados de filtros mudam pouco
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
  });
};