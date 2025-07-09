import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'secretaria' | 'vendedor' | 'diretor';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by?: string;
}

export class UserRoleService {
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(role => ({
        ...role,
        role: role.role as AppRole
      }));
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      throw error;
    }
  }

  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', role)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar role:', error);
      return false;
    }
    
    return !!data;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin');
  }

  static async addRole(userId: string, role: AppRole): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) {
      console.error('Erro ao adicionar role:', error);
      return false;
    }
    
    return true;
  }

  static async removeRole(userId: string, role: AppRole): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    
    if (error) {
      console.error('Erro ao remover role:', error);
      return false;
    }
    
    return true;
  }
}
