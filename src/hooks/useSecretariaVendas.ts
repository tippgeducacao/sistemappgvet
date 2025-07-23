
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FastUpdateService } from '@/services/vendas/FastUpdateService';
import { VendasDataService } from '@/services/vendas/VendasDataService';
import { CacheService } from '@/services/cache/CacheService';
import { useToast } from '@/hooks/use-toast';
import type { VendaCompleta } from '@/hooks/useVendas';

export const useSecretariaVendas = () => {
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const loadVendas = async () => {
    console.log('🚀 SecretariaVendas: Carregando vendas...');
    setIsLoading(true);
    
    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        setIsLoading(false);
        return;
      }

      console.log('👤 Usuário autenticado:', user.id, user.email);

      // Usar o serviço de dados que lida melhor com relacionamentos
      const vendasCarregadas = await VendasDataService.getAllVendas();
      
      console.log('✅ Vendas carregadas via serviço:', vendasCarregadas.length);
      setVendas(vendasCarregadas);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar vendas:', error);
      
      // Se for erro de relacionamento, tentar limpar cache
      if (error.message?.includes('relationship') || error.message?.includes('schema cache')) {
        console.log('🔄 Erro de relacionamento detectado, limpando cache...');
        CacheService.clearRelationshipCache();
        
        toast({
          title: 'Problema de Cache Detectado',
          description: 'Limpando cache. Tente novamente em alguns segundos.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar vendas: ' + error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (
    vendaId: string, 
    status: 'pendente' | 'matriculado' | 'desistiu',
    pontuacaoValidada?: number,
    motivoPendencia?: string
  ) => {
    setIsUpdating(true);
    console.log('⚡ SECRETARIA: Usando FastUpdateService para performance otimizada:', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      pontuacaoValidada,
      motivoPendencia
    });

    try {
      const success = await FastUpdateService.updateVendaStatus(
        vendaId, 
        status, 
        pontuacaoValidada,
        motivoPendencia
      );
      
      if (!success) {
        throw new Error('Falha na atualização rápida - função retornou false');
      }

      console.log('✅ SUCESSO! Status atualizado. Recarregando vendas...');
      
      // Aguardar um pouco antes de recarregar para garantir que a atualização foi processada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar vendas
      await loadVendas();
      
      toast({
        title: 'Sucesso',
        description: `Venda ${status === 'matriculado' ? 'aprovada' : status === 'pendente' ? 'marcada como pendente' : 'rejeitada'} com sucesso!`,
      });
      
    } catch (error: any) {
      console.error('❌ ERRO na atualização:', error);
      
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status da venda',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadVendas();
  }, []);

  const vendasPendentes = vendas.filter(v => v.status === 'pendente');
  const vendasMatriculadas = vendas.filter(v => v.status === 'matriculado');

  return {
    vendas,
    vendasPendentes,
    vendasMatriculadas,
    isLoading,
    isUpdating,
    updateStatus,
    refetch: loadVendas
  };
};
