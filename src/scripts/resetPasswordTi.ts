import { supabase } from '@/integrations/supabase/client';

// Script para alterar a senha do usuário ti@ppg.com
export const resetPasswordTi = async () => {
  try {
    console.log('🔍 Buscando usuário ti@ppg.com...');
    
    // Buscar o usuário pelo email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', 'ti@ppg.com')
      .single();

    if (profileError || !profile) {
      throw new Error('Usuário ti@ppg.com não encontrado');
    }

    console.log('👤 Usuário encontrado:', profile);

    // Resetar senha usando a edge function
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Usuário não autenticado');
    }

    console.log('🔐 Alterando senha para PPG@Tecnologia...');

    const response = await fetch('https://lrpyxyhhqfzozrkklxwu.supabase.co/functions/v1/reset-user-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        userId: profile.id,
        newPassword: 'PPG@Tecnologia'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao alterar senha');
    }

    console.log('✅ Senha do usuário ti@ppg.com alterada com sucesso para PPG@Tecnologia');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    throw error;
  }
};

// Executar o script automaticamente
resetPasswordTi()
  .then(() => console.log('Script executado com sucesso'))
  .catch(error => console.error('Erro na execução:', error));