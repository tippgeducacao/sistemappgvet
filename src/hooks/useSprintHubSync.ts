
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    total_sprinthub: number;
    processed: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
}

export const useSprintHubSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      console.log('🔄 Iniciando sincronização com SprintHub...');
      
      const { data, error } = await supabase.functions.invoke('sync-sprinthub-leads');

      if (error) {
        console.error('❌ Erro na sincronização:', error);
        
        // Melhorar mensagem de erro baseada no tipo
        let errorMessage = 'Erro na sincronização com SprintHub';
        
        if (error.message?.includes('API Key')) {
          errorMessage = 'Erro de autenticação: Verifique sua API Key do SprintHub';
        } else if (error.message?.includes('instância')) {
          errorMessage = 'Erro de configuração: Verifique o nome da instância do SprintHub';
        } else if (error.message?.includes('não configuradas')) {
          errorMessage = 'Configuração incompleta: Verifique as variáveis SPRINTHUB_API_KEY e SPRINTHUB_INSTANCE';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('Nenhuma resposta recebida da API');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na sincronização');
      }

      return data;
    },
    onSuccess: (result) => {
      // Invalidar queries para atualizar a lista de leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      const { stats } = result;
      
      if (stats.inserted > 0) {
        toast.success(
          `✅ Sincronização concluída! ${stats.inserted} novos leads importados do SprintHub`,
          {
            description: `Processados: ${stats.processed} | Ignorados: ${stats.skipped} | Erros: ${stats.errors}`,
            duration: 5000
          }
        );
      } else {
        toast.info(
          '📊 Sincronização concluída - Nenhum lead novo encontrado',
          {
            description: `Total analisados: ${stats.total_sprinthub} | Já existentes: ${stats.skipped}`,
            duration: 4000
          }
        );
      }

      console.log('✅ Sincronização bem-sucedida:', stats);
    },
    onError: (error: Error) => {
      console.error('💥 Erro na sincronização:', error);
      
      toast.error(
        'Erro na sincronização com SprintHub',
        {
          description: error.message,
          duration: 6000
        }
      );
    },
  });
};
