
import React from 'react';
import LoadingState from './loading-state';

interface UserGuardProps {
  user: any;
  loading: boolean;
  children: React.ReactNode;
}

const UserGuard: React.FC<UserGuardProps> = ({ 
  user, 
  loading, 
  children
}) => {
  if (loading) {
    return <LoadingState variant="fullscreen" />;
  }

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return <>{children}</>;
};

export default UserGuard;
