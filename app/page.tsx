'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to mobile capture by default
    window.location.href = '/capture';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Banknote Collection Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Redirecting to capture screen...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
