'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Banknote, 
  Camera, 
  Scale, 
  Settings 
} from 'lucide-react';
import { clsx } from 'clsx';

const MOBILE_NAV_ITEMS = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/banknotes', icon: Banknote },
  { name: 'Capture', href: '/capture', icon: Camera, primary: true },
  { name: 'Valuation', href: '/valuation', icon: Scale },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNavigation() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname?.startsWith('/auth')) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/dashboard';
    return pathname?.startsWith(href) || (href === '/banknotes' && (pathname === '/collection-list' || pathname === '/inventory'));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-active:scale-95 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center py-1 px-3 rounded-xl transition-colors',
                active
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
