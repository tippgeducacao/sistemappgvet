
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  error: any;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  user_type: 'secretaria' | 'vendedor';
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      // Validações básicas
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Formato de email inválido' } };
      }

      if (!password || password.trim().length === 0) {
        return { error: { message: 'Senha é obrigatória' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        let friendlyMessage = 'Erro no login';
        
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Por favor, confirme seu email antes de fazer login.';
        } else if (error.message.includes('Too many requests')) {
          friendlyMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
        } else {
          friendlyMessage = error.message;
        }
        
        return { error: { ...error, message: friendlyMessage } };
      }
      
      return { error: null };
      
    } catch (error) {
      return { error: { message: 'Erro inesperado. Tente novamente.' } };
    }
  }

  static async signUp(
    email: string, 
    password: string, 
    name: string, 
    userType: 'secretaria' | 'vendedor'
  ): Promise<AuthResult> {
    try {
      if (!email || !password || !name) {
        return { error: { message: 'Todos os campos são obrigatórios' } };
      }

      if (password.length < 6) {
        return { error: { message: 'A senha deve ter pelo menos 6 caracteres' } };
      }

      console.log('Criando usuário com tipo:', userType);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            user_type: userType
          }
        }
      });
      
      if (authError) {
        let friendlyMessage = 'Erro ao criar conta';
        
        if (authError.message.includes('User already registered')) {
          friendlyMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (authError.message.includes('Password should be at least')) {
          friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
          friendlyMessage = authError.message;
        }
        
        return { error: { ...authError, message: friendlyMessage } };
      }
      
      return { error: null };
      
    } catch (error) {
      return { error: { message: 'Erro inesperado. Tente novamente.' } };
    }
  }

  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
    }
  }

  static async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
