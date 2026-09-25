'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSyncQueueManager } from '@/lib/offline/sync-queue';
import {
  subscribeToNetworkChanges,
  getNetworkStatus,
  shouldSync as checkShouldSync,
} from '@/lib/offline/wifi-detector';
import type { NetworkInfo } from '@/lib/offline/wifi-detector';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  networkStatus: NetworkInfo;
  shouldSync: boolean;
  lastSyncTime?: Date;
}

interface UseOfflineSyncReturn extends SyncStatus {
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
  cancelSync: () => void;
}

/**
 * Hook for managing offline-first sync
 * Monitors network status and triggers automatic syncing on Wi-Fi
 */
export function useOfflineSync(): UseOfflineSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    networkStatus: getNetworkStatus(),
    shouldSync: checkShouldSync(),
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();

  const syncManager = getSyncQueueManager();

  // Update sync status from manager
  const updateSyncStatus = useCallback(async () => {
    const status = await syncManager.getSyncStatus();
    setSyncStatus(prev => ({
      ...prev,
      ...status,
      shouldSync: checkShouldSync(),
    }));
  }, [syncManager]);

  // Initial sync status
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((networkStatus: NetworkInfo) => {
      setSyncStatus(prev => ({
        ...prev,
        networkStatus,
        shouldSync: networkStatus.isOnline && networkStatus.isWifi,
      }));

      // Auto-sync on Wi-Fi
      if (networkStatus.isOnline && networkStatus.isWifi) {
        syncNow();
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to sync manager updates
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(() => {
      updateSyncStatus();
    });

    return unsubscribe;
  }, [syncManager, updateSyncStatus]);

  const syncNow = useCallback(async () => {
    try {
      if (syncStatus.isSyncing) return;

      setSyncStatus(prev => ({ ...prev, isSyncing: true }));

      await syncManager.syncPendingSpecimens();
      setLastSyncTime(new Date());

      await updateSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [syncStatus.isSyncing, syncManager, updateSyncStatus]);

  const retryFailed = useCallback(async () => {
    try {
      await syncManager.retryFailedSpecimens();
      await updateSyncStatus();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, [syncManager, updateSyncStatus]);

  const cancelSync = useCallback(() => {
    syncManager.cancelSync();
    setSyncStatus(prev => ({ ...prev, isSyncing: false }));
  }, [syncManager]);

  return {
    ...syncStatus,
    lastSyncTime,
    syncNow,
    retryFailed,
    cancelSync,
  };
}
