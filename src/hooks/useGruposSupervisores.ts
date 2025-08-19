import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GrupoSupervisor {
  id: string;
  supervisor_id: string;
  nome_grupo: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  membros?: MembroGrupo[];
}

export interface MembroGrupo {
  id: string;
  grupo_id: string;
  usuario_id: string;
  created_at: string;
  created_by?: string;
  usuario?: {
    id: string;
    name: string;
    email: string;
    user_type: string;
    nivel?: string;
  };
}

export interface MetaMensalSupervisor {
  id: string;
  supervisor_id: string;
  grupo_id?: string;
  ano: number;
  mes: number;
  meta_vendas: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useGruposSupervisores = () => {
  const [grupos, setGrupos] = useState<GrupoSupervisor[]>([]);
  const [metas, setMetas] = useState<MetaMensalSupervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('grupos_supervisores')
        .select(`
          *,
          membros:membros_grupos_supervisores(
            *,
            usuario:profiles(
              id,
              name,
              email,
              user_type,
              nivel
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrupos(data as GrupoSupervisor[] || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGrupo = async (nome: string, descricao?: string, supervisorId?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .from('grupos_supervisores')
        .insert({
          supervisor_id: supervisorId || user.user.id,
          nome_grupo: nome,
          descricao,
          created_by: user.user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addMembroGrupo = async (grupoId: string, usuarioId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await (supabase as any)
        .from('membros_grupos_supervisores')
        .insert({
          grupo_id: grupoId,
          usuario_id: usuarioId,
          created_by: user.user.id
        });

      if (error) throw error;
      
      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Membro adicionado ao grupo!",
      });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro ao grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeMembroGrupo = async (grupoId: string, usuarioId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('membros_grupos_supervisores')
        .delete()
        .eq('grupo_id', grupoId)
        .eq('usuario_id', usuarioId);

      if (error) throw error;
      
      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Membro removido do grupo!",
      });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover membro do grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createMetaMensal = async (supervisorId: string, grupoId: string, ano: number, mes: number, metaVendas: number) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .from('metas_mensais_supervisores')
        .insert({
          supervisor_id: supervisorId,
          grupo_id: grupoId,
          ano,
          mes,
          meta_vendas: metaVendas,
          created_by: user.user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      setMetas(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Meta mensal criada com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar meta mensal",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  return {
    grupos,
    metas,
    loading,
    fetchGrupos,
    createGrupo,
    addMembroGrupo,
    removeMembroGrupo,
    createMetaMensal
  };
};