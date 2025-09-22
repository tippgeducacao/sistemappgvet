import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeTVRanking = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔴 Configurando realtime para TV Ranking');

    // Canal para escutar mudanças nas tabelas críticas
    const channel = supabase
      .channel('tv-ranking-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'form_entries'
        },
        (payload) => {
          console.log('🔴 Mudança detectada em form_entries:', payload);
          
          // Invalidar queries relacionadas a vendas
          queryClient.invalidateQueries({ queryKey: ['all-vendas'] });
          queryClient.invalidateQueries({ queryKey: ['vendas'] });
          
          // Toast discreto para mudanças importantes
          if (payload.eventType === 'INSERT') {
            toast.success('Nova venda registrada!', { duration: 2000 });
          } else if (payload.eventType === 'UPDATE' && payload.new?.status !== payload.old?.status) {
            toast.success('Status de venda atualizado!', { duration: 2000 });
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
          console.log('🔴 Mudança detectada em agendamentos:', payload);
          
          // Invalidar queries relacionadas a agendamentos
          queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
          queryClient.invalidateQueries({ queryKey: ['agendamentos-sdr'] });
          queryClient.invalidateQueries({ queryKey: ['all-agendamentos'] });
          
          // Toast para mudanças em resultado de reunião
          if (payload.eventType === 'UPDATE' && payload.new?.resultado_reuniao !== payload.old?.resultado_reuniao) {
            if (payload.new?.resultado_reuniao === 'comprou') {
              toast.success('Reunião converteu em venda!', { duration: 2000 });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('🔴 Mudança detectada em profiles:', payload);
          
          // Invalidar queries relacionadas a vendedores
          queryClient.invalidateQueries({ queryKey: ['vendedores'] });
          queryClient.invalidateQueries({ queryKey: ['vendedores-only'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metas_semanais_vendedores'
        },
        (payload) => {
          console.log('🔴 Mudança detectada em metas_semanais_vendedores:', payload);
          
          // Invalidar queries relacionadas a metas
          queryClient.invalidateQueries({ queryKey: ['metas-semanais'] });
          
          if (payload.eventType === 'UPDATE') {
            toast.success('Meta semanal atualizada!', { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Status do canal realtime TV Ranking:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime TV Ranking ativo');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no canal realtime TV Ranking');
        }
      });

    // Cleanup
    return () => {
      console.log('🔴 Desconectando realtime TV Ranking');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    // Função para forçar atualização manual se necessário
    forceRefresh: () => {
      console.log('🔴 Forçando refresh manual TV Ranking');
      queryClient.invalidateQueries({ queryKey: ['all-vendas'] });
      queryClient.invalidateQueries({ queryKey: ['vendedores'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['metas-semanais'] });
    }
  };
};