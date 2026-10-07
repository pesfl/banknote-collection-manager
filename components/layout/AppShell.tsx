'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from '@/components/navigation/AppHeader';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Load saved sidebar state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vault_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch (e) {}
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vault_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Skip app shell on auth screens
  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4fa] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors">
      <AppHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      <div className="flex-1 flex min-w-0">
        <AppSidebar
          isMobileOpen={isMobileDrawerOpen}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        <main className="flex-1 min-w-0 pb-20 lg:pb-10 px-3 sm:px-5 lg:px-7 py-5 w-full max-w-[1750px] mx-auto transition-all">
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
