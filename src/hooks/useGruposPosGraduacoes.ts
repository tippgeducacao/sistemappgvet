import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GrupoPosGraduacao {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  cursos?: Array<{
    id: string;
    nome: string;
  }>;
}

export interface CursoDisponivel {
  id: string;
  nome: string;
}

export const useGruposPosGraduacoes = () => {
  const [grupos, setGrupos] = useState<GrupoPosGraduacao[]>([]);
  const [cursosDisponiveis, setCursosDisponiveis] = useState<CursoDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      
      // Buscar grupos com seus cursos
      const { data: gruposData, error: gruposError } = await supabase
        .from('grupos_pos_graduacoes')
        .select(`
          *,
          grupos_pos_graduacoes_cursos (
            curso_id,
            cursos (
              id,
              nome
            )
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (gruposError) throw gruposError;

      // Transformar os dados
      const gruposFormatados = (gruposData || []).map(grupo => ({
        ...grupo,
        cursos: grupo.grupos_pos_graduacoes_cursos?.map((rel: any) => rel.cursos) || []
      }));

      setGrupos(gruposFormatados);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos de pós-graduações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCursosDisponiveis = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nome')
        .eq('ativo', true)
        .eq('modalidade', 'Pós-Graduação')
        .order('nome');

      if (error) throw error;
      setCursosDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar cursos disponíveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos disponíveis",
        variant: "destructive",
      });
    }
  };

  const criarGrupo = async (nome: string, descricao?: string, cursosIds: string[] = []) => {
    try {
      // Criar grupo
      const { data: grupo, error: grupoError } = await supabase
        .from('grupos_pos_graduacoes')
        .insert([{ nome, descricao }])
        .select()
        .single();

      if (grupoError) throw grupoError;

      // Adicionar cursos ao grupo
      if (cursosIds.length > 0) {
        const cursosRelations = cursosIds.map(cursoId => ({
          grupo_id: grupo.id,
          curso_id: cursoId
        }));

        const { error: cursosError } = await supabase
          .from('grupos_pos_graduacoes_cursos')
          .insert(cursosRelations);

        if (cursosError) throw cursosError;
      }

      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });

      return grupo;
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

  const editarGrupo = async (id: string, nome: string, descricao?: string, cursosIds: string[] = []) => {
    try {
      // Atualizar grupo
      const { error: grupoError } = await supabase
        .from('grupos_pos_graduacoes')
        .update({ nome, descricao })
        .eq('id', id);

      if (grupoError) throw grupoError;

      // Remover cursos antigos
      const { error: removeError } = await supabase
        .from('grupos_pos_graduacoes_cursos')
        .delete()
        .eq('grupo_id', id);

      if (removeError) throw removeError;

      // Adicionar novos cursos
      if (cursosIds.length > 0) {
        const cursosRelations = cursosIds.map(cursoId => ({
          grupo_id: id,
          curso_id: cursoId
        }));

        const { error: cursosError } = await supabase
          .from('grupos_pos_graduacoes_cursos')
          .insert(cursosRelations);

        if (cursosError) throw cursosError;
      }

      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao editar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao editar grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const excluirGrupo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grupos_pos_graduacoes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      await fetchGrupos();
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir grupo",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGrupos();
    fetchCursosDisponiveis();
  }, []);

  return {
    grupos,
    cursosDisponiveis,
    loading,
    fetchGrupos,
    fetchCursosDisponiveis,
    criarGrupo,
    editarGrupo,
    excluirGrupo,
  };
};