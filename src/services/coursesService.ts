
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  nome: string;
  modalidade: 'Curso' | 'Pós-Graduação';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  criado_por?: string;
}

export class CoursesService {
  static async fetchActiveCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) throw error;
    return (data || []) as Course[];
  }

  static async fetchAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('nome');

    if (error) throw error;
    return (data || []) as Course[];
  }

  static async addCourse(nome: string, modalidade: 'Curso' | 'Pós-Graduação' = 'Curso'): Promise<Course> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('cursos')
      .insert([{ nome, modalidade, criado_por: user?.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  }

  static async fetchCoursesByModalidade(modalidade: 'Curso' | 'Pós-Graduação'): Promise<Course[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('ativo', true)
      .eq('modalidade', modalidade)
      .order('nome');

    if (error) throw error;
    return (data || []) as Course[];
  }

  static async updateCourse(id: string, nome: string): Promise<Course> {
    const { data, error } = await supabase
      .from('cursos')
      .update({ nome, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  }

  static async toggleCourseStatus(id: string): Promise<Course> {
    // Primeiro buscar o status atual
    const { data: currentCourse, error: fetchError } = await supabase
      .from('cursos')
      .select('ativo')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Atualizar para o status oposto
    const { data, error } = await supabase
      .from('cursos')
      .update({ ativo: !currentCourse.ativo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Course;
  }

  static async removeCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
