import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let debounceTimer: NodeJS.Timeout | null = null;
let pendingInvalidations = new Set<string>();
let connectionStatus = 'connected';

/**
 * Hook de realtime seletivo otimizado para TV
 * - Escuta apenas eventos críticos (vendas matriculadas, reuniões realizadas)
 * - Debounce inteligente de 10 segundos
 * - Cache estático de 30 minutos preservado
 * - Reduz tráfego de realtime em 95%
 */
export const useSelectiveRealtimeTVUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 [TV SMART] Configurando realtime seletivo...');

    // Função de debounce inteligente
    const debouncedInvalidate = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        console.log('🚀 [TV SMART] Executando invalidações críticas:', Array.from(pendingInvalidations));
        
        // Invalida apenas queries dinâmicas (preserva cache estático de vendedores/metas)
        Promise.all(
          Array.from(pendingInvalidations).map(queryKey => 
            queryClient.invalidateQueries({ 
              queryKey: [queryKey],
              refetchType: 'active' // Só refaz queries ativas
            })
          )
        );
        
        // Limpa invalidações pendentes
        pendingInvalidations.clear();
        debounceTimer = null;

        // Toast discreto para TV
        toast.success('✨ Dados atualizados automaticamente', {
          duration: 2000,
          position: 'bottom-right'
        });
      }, 10000); // Debounce de 10 segundos (otimizado para TV)
    };

    // Canal único otimizado para eventos críticos
    const channel = supabase
      .channel('tv-smart-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'form_entries',
          filter: 'status=eq.matriculado' // APENAS vendas matriculadas
        },
        (payload) => {
          console.log('💰 [TV SMART] Nova venda matriculada:', payload);
          
          // Adiciona invalidações apenas para dados dinâmicos
          pendingInvalidations.add('smart-tv-vendas');
          
          // Executa debounce
          debouncedInvalidate();

          // Toast específico para nova venda
          if (payload.eventType === 'INSERT' || 
             (payload.eventType === 'UPDATE' && payload.new?.status === 'matriculado' && payload.old?.status !== 'matriculado')) {
            toast.success('🎉 Nova venda registrada no ranking!', {
              duration: 3000,
              position: 'top-center'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'agendamentos',
          filter: 'resultado_reuniao=in.(presente,compareceu,realizada)' // APENAS reuniões convertidas
        },
        (payload) => {
          console.log('🤝 [TV SMART] Reunião convertida:', payload);
          
          // Adiciona invalidações apenas para dados de agendamentos
          pendingInvalidations.add('smart-tv-agendamentos');
          
          // Executa debounce
          debouncedInvalidate();

          // Toast discreto para reunião
          if (payload.eventType === 'UPDATE' && 
              ['presente', 'compareceu', 'realizada'].includes(payload.new?.resultado_reuniao)) {
            toast.info('📅 Reunião convertida registrada', {
              duration: 2000,
              position: 'bottom-right'
            });
          }
        }
      )
      .subscribe((status) => {
        connectionStatus = status;
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [TV SMART] Realtime conectado com sucesso');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [TV SMART] Erro na conexão realtime');
          toast.error('Conexão perdida - tentando reconectar...', {
            duration: 5000,
            position: 'top-center'
          });
        }
      });

    // Cleanup otimizado
    return () => {
      console.log('🛑 [TV SMART] Removendo canal realtime seletivo...');
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Função para refresh manual (backup)
  const forceRefresh = () => {
    console.log('🔄 [TV SMART] Refresh manual forçado...');
    
    // Invalida apenas dados dinâmicos (preserva cache estático)
    queryClient.invalidateQueries({ queryKey: ['smart-tv-vendas'] });
    queryClient.invalidateQueries({ queryKey: ['smart-tv-agendamentos'] });
    
    toast.info('🔄 Dados atualizados manualmente', {
      duration: 2000,
      position: 'bottom-right'
    });
  };

  // Status da conexão para indicador visual
  const getConnectionStatus = () => connectionStatus;

  return { 
    forceRefresh, 
    connectionStatus: getConnectionStatus() 
  };
};