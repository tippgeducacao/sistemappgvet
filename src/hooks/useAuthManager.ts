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
    let mounted = true;
    
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Create basic profile immediately
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
          setLoading(false);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    AuthService.getCurrentSession().then((session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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