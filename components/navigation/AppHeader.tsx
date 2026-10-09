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
  Menu
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface AppHeaderProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleMobileDrawer?: () => void;
}

export function AppHeader({
  onToggleMobileDrawer,
}: AppHeaderProps) {
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0a1329] backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between px-3 sm:px-5 lg:px-7">
        {/* Left: Brand & Mobile Drawer Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger (Mobile Only) */}
          <button
            onClick={onToggleMobileDrawer}
            aria-label="Toggle Navigation Menu"
            className="inline-flex lg:hidden items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-[#0a1931] dark:bg-[#00246b] flex items-center justify-center text-white shadow-sm border border-blue-900/40 group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 1L2 6v2h20V6L12 1zm-7 8v9h3v-9H5zm5 0v9h4v-9h-4zm6 0v9h3v-9h-3zM2 20v2h20v-2H2z"/>
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                My Collections
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Actions, Search, Add Item, Settings, Backup Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <div className="hidden md:flex items-center">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-none w-32 focus:w-48 transition-all"
              />
            </form>
          </div>

          {/* + Add Item Button */}
          <Link
            href="/capture"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-600/90 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-all shadow-xs"
          >
            <span>+</span>
            <span>Add Item</span>
          </Link>

          {/* Settings Button */}
          <Link
            href="/settings"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Settings</span>
          </Link>

          {/* Backup Status Card */}
          <div 
            onClick={() => syncNow()}
            title="Click to trigger cloud backup sync"
            className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 dark:bg-[#111c3d]/80 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 transition-colors"
          >
            <div className="relative">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111c3d]" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider leading-tight">
                Backup Status
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block leading-tight">
                {isOnline ? 'All backed up' : 'Offline local'}
              </span>
            </div>
          </div>

          {/* User Profile / Auth */}
          <div className="relative">
            {status === 'authenticated' && session?.user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="h-8 w-8 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-2xs"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-[#0052e0] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Dropdown Menu */}
            {showUserMenu && session?.user && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
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
