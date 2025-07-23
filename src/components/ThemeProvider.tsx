import React, { useEffect } from 'react';
import { useThemeStore } from '@/stores/ThemeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { initializeTheme } = useThemeStore();
  
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);
  
  return <>{children}</>;
};