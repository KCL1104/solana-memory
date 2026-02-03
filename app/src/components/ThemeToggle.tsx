'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 border border-theme-border-primary hover:border-neon-cyan transition-all duration-300 group overflow-hidden"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10 transition-colors duration-300" />
      
      {/* Icons with animation */}
      <div className="relative w-full h-full flex items-center justify-center">
        {theme === 'dark' ? (
          <Moon className="w-5 h-5 text-neon-cyan group-hover:text-glow-cyan transition-all duration-300 animate-fade-scale" />
        ) : (
          <Sun className="w-5 h-5 text-neon-orange group-hover:text-glow-orange transition-all duration-300 animate-fade-scale" />
        )}
      </div>
      
      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-0 h-0 border-r-[6px] border-b-[6px] border-r-neon-cyan border-b-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
