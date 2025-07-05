import { supabase } from '@/integrations/supabase/client';

export class UserService {
  static async getProfile(userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }
  }

  static async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        user_id: userId,
        role_name: role
      });

      if (error) {
        console.error('Erro ao verificar role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      return false;
    }
  }

  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: userId
      });

      if (error) {
        console.error('Erro ao verificar admin:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  }
}
