
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '@/services/auth/AuthService';
import { User as AppUser } from '@/types/user';

interface AuthState {
  // Auth state
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  currentUser: AppUser | null;
  loading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setCurrentUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  profile: null,
  session: null,
  currentUser: null,
  loading: true,
  
  // Actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({
    user: null,
    profile: null,
    session: null,
    currentUser: null,
    loading: false
  }),
}));
