
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
      // Use a query manual para evitar problemas de tipo com Supabase
      const { data, error } = await supabase
        .rpc('sql', {
          query: `SELECT * FROM user_roles WHERE user_id = '${userId}'`
        });
      
      if (error) {
        console.error('Erro ao buscar roles do usuário:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      return [];
    }
  }

  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    try {
      // Use a query manual para evitar problemas de tipo
      const { data, error } = await supabase
        .rpc('sql', {
          query: `SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = '${userId}' AND role = '${role}') as has_role`
        });
      
      if (error) {
        console.error('Erro ao verificar role:', error);
        return false;
      }
      
      return data?.[0]?.has_role || false;
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
        .rpc('sql', {
          query: `INSERT INTO user_roles (user_id, role, created_by) VALUES ('${userId}', '${role}', '${createdBy}') ON CONFLICT (user_id, role) DO NOTHING`
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
        .rpc('sql', {
          query: `DELETE FROM user_roles WHERE user_id = '${userId}' AND role = '${role}'`
        });
      
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
