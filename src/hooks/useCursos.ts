
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Curso {
  id: string;
  nome: string;
  modalidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  criado_por?: string;
}

export const useCursos = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarCurso = async (nome: string) => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .insert([{ nome }])
        .select()
        .single();

      if (error) throw error;
      
      setCursos(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Curso adicionado com sucesso!",
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao adicionar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar curso",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removerCurso = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cursos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      
      setCursos(prev => prev.filter(curso => curso.id !== id));
      toast({
        title: "Sucesso",
        description: "Curso removido com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover curso",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  return {
    cursos,
    loading,
    fetchCursos,
    adicionarCurso,
    removerCurso,
  };
};
