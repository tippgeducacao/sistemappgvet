
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/AuthStore';
import { AuthService } from '@/services/auth/AuthService';
import { UserService } from '@/services/user/UserService';

export const useAuthManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user, profile, session, loading,
    setUser, setProfile, setSession, setLoading, reset
  } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Usuário autenticado, buscando perfil...');
          console.log('User metadata:', session.user.user_metadata);
          
          setTimeout(async () => {
            const profileData = await UserService.getProfile(session.user.id);
            console.log('Profile data retornado:', profileData);
            
            // Se não encontrou perfil, usar dados básicos do usuário
            if (!profileData) {
              console.log('Perfil não encontrado, usando dados do usuário...');
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
              setProfile(profileData);
            }
            
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    AuthService.getCurrentSession().then((session) => {
      console.log('Sessão existente:', session?.user?.email || 'Nenhuma');
      if (session?.user) {
        console.log('Metadata da sessão existente:', session.user.user_metadata);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setSession, setLoading]);

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
