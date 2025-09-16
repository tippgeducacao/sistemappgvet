import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgendamentoLinkingService } from '@/services/agendamentos/AgendamentoLinkingService';
import { toast } from 'sonner';

/**
 * Executa a vinculação automática de agendamentos → vendas de forma silenciosa,
 * com throttling por sessão para evitar chamadas excessivas.
 *
 * Regras:
 * - Roda no mount do consumidor
 * - Só roda novamente após 30 minutos (por aba) via sessionStorage
 * - Invalida caches relevantes quando houver alterações
 */
export const useAutoAgendamentoVinculacao = () => {
  const queryClient = useQueryClient();
  const hasRunRef = useRef(false);

  const { mutateAsync } = useMutation({
    mutationFn: AgendamentoLinkingService.vincularAgendamentosVendas,
    onSuccess: (results) => {
      const sucessos = results.filter(r => r.success).length;
      const falhas = results.filter(r => !r.success).length;

      // Invalidar caches somente quando houve mudanças
      if (sucessos > 0) {
        queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        queryClient.invalidateQueries({ queryKey: ['vendas'] });
        queryClient.invalidateQueries({ queryKey: ['agendamentos-sem-vinculo'] });
      }

      // Notificação discreta apenas quando houver itens processados
      if (sucessos > 0 || falhas > 0) {
        toast.success(
          `Vinculação automática: ${sucessos} atualizações` + (falhas ? `, ${falhas} sem correspondência` : '')
        );
      }
    },
    onError: (error: any) => {
      console.error('Erro ao vincular agendamentos automaticamente:', error);
    }
  });

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const KEY = 'last-agendamento-linking-run-at';
    const THROTTLE_MS = 30 * 60 * 1000; // 30 min

    try {
      const lastRun = sessionStorage.getItem(KEY);
      const now = Date.now();
      if (lastRun && now - Number(lastRun) < THROTTLE_MS) {
        return; // ainda dentro da janela de throttling
      }

      // Executar vinculação automática
      mutateAsync()
        .catch(() => {/* já tratado no onError */})
        .finally(() => sessionStorage.setItem(KEY, String(now)));
    } catch (e) {
      // sessionStorage pode falhar em alguns contextos; apenas ignora e tenta rodar
      mutateAsync().catch(() => {/* noop */});
    }
  }, [mutateAsync]);
};
