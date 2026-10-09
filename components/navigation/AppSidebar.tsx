'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Banknote, 
  Camera, 
  Scale, 
  BarChart3, 
  Settings, 
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
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Banknotes Inventory',
    href: '/banknotes',
    icon: Banknote,
    badge: '10,000+',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    name: 'Add New Note',
    href: '/capture',
    icon: Camera,
    badge: 'AI',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  {
    name: '5+1 Valuation Matrix',
    href: '/valuation',
    icon: Scale,
    badge: '5 Src',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  {
    name: 'Collection Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings & Storage',
    href: '/settings',
    icon: Settings,
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
          <nav className="space-y-1.5">
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
                    'group flex items-center rounded-xl text-xs font-semibold transition-all relative',
                    isCollapsed 
                      ? 'justify-center p-2.5' 
                      : 'justify-between px-3 py-2.5',
                    active
                      ? 'bg-[#0052e0] text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className={clsx('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
                    <Icon
                      className={clsx(
                        'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                        active
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full font-bold',
                        active
                          ? 'bg-white/20 text-white'
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

        {/* Bottom Section: Theme Toggler, Storage & Ingestion Monitor */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          {/* Dark Mode Theme Toggler (Right above Box content) */}
          <div
            className={clsx(
              'flex items-center rounded-xl transition-all',
              isCollapsed
                ? 'justify-center py-1'
                : 'justify-between px-3 py-2 bg-slate-50/90 dark:bg-[#111c3d]/70 border border-slate-200/70 dark:border-slate-800/90 shadow-xs'
            )}
          >
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Theme Mode
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                  Light / Dark toggle
                </span>
              </div>
            )}
            <AnimatedThemeToggler />
          </div>

          {/* Storage Box Content */}
          {!isCollapsed ? (
            <div className="rounded-xl p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#111c3d]/60 dark:to-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-[#0052e0] dark:text-blue-400" />
                  Storage Coordinates
                </span>
                <span className="text-[10px] text-[#0052e0] dark:text-blue-400 font-mono font-bold">
                  Box 01
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Vault coordinates verified. 10,000 notes capacity.
              </p>
            </div>
          ) : (
            <div className="flex justify-center p-2" title="Storage Box 01 Active">
              <Box className="h-4 w-4 text-[#0052e0] dark:text-blue-400" />
            </div>
          )}

          {!isCollapsed && (
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
              <span className="flex items-center gap-1 font-mono">
                <Database className="h-3 w-3" />
                <span>Offline IDB Active</span>
              </span>
              <span className="font-mono">v1.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
