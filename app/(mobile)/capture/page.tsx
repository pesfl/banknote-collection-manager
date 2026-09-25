'use client';

import { useState } from 'react';
import CaptureFlow from '@/components/mobile/CaptureFlow';

export default function CapturePage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleCaptureComplete = (specimenId: string) => {
    setSuccessMessage(`Specimen ${specimenId.slice(0, 8)}... saved locally`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Capture</h1>
        <a
          href="/inventory"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
        >
          View All
        </a>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top">
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="pb-20">
        <CaptureFlow onComplete={handleCaptureComplete} />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-around">
      <NavItem href="/capture" icon="📷" label="Capture" active />
      <NavItem href="/inventory" icon="📋" label="Inventory" />
      <NavItem href="/settings" icon="⚙️" label="Settings" />
    </nav>
  );
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active = false }: NavItemProps) {
  return (
    <a
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}
