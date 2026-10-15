'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getQueueStatus, 
  subscribeToQueueStatus, 
  pauseBackgroundQueue, 
  resumeBackgroundQueue, 
  retryFailedSpecimens, 
  clearProcessLogs,
  syncPendingSpecimensFromDB,
  addProcessLog
} from '@/lib/ai/background-queue';
import { getAllSpecimens } from '@/lib/offline/idb';
import type { LocalSpecimen, QueueManagerStatus } from '@/types';

export function useBackgroundProcesses() {
  const [status, setStatus] = useState<QueueManagerStatus>(getQueueStatus());
  const [allSpecimens, setAllSpecimens] = useState<LocalSpecimen[]>([]);
  const [isLoadingSpecimens, setIsLoadingSpecimens] = useState(true);

  const loadSpecimens = useCallback(async () => {
    try {
      const list = await getAllSpecimens();
      setAllSpecimens(list || []);
    } catch (e) {
      console.warn('Could not load specimens from IDB for background process monitor:', e);
    } finally {
      setIsLoadingSpecimens(false);
    }
  }, []);

  useEffect(() => {
    // 1. Subscribe to real-time queue status
    const unsubscribeQueue = subscribeToQueueStatus((newStatus) => {
      setStatus(newStatus);
    });

    // 2. Load specimens from IndexedDB
    loadSpecimens();

    // 3. Listen to specimen updates from worker
    const handleSpecimenUpdated = () => {
      loadSpecimens();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    }

    // Periodic refresh every 3s to stay synchronized
    const interval = setInterval(() => {
      loadSpecimens();
    }, 3000);

    return () => {
      unsubscribeQueue();
      if (typeof window !== 'undefined') {
        window.removeEventListener('banknote-specimen-updated', handleSpecimenUpdated);
      }
      clearInterval(interval);
    };
  }, [loadSpecimens]);

  // Derived specimen categories
  const pendingSpecimens = allSpecimens.filter(
    (s) => s.extractionStatus === 'pending' || status.queue.includes(s.id)
  );

  const extractingSpecimens = allSpecimens.filter(
    (s) => s.extractionStatus === 'extracting' || (status.activeJob && status.activeJob.specimenId === s.id)
  );

  const failedSpecimens = allSpecimens.filter(
    (s) => s.extractionStatus === 'failed'
  );

  const completedSpecimens = allSpecimens.filter(
    (s) => s.extractionStatus === 'completed'
  );

  const handlePause = useCallback(() => {
    pauseBackgroundQueue();
  }, []);

  const handleResume = useCallback(() => {
    resumeBackgroundQueue();
  }, []);

  const handleRescan = useCallback(async () => {
    addProcessLog('Manual database rescan triggered', 'info');
    await syncPendingSpecimensFromDB();
    await loadSpecimens();
  }, [loadSpecimens]);

  const handleRetryFailed = useCallback(async () => {
    await retryFailedSpecimens();
    await loadSpecimens();
  }, [loadSpecimens]);

  const handleClearLogs = useCallback(() => {
    clearProcessLogs();
  }, []);

  return {
    status,
    allSpecimens,
    pendingSpecimens,
    extractingSpecimens,
    failedSpecimens,
    completedSpecimens,
    isLoadingSpecimens,
    refreshSpecimens: loadSpecimens,
    pauseQueue: handlePause,
    resumeQueue: handleResume,
    rescanDatabase: handleRescan,
    retryFailed: handleRetryFailed,
    clearLogs: handleClearLogs,
  };
}
