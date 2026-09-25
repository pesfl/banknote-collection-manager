'use client';

import { useState, useEffect } from 'react';
import { getStorageStats, clearAllSpecimens } from '@/lib/offline/idb';

export default function SettingsPage() {
  const [storageStats, setStorageStats] = useState<{
    specimenCount: number;
    estimatedSizeKB: number;
  } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getStorageStats();
        setStorageStats(stats);
      } catch (err) {
        console.error('Failed to load storage stats:', err);
      }
    };

    loadStats();
  }, []);

  const handleClearData = async () => {
    if (confirm('Are you sure? This will delete all local specimens. They must be synced first.')) {
      try {
        await clearAllSpecimens();
        setStorageStats(null);
      } catch (err) {
        alert('Failed to clear data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">⚙️ Settings</h1>

      {/* Storage Management */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">💾 Storage Management</h2>

        {storageStats && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Stored Specimens</p>
                <p className="text-3xl font-bold text-blue-400">{storageStats.specimenCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Storage Used</p>
                <p className="text-3xl font-bold text-green-400">
                  {(storageStats.estimatedSizeKB / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>

            {/* Storage Bar */}
            <div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{
                    width: `${Math.min((storageStats.estimatedSizeKB / 50000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {(storageStats.estimatedSizeKB / 1024).toFixed(1)} MB of ~49 MB available
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleClearData}
          className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors font-medium"
        >
          🗑️ Clear Local Data
        </button>
      </div>

      {/* App Information */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">ℹ️ App Information</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Version</span>
            <span className="text-white font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Build</span>
            <span className="text-white font-semibold">2026.09.26</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform</span>
            <span className="text-white font-semibold">Web PWA</span>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🔄 Sync Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-gray-300">Auto-sync on Wi-Fi</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-gray-300">Sync over cellular (not recommended)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-gray-300">Compress images before upload</span>
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🎨 Preferences</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Theme</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Image Quality</label>
            <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="high">High (90%)</option>
              <option value="medium" selected>Medium (80%)</option>
              <option value="low">Low (60%)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
