
import { supabase } from '@/integrations/supabase/client';

export class VendedorCadastroService {
  static async cadastrarVendedor(email: string, password: string, name: string, userType: string = 'vendedor'): Promise<string> {
    console.log('📝 Iniciando cadastro de usuário via Edge Function:', { email, name, userType });

    // Validações básicas
    if (!email || !password || !name) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    try {
      // Obter o token de autenticação do usuário atual
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar a Edge Function para criar o usuário
      const response = await fetch('https://lrpyxyhhqfzozrkklxwu.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          userType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erro da Edge Function:', result);
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      console.log('✅ Usuário criado com sucesso via Edge Function:', result);
      return result.userId;

    } catch (error: any) {
      console.error('❌ Erro geral no cadastro:', error);
      throw error;
    }
  }
}
