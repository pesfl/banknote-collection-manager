'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect authenticated users to dashboard, others to capture
    if (session) {
      window.location.href = '/banknotes';
    } else {
      window.location.href = '/capture';
    }
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          🏦 Banknote Collection Manager
        </h1>
        <p className="text-gray-300 mb-6">
          Loading...
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
