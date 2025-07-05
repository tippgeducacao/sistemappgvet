
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UltraSimpleUpdateService } from '@/services/vendas/UltraSimpleUpdateService';
import { useToast } from '@/hooks/use-toast';
import type { VendaCompleta } from '@/hooks/useVendas';

export const useUltraSimpleVendas = () => {
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const loadVendas = async () => {
    console.log('🚀 Carregando vendas...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('form_entries')
        .select(`
          *,
          aluno:alunos!form_entries_aluno_id_fkey(*),
          curso:cursos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar vendas:', error);
        return;
      }

      console.log('✅ Vendas carregadas:', data?.length || 0);
      
      const vendasMapeadas: VendaCompleta[] = (data || []).map(venda => {
        console.log(`📝 Processando venda ${venda.id.substring(0, 8)} - Status: ${venda.status}`);
        
        return {
          id: venda.id,
          vendedor_id: venda.vendedor_id,
          curso_id: venda.curso_id || '',
          observacoes: venda.observacoes || '',
          status: (venda.status as 'pendente' | 'matriculado' | 'desistiu') || 'pendente',
          pontuacao_esperada: venda.pontuacao_esperada || 0,
          pontuacao_validada: venda.pontuacao_validada,
          enviado_em: venda.enviado_em || venda.created_at || '',
          atualizado_em: venda.atualizado_em || '',
          motivo_pendencia: venda.motivo_pendencia,
          aluno: venda.aluno && typeof venda.aluno === 'object' && venda.aluno !== null && 'id' in venda.aluno ? {
            id: venda.aluno.id,
            nome: venda.aluno.nome || '',
            email: venda.aluno.email || '',
            telefone: venda.aluno.telefone || '',
            crmv: venda.aluno.crmv || ''
          } : null,
          curso: venda.curso && typeof venda.curso === 'object' && venda.curso !== null && 'id' in venda.curso ? {
            id: venda.curso.id,
            nome: venda.curso.nome || ''
          } : null,
          vendedor: undefined
        };
      });
      
      console.log('🎯 Vendas mapeadas:', vendasMapeadas.length);
      setVendas(vendasMapeadas);
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (vendaId: string, status: 'matriculado' | 'desistiu') => {
    setIsUpdating(true);
    console.log('🎯 INICIANDO ATUALIZAÇÃO DEFINITIVA:', { vendaId: vendaId.substring(0, 8), status });

    try {
      // Tentar atualizar no banco com diagnóstico completo
      const success = await UltraSimpleUpdateService.updateVenda(vendaId, status);
      
      if (!success) {
        throw new Error('Todas as tentativas de atualização falharam');
      }

      console.log('✅ SUCESSO! Recarregando lista...');
      
      // Recarregar IMEDIATAMENTE após sucesso
      await loadVendas();
      
      toast({
        title: 'Sucesso',
        description: `Venda ${status === 'matriculado' ? 'aprovada' : 'rejeitada'} com sucesso!`,
      });
      
    } catch (error) {
      console.error('❌ FALHA TOTAL na atualização:', error);
      
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da venda',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadVendas();
  }, []);

  const vendasPendentes = vendas.filter(v => {
    const isPendente = v.status === 'pendente';
    console.log(`🔍 Venda ${v.id.substring(0, 8)} - Status: ${v.status}, É pendente: ${isPendente}`);
    return isPendente;
  });
  
  const vendasMatriculadas = vendas.filter(v => v.status === 'matriculado');

  console.log('📈 Total vendas:', vendas.length);
  console.log('⏳ Vendas pendentes:', vendasPendentes.length);
  console.log('✅ Vendas matriculadas:', vendasMatriculadas.length);

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
