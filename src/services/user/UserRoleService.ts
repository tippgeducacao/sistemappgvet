
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'secretaria' | 'vendedor';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by: string | null;
}

export class UserRoleService {
  static async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Erro ao buscar roles do usuário:', error);
        return [];
      }
      
      return (data || []) as UserRole[];
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      return [];
    }
  }

  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', role)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao verificar role:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      return false;
    }
  }

  static async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin');
  }

  static async addRole(userId: string, role: AppRole): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.id;
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          created_by: createdBy
        });
      
      if (error) {
        console.error('Erro ao adicionar role:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar role:', error);
      return false;
    }
  }

  static async removeRole(userId: string, role: AppRole): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Erro ao remover role:', error);
      return false;
    }
  }
}
