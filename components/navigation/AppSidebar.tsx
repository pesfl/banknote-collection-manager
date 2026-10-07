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
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';

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
    name: 'Dual-Image Capture',
    href: '/capture',
    icon: Camera,
    badge: 'AI Active',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  {
    name: '5+1 Valuation Matrix',
    href: '/valuation',
    icon: Scale,
    badge: '5 Sources',
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
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  // Helper to test if route is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname?.startsWith(href) || (href === '/banknotes' && pathname === '/collection-list');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-full lg:h-[calc(100vh-4rem)] w-64 flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 flex',
          isOpen ? 'left-0' : '-left-64 lg:left-0'
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6 p-4">
          {/* Mobile Header in Drawer */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Navigation</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
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
                  onClick={onClose}
                  className={clsx(
                    'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'h-4 w-4 transition-transform group-hover:scale-110',
                        active
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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

        {/* Bottom Section: Storage & Ingestion Monitor */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="rounded-2xl p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Physical Storage
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                Box 01 → Sec A
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Active specimen box tracking & slot capacity verified.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>Offline IDB Active</span>
            </span>
            <span className="font-mono text-[10px]">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
