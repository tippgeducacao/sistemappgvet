
import { supabase } from '@/integrations/supabase/client';

export class VendedorCadastroService {
  static async cadastrarVendedor(email: string, password: string, name: string): Promise<void> {
    console.log('📝 Iniciando cadastro de vendedor:', { email, name });

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
      // 1. Criar usuário com signUp (igual ao fluxo de cadastro normal)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            user_type: 'vendedor'
          }
        }
      });

      if (signUpError) {
        console.error('❌ Erro ao criar usuário:', signUpError);
        
        let friendlyMessage = 'Erro ao criar vendedor';
        
        if (signUpError.message.includes('User already registered')) {
          friendlyMessage = 'Este email já está cadastrado no sistema.';
        } else if (signUpError.message.includes('Invalid email')) {
          friendlyMessage = 'Email inválido.';
        } else if (signUpError.message.includes('Password should be at least')) {
          friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
          friendlyMessage = signUpError.message;
        }
        
        throw new Error(friendlyMessage);
      }

      if (!signUpData?.user) {
        throw new Error('Falha ao criar usuário - dados inválidos retornados');
      }

      console.log('✅ Usuário criado com sucesso:', signUpData.user.id);

      // 2. Aguardar um pouco para garantir que o trigger handle_new_user seja executado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verificar se o perfil foi criado pelo trigger
      let tentativas = 0;
      const maxTentativas = 5;
      let profileCreated = false;

      while (tentativas < maxTentativas && !profileCreated) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signUpData.user.id)
          .single();

        if (!profileError && profile) {
          profileCreated = true;
          console.log('✅ Perfil criado automaticamente pelo trigger:', profile);
        } else {
          tentativas++;
          console.log(`⏳ Aguardando criação do perfil... tentativa ${tentativas}/${maxTentativas}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 4. Se o perfil não foi criado automaticamente, criar manualmente
      if (!profileCreated) {
        console.log('⚠️ Trigger não executou, criando perfil manualmente...');
        
        const { data: manualProfile, error: manualProfileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            email: email.trim().toLowerCase(),
            name: name.trim(),
            user_type: 'vendedor'
          })
          .select()
          .single();

        if (manualProfileError) {
          console.error('❌ Erro ao criar perfil manualmente:', manualProfileError);
          throw new Error('Falha ao criar perfil do vendedor');
        }

        console.log('✅ Perfil criado manualmente:', manualProfile);
      }

      // 5. Confirmar que o usuário está totalmente configurado
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

      if (finalProfileError || !finalProfile) {
        console.error('❌ Falha na verificação final do perfil:', finalProfileError);
        throw new Error('Usuário criado mas perfil não encontrado');
      }

      console.log('🎉 Vendedor cadastrado completamente:', { 
        userId: signUpData.user.id,
        email: finalProfile.email, 
        name: finalProfile.name,
        userType: finalProfile.user_type
      });

    } catch (error: any) {
      console.error('❌ Erro geral no cadastro:', error);
      throw error;
    }
  }
}
