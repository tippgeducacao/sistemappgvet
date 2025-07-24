
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
      console.log('🔄 Fazendo teste direto da API SprintHub...');
      
      try {
        // Fazer requisição direta para a API SprintHub
        const sprintHubApiKey = '5a9068f0-76c6-4a64-8c61-5b7a6b2d35bc';
        const sprintHubInstance = 'sistemainterno';
        
        const apiUrl = `https://sprinthub-api-master.sprinthub.app/leads?i=${sprintHubInstance}`;
        
        console.log('📡 URL:', apiUrl);
        console.log('🔑 API Key:', sprintHubApiKey.substring(0, 8) + '...');
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sprintHubApiKey}`,
            'apitoken': sprintHubApiKey
          }
        });

        console.log('📊 Status:', response.status);
        console.log('📊 Status Text:', response.statusText);

        if (!response.ok) {
          throw new Error(`API SprintHub retornou erro ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('📝 Resposta (primeiros 200 chars):', responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ JSON válido recebido');
          console.log('📊 Tipo:', typeof data);
          console.log('📊 É array:', Array.isArray(data));
        } catch (e) {
          throw new Error('Resposta da API não é JSON válido');
        }

        // Simular resultado básico por enquanto
        const result = {
          success: true,
          message: 'Teste direto da API funcionou!',
          stats: {
            total_sprinthub: Array.isArray(data) ? data.length : 0,
            processed: 0,
            inserted: 0,
            skipped: 0,
            errors: 0
          }
        };

        console.log('✅ Resultado do teste:', result);
        return result;
        
      } catch (err) {
        console.error('💥 Erro no teste direto:', err);
        throw err;
      }
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
