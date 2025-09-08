import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyCommissionData {
  id: string;
  user_id: string;
  user_type: 'vendedor' | 'sdr' | 'supervisor';
  ano: number;
  semana: number;
  pontos: number;
  meta: number;
  percentual: number;
  multiplicador: number;
  variavel: number;
  valor: number;
  regra_id?: string;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export const useWeeklyCommission = (
  userId: string, 
  userType: 'vendedor' | 'sdr' | 'supervisor',
  ano: number, 
  semana: number,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['weekly-commission', userId, userType, ano, semana],
    queryFn: async (): Promise<WeeklyCommissionData | null> => {
      console.log(`🔍 Buscando comissionamento: ${userType} ${userId} - ${ano}S${semana}`);
      
      // 1. Tentar buscar no cache primeiro
      const { data: cached, error } = await supabase
        .from('comissionamentos_semanais')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('ano', ano)
        .eq('semana', semana)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar comissionamento:', error);
        throw error;
      }

      // 2. Se encontrou no cache e não é muito antigo (< 1 hora), retorna
      if (cached) {
        const cacheAge = Date.now() - new Date(cached.calculated_at).getTime();
        const isRecent = cacheAge < 60 * 60 * 1000; // 1 hora
        
        console.log(`📋 Comissionamento encontrado no cache (${Math.round(cacheAge / 1000 / 60)}min atrás)`);
        
        if (isRecent) {
          return cached as WeeklyCommissionData;
        }
      }

      // 3. Se não encontrou ou está antigo, recalcular em background
      console.log(`🔄 Iniciando recálculo em background...`);
      
      supabase.functions.invoke('recalc-weekly-commissions', {
        body: {
          scope: 'user-week',
          userId,
          userType,
          ano,
          semana
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ Erro no recálculo:', error);
        } else {
          console.log('✅ Recálculo concluído:', data);
          // Invalidar cache para forçar refresh
          queryClient.invalidateQueries({ 
            queryKey: ['weekly-commission', userId, userType, ano, semana] 
          });
        }
      });

      // 4. Retornar dados do cache (mesmo se antigo) ou null
      return cached as WeeklyCommissionData || null;
    },
    enabled: enabled && !!userId && !!ano && !!semana,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useBatchWeeklyCommissions = (
  users: Array<{ id: string; type: 'vendedor' | 'sdr' | 'supervisor' }>,
  ano: number,
  semana: number, // Se for 0, busca todas as semanas do ano
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['batch-weekly-commissions', users.map(u => u.id).join(','), ano, semana || 'all'],
    queryFn: async (): Promise<WeeklyCommissionData[]> => {
      if (!users.length) return [];

      console.log(`🔍 Buscando ${users.length} comissionamentos em lote: ${ano}${semana ? `S${semana}` : ' (todas semanas)'}`);

      const userIds = users.map(u => u.id);
      
      // Query builder
      let query = supabase
        .from('comissionamentos_semanais')
        .select('*')
        .in('user_id', userIds)
        .eq('ano', ano);
      
      // Se semana específica, filtrar por ela
      if (semana > 0) {
        query = query.eq('semana', semana);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar comissionamentos em lote:', error);
        throw error;
      }

      const found = data || [];
      console.log('📊 Comissionamentos encontrados no cache:', found.length);

      // Se não encontrou dados suficientes, disparar recálculo
      if (found.length === 0 && users.length > 0) {
        console.log(`🔄 Cache vazio, iniciando recálculo...`);
        
        // Para uma única semana
        if (semana > 0) {
          users.forEach(user => {
            supabase.functions.invoke('recalc-weekly-commissions', {
              body: {
                scope: 'user-week',
                userId: user.id,
                userType: user.type,
                ano,
                semana
              }
            }).then(({ error }) => {
              if (error) console.error('❌ Erro no recálculo:', error);
              else {
                console.log(`✅ Recálculo iniciado para ${user.id} - ${ano}S${semana}`);
                // Invalidar e refetch após recálculo
                setTimeout(() => {
                  queryClient.invalidateQueries({ 
                    queryKey: ['batch-weekly-commissions', users.map(u => u.id).join(','), ano, semana || 'all'] 
                  });
                }, 2000);
              }
            });
          });
        } else {
          // Para todas as semanas - usar user-month para cada usuário
          users.forEach(user => {
            supabase.functions.invoke('recalc-weekly-commissions', {
              body: {
                scope: 'user-month',
                userId: user.id,
                userType: user.type,
                ano,
                mes: new Date().getMonth() + 1 // Mês atual
              }
            }).then(({ error }) => {
              if (error) console.error('❌ Erro no recálculo mensal:', error);
              else {
                console.log(`✅ Recálculo mensal iniciado para ${user.id} - ${ano}`);
                // Invalidar e refetch após recálculo
                setTimeout(() => {
                  queryClient.invalidateQueries({ 
                    queryKey: ['batch-weekly-commissions', users.map(u => u.id).join(','), ano, semana || 'all'] 
                  });
                }, 3000);
              }
            });
          });
        }
      }

      return found as WeeklyCommissionData[];
    },
    enabled: enabled && users.length > 0 && !!ano,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useRecalcCurrentWeekAll = () => {
  const queryClient = useQueryClient();

  const recalculate = async () => {
    console.log('🔄 Recalculando comissionamentos da semana atual para todos...');
    
    const { data, error } = await supabase.functions.invoke('recalc-weekly-commissions', {
      body: { scope: 'current-week-all' }
    });

    if (error) {
      console.error('❌ Erro no recálculo geral:', error);
      throw error;
    }

    console.log('✅ Recálculo geral concluído:', data);
    
    // Invalidar todos os caches de comissionamento
    queryClient.invalidateQueries({ queryKey: ['weekly-commission'] });
    queryClient.invalidateQueries({ queryKey: ['batch-weekly-commissions'] });
    
    return data;
  };

  return { recalculate };
};