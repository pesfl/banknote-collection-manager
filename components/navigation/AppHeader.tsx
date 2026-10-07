'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  Search, 
  Camera, 
  Wifi, 
  WifiOff, 
  User, 
  LogOut, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({ onToggleSidebar, isSidebarOpen }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { networkStatus, pendingCount, syncNow } = useOfflineSync();
  const isOnline = networkStatus.isOnline;
  const isWifi = networkStatus.isWifi;
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Skip header on specific auth pages if desired
  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/banknotes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Menu"
            className="inline-flex lg:hidden items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Banknote Vault
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  AI v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block -mt-0.5">
                Specimen Collection & 5+1 Valuation
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Omnibox Search (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pick #, Country, Serial, Denomination..."
              className="w-full pl-9 pr-12 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded">
              ↵
            </kbd>
          </form>
        </div>

        {/* Right: Actions, Sync, Theme & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network / Sync Status Indicator */}
          <button
            onClick={() => syncNow()}
            title={isOnline ? (isWifi ? 'Online via Wi-Fi (Click to sync)' : 'Online via Cellular') : 'Offline (Local IDB storage active)'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                <span className="hidden xl:inline">{isWifi ? 'Wi-Fi' : 'Cellular'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Offline</span>
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Quick Capture Button */}
          <Link
            href="/capture"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Capture</span>
          </Link>

          {/* Theme Toggler */}
          <div className="flex items-center justify-center p-1">
            <AnimatedThemeToggler />
          </div>

          {/* User Profile / Auth Menu */}
          <div className="relative">
            {status === 'authenticated' && session?.user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <button
                onClick={() => signIn('credentials', { email: 'collector@banknote.dev', password: 'demo', callbackUrl: '/' })}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 shadow-sm transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Demo Login</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {showUserMenu && session?.user && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {session.user.name || 'Lead Collector'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {session.user.email || 'collector@banknote.dev'}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Role: {(session.user as any).role || 'COLLECTOR'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Settings & Storage</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
