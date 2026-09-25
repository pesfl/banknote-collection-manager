import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { LocalSpecimen } from '@/types';

interface BanknoteDB extends DBSchema {
  specimens: {
    key: string;
    value: LocalSpecimen;
    indexes: {
      'by-sync-status': 'pending' | 'syncing' | 'synced' | 'failed';
      'by-captured-at': Date;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      localId: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';
      retryCount: number;
      errorMessage?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: {
      'by-status': 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED';
      'by-local-id': string;
    };
  };
  syncLog: {
    key: string;
    value: {
      id: string;
      localId: string;
      serverId?: string;
      status: 'success' | 'failed';
      message?: string;
      timestamp: Date;
    };
  };
}

let db: IDBPDatabase<BanknoteDB> | null = null;

const DB_NAME = 'banknote-collection-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<BanknoteDB>> {
  if (db) return db;

  db = await openDB<BanknoteDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Specimens store
      if (!db.objectStoreNames.contains('specimens')) {
        const specimenStore = db.createObjectStore('specimens', { keyPath: 'id' });
        specimenStore.createIndex('by-sync-status', 'syncStatus');
        specimenStore.createIndex('by-captured-at', 'capturedAt');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('by-status', 'status');
        queueStore.createIndex('by-local-id', 'localId');
      }

      // Sync log store
      if (!db.objectStoreNames.contains('syncLog')) {
        db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  return db;
}

// ============================================================================
// SPECIMEN OPERATIONS
// ============================================================================

export async function addSpecimen(specimen: LocalSpecimen): Promise<string> {
  const idb = await initDB();
  return idb.add('specimens', specimen);
}

export async function getSpecimen(id: string): Promise<LocalSpecimen | undefined> {
  const idb = await initDB();
  return idb.get('specimens', id);
}

export async function updateSpecimen(specimen: LocalSpecimen): Promise<IDBValidKey> {
  const idb = await initDB();
  return idb.put('specimens', specimen);
}

export async function deleteSpecimen(id: string): Promise<void> {
  const idb = await initDB();
  await idb.delete('specimens', id);
}

export async function getAllSpecimens(): Promise<LocalSpecimen[]> {
  const idb = await initDB();
  return idb.getAll('specimens');
}

export async function getSpecimensByStatus(
  status: 'pending' | 'syncing' | 'synced' | 'failed'
): Promise<LocalSpecimen[]> {
  const idb = await initDB();
  return idb.getAllFromIndex('specimens', 'by-sync-status', status);
}

export async function getRecentSpecimens(limit: number = 20): Promise<LocalSpecimen[]> {
  const idb = await initDB();
  const all = await idb.getAllFromIndex('specimens', 'by-captured-at');
  return all.reverse().slice(0, limit);
}

export async function updateSpecimenSyncStatus(
  id: string,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  serverId?: string,
  errorMessage?: string
): Promise<void> {
  const idb = await initDB();
  const specimen = await idb.get('specimens', id);

  if (!specimen) {
    throw new Error(`Specimen ${id} not found`);
  }

  specimen.syncStatus = status;
  if (serverId) specimen.serverId = serverId;
  if (errorMessage) {
    // Store error for retry
  }
  specimen.lastSyncAttempt = new Date();

  if (status === 'failed') {
    specimen.syncRetryCount = (specimen.syncRetryCount || 0) + 1;
  }

  await idb.put('specimens', specimen);
}

export async function getSpecimenCountByStatus(): Promise<{
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
}> {
  const idb = await initDB();
  const specimens = await idb.getAll('specimens');

  return {
    pending: specimens.filter(s => s.syncStatus === 'pending').length,
    syncing: specimens.filter(s => s.syncStatus === 'syncing').length,
    synced: specimens.filter(s => s.syncStatus === 'synced').length,
    failed: specimens.filter(s => s.syncStatus === 'failed').length,
  };
}

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

export async function addToSyncQueue(item: {
  localId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  retryCount?: number;
}): Promise<string> {
  const idb = await initDB();
  const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return idb.add('syncQueue', {
    id,
    localId: item.localId,
    action: item.action,
    status: 'PENDING',
    retryCount: item.retryCount || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getPendingSyncItems() {
  const idb = await initDB();
  return idb.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
}

export async function updateSyncQueueStatus(
  id: string,
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'FAILED',
  errorMessage?: string
): Promise<void> {
  const idb = await initDB();
  const item = await idb.get('syncQueue', id);

  if (!item) return;

  item.status = status;
  if (errorMessage) item.errorMessage = errorMessage;
  item.updatedAt = new Date();

  if (status === 'FAILED') {
    item.retryCount += 1;
  }

  await idb.put('syncQueue', item);
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const idb = await initDB();
  await idb.delete('syncQueue', id);
}

// ============================================================================
// SYNC LOG OPERATIONS
// ============================================================================

export async function logSync(entry: {
  localId: string;
  serverId?: string;
  status: 'success' | 'failed';
  message?: string;
}): Promise<void> {
  const idb = await initDB();
  await idb.add('syncLog', {
    id: `log_${Date.now()}`,
    ...entry,
    timestamp: new Date(),
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function clearAllSpecimens(): Promise<void> {
  const idb = await initDB();
  await idb.clear('specimens');
}

export async function clearAllSyncData(): Promise<void> {
  const idb = await initDB();
  await idb.clear('syncQueue');
  await idb.clear('syncLog');
}

export async function getStorageStats(): Promise<{
  specimenCount: number;
  syncQueueCount: number;
  estimatedSize: string;
}> {
  const idb = await initDB();
  const specimens = await idb.getAll('specimens');
  const syncQueue = await idb.getAll('syncQueue');

  // Very rough estimation: each blob ~500KB average
  const estimatedSize = specimens.length * 500 * 1024; // bytes

  return {
    specimenCount: specimens.length,
    syncQueueCount: syncQueue.length,
    estimatedSize: formatBytes(estimatedSize),
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
