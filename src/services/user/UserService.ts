import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/services/auth/AuthService';

export class UserService {
  static async fetchProfile(userId: string): Promise<Profile | null> {
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

      return data as Profile;
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      return null;
    }
  }

  static async verifyAndFixProfile(userId: string, expectedType: 'secretaria' | 'vendedor'): Promise<void> {
    try {
      const profile = await this.fetchProfile(userId);

      if (!profile || profile.user_type !== expectedType) {
        console.warn(`Perfil inconsistente encontrado (tipo errado ou inexistente), corrigindo...`);

        const user = (await supabase.auth.getUser()).data.user;
        const email = user?.email || '';
        const name = user?.user_metadata?.name || 'Sem nome';

        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              email: email,
              name: name,
              user_type: expectedType,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.error('Erro ao criar/atualizar perfil:', error);
        } else {
          console.log('Perfil corrigido/criado com sucesso!');
        }
      } else {
        console.log('Perfil consistente, nenhuma correção necessária.');
      }
    } catch (error) {
      console.error('Erro durante a verificação/correção do perfil:', error);
    }
  }

  static isSecretary(user: any): boolean {
    return user?.user_type === 'secretaria';
  }

  static isVendedor(user: any): boolean {
    return user?.user_type === 'vendedor';
  }

  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_admin', { _user_id: userId });
    
    if (error) {
      console.error('Erro ao verificar se é admin:', error);
      return false;
    }
    
    return data || false;
  }

  static async hasRole(userId: string, role: 'admin' | 'secretaria' | 'vendedor'): Promise<boolean> {
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
}
