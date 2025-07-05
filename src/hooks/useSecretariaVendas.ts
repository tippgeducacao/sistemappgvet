import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecretariaUpdateService } from '@/services/vendas/SecretariaUpdateService';
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

      // Buscar as vendas sem o join com profiles para evitar o erro
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
        toast({
          title: 'Erro',
          description: 'Erro ao carregar vendas: ' + error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Vendas carregadas:', data?.length || 0);

      // Buscar informações dos vendedores separadamente
      const vendedorIds = [...new Set(data?.map(v => v.vendedor_id).filter(Boolean) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', vendedorIds);

      // Mapear as vendas com as informações dos vendedores
      const vendasMapeadas: VendaCompleta[] = (data || []).map(venda => {
        const vendedorProfile = profiles?.find(p => p.id === venda.vendedor_id);
        
        const vendaMapeada: VendaCompleta = {
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
          aluno: venda.aluno ? {
            id: venda.aluno.id,
            nome: venda.aluno.nome,
            email: venda.aluno.email,
            telefone: venda.aluno.telefone,
            crmv: venda.aluno.crmv
          } : null,
          curso: venda.curso ? {
            id: venda.curso.id,
            nome: venda.curso.nome
          } : null,
          vendedor: vendedorProfile ? {
            id: vendedorProfile.id,
            name: vendedorProfile.name,
            email: vendedorProfile.email
          } : undefined
        };
        
        return vendaMapeada;
      });
      
      setVendas(vendasMapeadas);
    } catch (error) {
      console.error('❌ Erro inesperado ao carregar vendas:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao carregar vendas',
        variant: 'destructive',
      });
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
    console.log('🎯 SECRETARIA: Iniciando atualização de status:', { 
      vendaId: vendaId.substring(0, 8), 
      status,
      pontuacaoValidada,
      motivoPendencia
    });

    try {
      const success = await SecretariaUpdateService.updateVendaStatus(
        vendaId, 
        status, 
        pontuacaoValidada,
        motivoPendencia
      );
      
      if (!success) {
        throw new Error('Falha na atualização - função retornou false');
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
    updateStatus: async (vendaId: string, status: 'pendente' | 'matriculado' | 'desistiu', pontuacaoValidada?: number, motivoPendencia?: string) => {
      setIsUpdating(true);
      try {
        const success = await SecretariaUpdateService.updateVendaStatus(vendaId, status, pontuacaoValidada, motivoPendencia);
        if (success) {
          await loadVendas();
          toast({
            title: 'Sucesso',
            description: `Venda ${status === 'matriculado' ? 'aprovada' : status === 'pendente' ? 'marcada como pendente' : 'rejeitada'} com sucesso!`,
          });
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar status da venda',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    refetch: loadVendas
  };
};
