import {
  addSpecimen,
  getSpecimen,
  updateSpecimen,
  getPendingSyncItems,
  updateSyncQueueStatus,
  removeSyncQueueItem,
  logSync,
  getSpecimensByStatus,
  updateSpecimenSyncStatus,
  addToSyncQueue,
} from './idb';
import type { LocalSpecimen } from '@/types';

export interface SyncRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: SyncRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 5,
};

export class SyncQueueManager {
  private isSync = false;
  private syncListeners: Set<(status: any) => void> = new Set();
  private retryConfig: SyncRetryConfig;

  constructor(retryConfig?: Partial<SyncRetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Get all pending specimens ready for sync
   */
  async getPendingSpecimens(): Promise<LocalSpecimen[]> {
    return getSpecimensByStatus('pending');
  }

  /**
   * Push pending specimens to backend
   */
  async syncPendingSpecimens(onProgress?: (current: number, total: number) => void): Promise<{
    synced: Array<{ localId: string; serverId: string }>;
    failed: Array<{ localId: string; error: string }>;
  }> {
    const pending = await this.getPendingSpecimens();
    const synced: Array<{ localId: string; serverId: string }> = [];
    const failed: Array<{ localId: string; error: string }> = [];

    if (pending.length === 0) {
      return { synced, failed };
    }

    this.isSync = true;
    this.notifyListeners({ status: 'syncing', total: pending.length, current: 0 });

    for (let i = 0; i < pending.length; i++) {
      const specimen = pending[i];
      onProgress?.(i + 1, pending.length);

      try {
        // Mark as syncing
        await updateSpecimenSyncStatus(specimen.id, 'syncing');
        this.notifyListeners({ status: 'syncing', total: pending.length, current: i + 1 });

        // Attempt to sync
        const response = await this.pushSpecimen(specimen);

        if (response.success && response.serverId) {
          // Mark as synced
          await updateSpecimenSyncStatus(specimen.id, 'synced', response.serverId);
          await logSync({
            localId: specimen.id,
            serverId: response.serverId,
            status: 'success',
            message: 'Synced successfully',
          });

          synced.push({ localId: specimen.id, serverId: response.serverId });
        } else {
          throw new Error(response.error || 'Unknown sync error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const retryCount = specimen.syncRetryCount || 0;

        if (retryCount < this.retryConfig.maxRetries) {
          // Schedule retry
          const delayMs = this.calculateBackoffDelay(retryCount);
          await updateSpecimenSyncStatus(specimen.id, 'pending', undefined, errorMessage);

          await logSync({
            localId: specimen.id,
            status: 'failed',
            message: `Will retry in ${Math.round(delayMs / 1000)}s: ${errorMessage}`,
          });

          failed.push({ localId: specimen.id, error: `Will retry: ${errorMessage}` });
        } else {
          // Max retries exceeded
          await updateSpecimenSyncStatus(specimen.id, 'failed', undefined, errorMessage);

          await logSync({
            localId: specimen.id,
            status: 'failed',
            message: `Max retries exceeded: ${errorMessage}`,
          });

          failed.push({ localId: specimen.id, error: `Max retries exceeded: ${errorMessage}` });
        }
      }
    }

    this.isSync = false;
    this.notifyListeners({ status: 'idle', synced: synced.length, failed: failed.length });

    return { synced, failed };
  }

  /**
   * Push a single specimen to backend
   */
  private async pushSpecimen(
    specimen: LocalSpecimen
  ): Promise<{ success: boolean; serverId?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('frontImage', specimen.frontImageBlob);
      formData.append('backImage', specimen.backImageBlob);
      if (specimen.notes) formData.append('notes', specimen.notes);
      formData.append('capturedAt', new Date(specimen.capturedAt).toISOString());

      const response = await fetch('/api/capture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        serverId: data.serverId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelayMs
    );
    return delay;
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    pendingCount: number;
    syncedCount: number;
    failedCount: number;
  }> {
    const pending = await getSpecimensByStatus('pending');
    const synced = await getSpecimensByStatus('synced');
    const failed = await getSpecimensByStatus('failed');

    return {
      isSyncing: this.isSync,
      pendingCount: pending.length,
      syncedCount: synced.length,
      failedCount: failed.length,
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(callback: (status: any) => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifyListeners(status: any) {
    this.syncListeners.forEach(listener => listener(status));
  }

  /**
   * Retry failed syncs
   */
  async retryFailedSpecimens(): Promise<void> {
    const failed = await getSpecimensByStatus('failed');

    for (const specimen of failed) {
      // Reset retry count and status to pending
      specimen.syncRetryCount = 0;
      specimen.syncStatus = 'pending';
      await updateSpecimen(specimen);
    }

    // Start sync
    await this.syncPendingSpecimens();
  }

  /**
   * Cancel pending sync
   */
  cancelSync(): void {
    this.isSync = false;
    this.notifyListeners({ status: 'cancelled' });
  }
}

// Singleton
let managerInstance: SyncQueueManager | null = null;

export function getSyncQueueManager(): SyncQueueManager {
  if (!managerInstance) {
    managerInstance = new SyncQueueManager();
  }
  return managerInstance;
}
