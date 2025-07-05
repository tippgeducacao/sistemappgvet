
import { createContext, useContext } from 'react';
import { useAuthManager } from './useAuthManager';

const AuthContext = createContext<ReturnType<typeof useAuthManager> | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthManager();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
