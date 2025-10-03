
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/AuthStore';

export const useUserManagement = () => {
  const navigate = useNavigate();
  const { user, profile, loading, setCurrentUser } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile && user) {
      console.log('Profile detectado:', profile);
      setCurrentUser({
        user_type: profile.user_type,
        name: profile.name,
        id: profile.id,
        email: profile.email
      });
    } else {
      setCurrentUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user]);

  return {
    user,
    currentUser: profile ? {
      user_type: profile.user_type,
      name: profile.name,
      id: profile.id,
      email: profile.email
    } : null,
    loading
  };
};
