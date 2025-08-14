
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
          alunos!form_entries_aluno_id_fkey(*),
          cursos(*),
          profiles!form_entries_vendedor_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar vendas:', error);
        return;
      }

      console.log('✅ Vendas carregadas:', data?.length || 0);
      console.log('🔍 DEBUG: Primeira venda completa:', JSON.stringify(data?.[0], null, 2));
      
      // Debug específico para campos de data
      data?.forEach((venda, index) => {
        console.log(`🔍 Venda ${index + 1} (${venda.id?.substring(0, 8)}):`, {
          status: venda.status,
          data_assinatura_contrato: venda.data_assinatura_contrato,
          data_aprovacao: venda.data_aprovacao,
          created_at: venda.created_at,
          enviado_em: venda.enviado_em
        });
      });
      const vendasMapeadas: VendaCompleta[] = (data || []).map(venda => {
        const aluno = Array.isArray(venda.alunos) ? venda.alunos[0] : venda.alunos;
        const vendedorProfile = Array.isArray(venda.profiles) ? venda.profiles[0] : venda.profiles;
        
        return {
          id: venda.id,
          vendedor_id: venda.vendedor_id,
          curso_id: venda.curso_id || '',
          observacoes: venda.observacoes || '',
          status: (venda.status as 'pendente' | 'matriculado' | 'desistiu') || 'pendente',
          pontuacao_esperada: venda.pontuacao_esperada || 0,
          pontuacao_validada: venda.pontuacao_validada,
          enviado_em: venda.created_at || new Date().toISOString(),
          atualizado_em: venda.atualizado_em || venda.created_at || new Date().toISOString(),
          motivo_pendencia: venda.motivo_pendencia,
          data_assinatura_contrato: venda.data_assinatura_contrato || null,
          data_aprovacao: venda.data_aprovacao || null,
          documento_comprobatorio: venda.documento_comprobatorio || null,
          aluno: aluno ? {
            id: aluno.id,
            nome: aluno.nome,
            email: aluno.email,
            telefone: aluno.telefone,
            crmv: aluno.crmv
          } : null,
          curso: venda.cursos ? {
            id: venda.cursos.id,
            nome: venda.cursos.nome
          } : null,
          vendedor: vendedorProfile ? {
            id: venda.vendedor_id,
            name: vendedorProfile.name,
            email: vendedorProfile.email
          } : null
        };
      });
      
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
