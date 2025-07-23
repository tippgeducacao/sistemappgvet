import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/ThemeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isLoading } = useThemeStore();
  
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
      </Button>
    );
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 transition-all duration-300 hover:scale-110"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`absolute h-4 w-4 transition-all duration-300 ${
            theme === 'light'
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon
          className={`absolute h-4 w-4 transition-all duration-300 ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
};