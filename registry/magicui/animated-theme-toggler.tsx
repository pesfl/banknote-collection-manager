'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface AnimatedThemeTogglerProps {
  variant?: 'triangle' | 'circle' | 'square';
}

export function AnimatedThemeToggler({ variant = 'circle' }: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, then document class
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && document.documentElement.classList.contains('dark'));
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentIsDark = html.classList.contains('dark');

    if (currentIsDark) {
      // Switch to light mode
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
      document.documentElement.style.colorScheme = 'light';
    } else {
      // Switch to dark mode
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
      document.documentElement.style.colorScheme = 'dark';
    }
  };

  if (!mounted) return null;

  const baseStyles = 'relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 cursor-pointer group';

  const variants = {
    circle: 'rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700',
    triangle: 'rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transform hover:scale-110',
    square: 'rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`${baseStyles} ${variants[variant]}`}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute w-5 h-5 text-yellow-500 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute w-5 h-5 text-blue-400 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
    </button>
  );
}
