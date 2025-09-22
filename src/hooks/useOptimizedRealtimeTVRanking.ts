import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let debounceTimer: NodeJS.Timeout | null = null;
let pendingInvalidations = new Set<string>();

/**
 * Hook otimizado para realtime com debounce e consolidação de canais
 * Reduz tráfego de realtime de 4 canais para 1 canal com debounce
 */
export const useOptimizedRealtimeTVRanking = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 [OTIMIZADO] Configurando canal realtime único...');

    // Função de debounce para invalidações
    const debouncedInvalidate = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        console.log('🚀 [OTIMIZADO] Executando invalidações consolidadas:', Array.from(pendingInvalidations));
        
        // Executa todas as invalidações pendentes
        Promise.all(
          Array.from(pendingInvalidations).map(queryKey => 
            queryClient.invalidateQueries({ queryKey: [queryKey] })
          )
        );
        
        // Limpa invalidações pendentes
        pendingInvalidations.clear();
        debounceTimer = null;
      }, 3000); // Debounce de 3 segundos
    };

    // Canal único consolidado
    const channel = supabase
      .channel('tv-ranking-optimized')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_entries'
        },
        (payload) => {
          console.log('📊 [OTIMIZADO] Mudança em form_entries:', payload);
          
          // Adiciona invalidações necessárias
          pendingInvalidations.add('all-vendas');
          pendingInvalidations.add('simple-admin-vendas');
          pendingInvalidations.add('vendas');
          
          // Executa debounce
          debouncedInvalidate();

          // Toast apenas para eventos importantes
          if (payload.eventType === 'INSERT') {
            toast.success('✨ Nova venda registrada!');
          } else if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            const status = payload.new?.status;
            toast.info(`📈 Status de venda atualizado: ${status}`);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'agendamentos'
        },
        (payload) => {
          console.log('📅 [OTIMIZADO] Mudança em agendamentos:', payload);
          
          // Adiciona invalidações necessárias
          pendingInvalidations.add('agendamentos');
          pendingInvalidations.add('agendamentos-stats');
          
          // Executa debounce
          debouncedInvalidate();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🛑 [OTIMIZADO] Removendo canal realtime otimizado...');
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Função para forçar refresh manual (se necessário)
  const forceRefresh = () => {
    console.log('🔄 [OTIMIZADO] Forçando refresh manual...');
    
    queryClient.invalidateQueries({ queryKey: ['all-vendas'] });
    queryClient.invalidateQueries({ queryKey: ['simple-admin-vendas'] });
    queryClient.invalidateQueries({ queryKey: ['vendas'] });
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
  };

  return { forceRefresh };
};