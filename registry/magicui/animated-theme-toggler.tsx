'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AnimatedThemeTogglerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  duration?: number;
}

export function AnimatedThemeToggler({
  className,
  duration = 500,
  ...props
}: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved ? saved === 'dark' : (document.documentElement.classList.contains('dark') || prefersDark);
    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  const toggleTheme = useCallback(
    async (event?: React.MouseEvent<HTMLButtonElement>) => {
      const nextDark = !isDark;

      const updateDOM = () => {
        setIsDark(nextDark);
        if (nextDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
          localStorage.setItem('theme', 'light');
        }
      };

      // Check if View Transition API is supported and motion isn't reduced
      if (
        typeof document === 'undefined' ||
        !('startViewTransition' in document) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        updateDOM();
        return;
      }

      const button = buttonRef.current;
      const rect = button?.getBoundingClientRect();
      const x = event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
      const y = event?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        updateDOM();
      });

      try {
        await transition.ready;
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      } catch (e) {
        // Safe fallback
      }
    },
    [isDark, duration]
  );

  if (!mounted) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'relative inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm opacity-50 w-9 h-9',
          className
        )}
        aria-label="Toggle theme"
        {...props}
      >
        <span className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center p-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors cursor-pointer w-9 h-9 group overflow-hidden',
        className
      )}
      aria-label="Toggle theme"
      {...props}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={cn(
            'absolute w-4 h-4 text-amber-500 transition-all duration-300 transform',
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'absolute w-4 h-4 text-indigo-400 transition-all duration-300 transform',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  );
}
