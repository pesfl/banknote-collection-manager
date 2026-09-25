'use client';

import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getNetworkStatus } from '@/lib/offline/wifi-detector';
import type { NetworkInfo } from '@/lib/offline/wifi-detector';

interface SyncPanelProps {
  counts: { pending: number; synced: number; failed: number };
  onSync?: () => void;
}

export default function SyncPanel({ counts, onSync }: SyncPanelProps) {
  const syncStatus = useOfflineSync();
  const [networkStatus, setNetworkStatus] = useState<NetworkInfo>(getNetworkStatus());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Update network status
    const status = getNetworkStatus();
    setNetworkStatus(status);
  }, [syncStatus.networkStatus]);

  const handleSync = async () => {
    await syncStatus.syncNow();
    onSync?.();
  };

  if (counts.pending === 0 && counts.failed === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3 flex items-center gap-2">
        <span className="text-lg">✓</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            All synced
          </p>
          <p className="text-xs text-green-700 dark:text-green-500">
            {counts.synced} specimens in cloud
          </p>
        </div>
        <NetworkIndicator status={networkStatus} mounted={isMounted} />
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Sync Status Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-lg">
            {counts.failed > 0 ? '⚠️' : '⏳'}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {counts.pending > 0 && `${counts.pending} pending`}
              {counts.failed > 0 && ` • ${counts.failed} failed`}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {!isMounted
                ? 'Network detector ready'
                : networkStatus.isOnline
                ? networkStatus.isWifi
                  ? '✓ Wi-Fi available'
                  : '📱 Cellular only'
                : '📴 Offline'}
            </p>
          </div>
        </div>
        <span className="text-lg text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="px-4 py-4 bg-white dark:bg-gray-800 space-y-3">
          {/* Network Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Network Status
            </p>
            <div className="flex items-center gap-2">
              <NetworkIndicator status={networkStatus} mounted={isMounted} />
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  {!isMounted ? 'Detecting connection...' : networkStatus.isOnline ? '🟢 Online' : '🔴 Offline'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {!isMounted
                    ? 'Initializing'
                    : networkStatus.isWifi
                    ? '✓ Connected via Wi-Fi'
                    : '📱 Connected via cellular'}
                </p>
              </div>
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {counts.pending}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1">
                Pending
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {counts.synced}
              </p>
              <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                Synced
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {counts.failed}
              </p>
              <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                Failed
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncStatus.isSyncing || !networkStatus.isWifi}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {syncStatus.isSyncing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Syncing...
                </>
              ) : (
                '↑ Sync Now'
              )}
            </button>
            {counts.failed > 0 && (
              <button
                onClick={syncStatus.retryFailed}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Retry Failed
              </button>
            )}
          </div>

          {!networkStatus.isWifi && networkStatus.isOnline && isMounted && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-xs text-yellow-800 dark:text-yellow-400">
              ⚠️ Switch to Wi-Fi to sync (to save cellular data)
            </div>
          )}

          {!networkStatus.isOnline && isMounted && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 text-xs text-red-800 dark:text-red-400">
              📴 You're offline. Sync will happen automatically when back online.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NetworkIndicatorProps {
  status: NetworkInfo;
  mounted: boolean;
}

function NetworkIndicator({ status, mounted }: NetworkIndicatorProps) {
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <span>●</span>
        <span>Network</span>
      </div>
    );
  }

  if (!status.isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
        <span>📴</span>
        <span>Offline</span>
      </div>
    );
  }

  if (status.isWifi) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
        <span>✓</span>
        <span>Wi-Fi</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
      <span>📱</span>
      <span>Cellular</span>
    </div>
  );
}
