import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isLoading: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => Promise<void>;
  syncThemeToSupabase: (theme: Theme) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isLoading: true,
  
  setTheme: (theme: Theme) => {
    set({ theme });
    
    // Apply to HTML element
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // Save to localStorage as fallback
    localStorage.setItem('theme-preference', theme);
  },
  
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    
    get().setTheme(newTheme);
    get().syncThemeToSupabase(newTheme);
  },
  
  initializeTheme: async () => {
    set({ isLoading: true });
    
    try {
      // Try to get user's saved preference from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single();
          
        if (profile?.theme_preference) {
          get().setTheme(profile.theme_preference as Theme);
          set({ isLoading: false });
          return;
        }
      }
      
      // Fallback to localStorage
      const localTheme = localStorage.getItem('theme-preference') as Theme;
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        get().setTheme(localTheme);
        set({ isLoading: false });
        return;
      }
      
      // Final fallback: detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      get().setTheme(prefersDark ? 'dark' : 'light');
      
    } catch (error) {
      console.error('Error initializing theme:', error);
      
      // Fallback to localStorage on error
      const localTheme = localStorage.getItem('theme-preference') as Theme;
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        get().setTheme(localTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        get().setTheme(prefersDark ? 'dark' : 'light');
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  syncThemeToSupabase: async (theme: Theme) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ theme_preference: theme })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error syncing theme to Supabase:', error);
      // Continue silently - localStorage fallback is already in place
    }
  },
}));

// Listen for storage events to sync across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme-preference' && e.newValue) {
      const theme = e.newValue as Theme;
      if (theme === 'light' || theme === 'dark') {
        useThemeStore.getState().setTheme(theme);
      }
    }
  });
}