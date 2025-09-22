import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * OTIMIZADA: Hook realtime com debounce e menos invalidações
 */
export const useOptimizedRealtimeVendas = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;

    const debouncedInvalidate = (queryKeys: string[][]) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }, 2000); // Debounce de 2 segundos
    };

    console.log('🔵 OTIMIZADA: Configurando realtime vendas');
    
    const channel = supabase
      .channel('vendas-realtime-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_entries'
        },
        (payload) => {
          console.log('🔵 OTIMIZADA: Mudança em vendas:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            toast.success('Nova venda registrada!');
          } else if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            if (newData?.status === 'matriculado') {
              toast.success('Venda aprovada!');
            }
          }

          // Invalidar apenas queries essenciais com debounce
          debouncedInvalidate([
            ['all-vendas'],
            ['simple-admin-vendas']
          ]);
        }
      )
      .subscribe();

    return () => {
      console.log('🔵 OTIMIZADA: Desconectando realtime vendas');
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    forceRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ['all-vendas'] });
      queryClient.invalidateQueries({ queryKey: ['simple-admin-vendas'] });
    }
  };
};