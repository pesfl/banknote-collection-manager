'use client';

import { getStorageStats, clearAllSpecimens, clearAllSyncData } from '@/lib/offline/idb';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [stats, setStats] = useState({ specimenCount: 0, syncQueueCount: 0, estimatedSize: '0 B' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const s = await getStorageStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocalData = async () => {
    if (
      !confirm(
        'Are you sure? This will delete all local captures that have not been synced. Synced items are safe.'
      )
    ) {
      return;
    }

    try {
      await clearAllSpecimens();
      await clearAllSyncData();
      await loadStats();
      alert('Local data cleared');
    } catch (err) {
      alert('Failed to clear data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-20 space-y-6">
        {/* Storage Info */}
        <Section title="Storage">
          {isLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-3">
              <StatItem
                label="Saved Specimens"
                value={stats.specimenCount.toString()}
              />
              <StatItem label="Pending Syncs" value={stats.syncQueueCount.toString()} />
              <StatItem label="Space Used" value={stats.estimatedSize} />
            </div>
          )}
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Your data is stored locally on this device. Synced items are safely backed up to the cloud.
            </p>
            <button
              onClick={handleClearLocalData}
              className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg transition-colors text-sm"
            >
              🗑️ Clear Local Data
            </button>
          </div>
        </Section>

        {/* App Info */}
        <Section title="About">
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">App:</strong> Banknote
              Collection Manager
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Version:</strong> 1.0.0
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Offline-first:</strong> All
              captures saved locally, synced when online
            </p>
          </div>
        </Section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">{children}</div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-around">
      <NavItem href="/capture" icon="📷" label="Capture" />
      <NavItem href="/inventory" icon="📋" label="Inventory" />
      <NavItem href="/settings" icon="⚙️" label="Settings" active />
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
