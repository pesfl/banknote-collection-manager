'use client';

import { useSession, signOut } from 'next-auth/react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* User Menu */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
            {session?.user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-xs text-gray-300">{session?.user?.email || 'User'}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
