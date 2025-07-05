
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
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      return [];
    }
    
    return data || [];
  }

  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_role', { 
        _user_id: userId, 
        _role: role 
      });
    
    if (error) {
      console.error('Erro ao verificar role:', error);
      return false;
    }
    
    return data || false;
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_admin', { 
        _user_id: userId 
      });
    
    if (error) {
      console.error('Erro ao verificar se é admin:', error);
      return false;
    }
    
    return data || false;
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
