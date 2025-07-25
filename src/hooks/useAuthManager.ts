import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/AuthStore';
import { AuthService } from '@/services/auth/AuthService';
import { supabase } from '@/integrations/supabase/client';

export const useAuthManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user, profile, session, loading,
    setUser, setProfile, setSession, setLoading, reset
  } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls com setTimeout para evitar deadlock
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error || !profileData) {
                // Fallback para perfil básico se não encontrar no banco
                const basicProfile = {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
                  email: session.user.email || '',
                  user_type: session.user.user_metadata?.user_type || 'vendedor',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  photo_url: null
                };
                setProfile(basicProfile);
              } else {
                // Usar dados do banco de dados e converter para o tipo Profile
                const profile = {
                  id: profileData.id,
                  name: profileData.name,
                  email: profileData.email,
                  user_type: profileData.user_type as 'secretaria' | 'vendedor' | 'admin' | 'diretor' | 'sdr_inbound' | 'sdr_outbound',
                  created_at: profileData.created_at,
                  updated_at: profileData.updated_at,
                  photo_url: profileData.photo_url
                };
                setProfile(profile);
              }
            } catch (error) {
              console.error('Erro ao carregar perfil:', error);
              // Fallback para perfil básico
              const basicProfile = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
                email: session.user.email || '',
                user_type: session.user.user_metadata?.user_type || 'vendedor',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                photo_url: null
              };
              setProfile(basicProfile);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    AuthService.getCurrentSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password);
    
    if (result.error) {
      toast({
        title: "Erro no login",
        description: result.error.message,
        variant: "destructive",
      });
      return false;
    } else {
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema PPGVET!",
      });
      setTimeout(() => navigate('/'), 1000);
      return true;
    }
  };

  const signUp = async (email: string, password: string, name: string, userType: 'secretaria' | 'vendedor') => {
    const result = await AuthService.signUp(email, password, name, userType);
    
    if (result.error) {
      toast({
        title: "Erro no cadastro",
        description: result.error.message,
        variant: "destructive",
      });
      return false;
    } else {
      toast({
        title: "Conta criada",
        description: "Conta criada com sucesso! Você já pode fazer login.",
      });
      return true;
    }
  };

  const signOut = async () => {
    await AuthService.signOut();
    reset();
    navigate('/auth');
  };

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};