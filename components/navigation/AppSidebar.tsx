'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ListOrdered, 
  Globe, 
  PlusCircle, 
  Copy, 
  Star, 
  AlertCircle, 
  Clock, 
  BarChart2, 
  Box, 
  PanelLeftClose,
  PanelLeftOpen,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'All Notes',
    href: '/banknotes',
    icon: ListOrdered,
  },
  {
    name: 'Countries',
    href: '/banknotes?view=countries',
    icon: Globe,
  },
  {
    name: 'New Entries',
    href: '/capture',
    icon: PlusCircle,
  },
  {
    name: 'Duplicates',
    href: '/banknotes?view=duplicates',
    icon: Copy,
  },
  {
    name: 'Valuable / Special',
    href: '/banknotes?view=valuable',
    icon: Star,
  },
  {
    name: 'Missing Information',
    href: '/banknotes?view=missing',
    icon: AlertCircle,
  },
  {
    name: 'Recently Added',
    href: '/banknotes?view=recent',
    icon: Clock,
  },
  {
    name: 'Reports',
    href: '/analytics',
    icon: BarChart2,
  },
];

interface AppSidebarProps {
  isMobileOpen?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  isMobileOpen = false,
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();

  // Prevent background body scroll when mobile drawer is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname?.startsWith(href) || (href === '/banknotes' && pathname === '/collection-list');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
        className={clsx(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar Container */}
      <aside
        aria-label="Application Navigation"
        className={clsx(
          // Base & Common Layout
          'top-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b132b] backdrop-blur-md transition-all duration-300 ease-in-out shrink-0',
          
          // Mobile (<lg): Fixed drawer full height off-canvas
          'fixed h-screen w-72 max-w-[82vw] lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 lg:z-30',
          
          // Mobile Visibility & GPU Transform
          isMobileOpen
            ? 'translate-x-0 opacity-100 visible shadow-2xl pointer-events-auto'
            : '-translate-x-full opacity-0 invisible pointer-events-none lg:translate-x-0 lg:opacity-100 lg:visible lg:pointer-events-auto lg:shadow-none',
          
          // Desktop Width (collapsed rail vs full)
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-4 p-3 sm:p-3.5 overflow-y-auto">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between lg:hidden pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Navigation
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Desktop Collapse Toggle Header */}
          <div className="hidden lg:flex items-center justify-between pb-1 px-1">
            {!isCollapsed && (
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Vault Menu
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Rail'}
              className={clsx(
                'p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors',
                isCollapsed && 'mx-auto'
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.name : undefined}
                  className={clsx(
                    'group flex items-center rounded-xl font-semibold transition-all relative',
                    isCollapsed 
                      ? 'justify-center p-3' 
                      : 'justify-between px-3.5 py-2.5 text-xs',
                    active
                      ? 'bg-[#e8efff] text-[#003399] dark:bg-blue-950/70 dark:text-blue-300 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className={clsx('flex items-center', isCollapsed ? 'justify-center' : 'gap-3.5')}>
                    <Icon
                      className={clsx(
                        'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                        active
                          ? 'text-[#003399] dark:text-blue-300'
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full font-bold',
                        active
                          ? 'bg-[#003399]/15 text-[#003399] dark:bg-blue-900/50 dark:text-blue-200'
                          : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme Toggler & Database Status */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          {/* Dark Mode Theme Toggler */}
          <div
            className={clsx(
              'flex items-center rounded-xl transition-all',
              isCollapsed
                ? 'justify-center py-1'
                : 'justify-between px-3 py-1.5 bg-slate-50/90 dark:bg-[#111c3d]/70 border border-slate-200/70 dark:border-slate-800/90 shadow-xs'
            )}
          >
            {!isCollapsed && (
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Theme
              </span>
            )}
            <AnimatedThemeToggler />
          </div>

          {/* Database Connected Status Bar */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span>Database</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Connected</span>
              </span>
            </div>
          ) : (
            <div className="flex justify-center p-1" title="Database Connected">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
