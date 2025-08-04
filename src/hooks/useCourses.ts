
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CoursesService, Course } from '@/services/coursesService';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isDiretor } = useUserRoles();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Diretores podem ver todos os cursos (ativos e inativos)
      const data = isDiretor 
        ? await CoursesService.fetchAllCourses()
        : await CoursesService.fetchActiveCourses();
      setCourses(data);
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

  const addCourse = async (nome: string, modalidade: 'Curso' | 'Pós-Graduação' = 'Curso') => {
    try {
      const newCourse = await CoursesService.addCourse(nome, modalidade);
      setCourses(prev => [...prev, newCourse]);
      toast({
        title: "Sucesso",
        description: `${modalidade} adicionado com sucesso!`,
      });
      return newCourse;
    } catch (error) {
      console.error('Erro ao adicionar curso:', error);
      toast({
        title: "Erro",
        description: `Erro ao adicionar ${modalidade.toLowerCase()}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchCoursesByModalidade = async (modalidade: 'Curso' | 'Pós-Graduação') => {
    try {
      setLoading(true);
      const data = await CoursesService.fetchCoursesByModalidade(modalidade);
      return data;
    } catch (error) {
      console.error('Erro ao buscar cursos por modalidade:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar ${modalidade.toLowerCase()}s`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id: string, nome: string) => {
    try {
      const updatedCourse = await CoursesService.updateCourse(id, nome);
      setCourses(prev => prev.map(course => 
        course.id === id ? updatedCourse : course
      ));
      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso!",
      });
      return updatedCourse;
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar curso",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleCourseStatus = async (id: string) => {
    try {
      const updatedCourse = await CoursesService.toggleCourseStatus(id);
      setCourses(prev => prev.map(course => 
        course.id === id ? updatedCourse : course
      ));
      toast({
        title: "Sucesso",
        description: `Curso ${updatedCourse.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });
      return updatedCourse;
    } catch (error) {
      console.error('Erro ao alterar status do curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do curso",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeCourse = async (id: string) => {
    try {
      // Verificar se há vendas associadas primeiro
      const { data: vendas } = await supabase
        .from('form_entries')
        .select('id')
        .eq('curso_id', id)
        .limit(1);

      const hasVendas = vendas && vendas.length > 0;
      
      await CoursesService.removeCourse(id);
      
      if (hasVendas) {
        // Se tinha vendas, foi apenas desativado
        setCourses(prev => prev.map(course => 
          course.id === id ? { ...course, ativo: false } : course
        ));
        toast({
          title: "Sucesso",
          description: "Curso desativado! (Não foi possível excluir pois há vendas associadas)",
        });
      } else {
        // Se não tinha vendas, foi excluído
        setCourses(prev => prev.filter(course => course.id !== id));
        toast({
          title: "Sucesso",
          description: "Curso excluído permanentemente!",
        });
      }
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
    fetchCourses();
  }, [isDiretor]);

  return {
    courses,
    loading,
    fetchCourses,
    fetchCoursesByModalidade,
    addCourse,
    updateCourse,
    toggleCourseStatus,
    removeCourse,
    isDiretor,
  };
};
