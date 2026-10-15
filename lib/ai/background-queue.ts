'use client';

import { getSpecimen, updateSpecimen, getAllSpecimens } from '@/lib/offline/idb';
import type { 
  LocalSpecimen, 
  ExtractionNotification, 
  AIExtraction, 
  BanknoteValuation,
  ActiveJobInfo,
  ProcessLogItem,
  QueueManagerStatus 
} from '@/types';
import { resolveBanknoteValuation } from '@/lib/valuation/valuation-service';

export function getCountryFlag(countryName?: string): string {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase();
  if (c.includes('philippine') || c.includes('filipino')) return '🇵🇭';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('brazil') || c.includes('brasil')) return '🇧🇷';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('bolivia')) return '🇧🇴';
  if (c.includes('mexico') || c.includes('méxico')) return '🇲🇽';
  if (c.includes('united states') || c.includes('usa') || c.includes('us') || c.includes('dollar')) return '🇺🇸';
  if (c.includes('india')) return '🇮🇳';
  if (c.includes('china')) return '🇨🇳';
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england') || c.includes('great britain')) return '🇬🇧';
  if (c.includes('japan')) return '🇯🇵';
  if (c.includes('germany') || c.includes('deutschland')) return '🇩🇪';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('italy')) return '🇮🇹';
  if (c.includes('spain') || c.includes('españa')) return '🇪🇸';
  if (c.includes('australia')) return '🇦🇺';
  if (c.includes('switzerland')) return '🇨🇭';
  if (c.includes('russia')) return '🇷🇺';
  if (c.includes('south africa')) return '🇿🇦';
  if (c.includes('egypt')) return '🇪🇬';
  if (c.includes('singapore')) return '🇸🇬';
  return '💵';
}

type NotificationListener = (notification: ExtractionNotification) => void;
const notificationListeners = new Set<NotificationListener>();

export function subscribeToExtractionNotifications(listener: NotificationListener): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

function notifyListeners(notification: ExtractionNotification) {
  notificationListeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (err) {
      console.error('Error in notification listener:', err);
    }
  });
}

// ============================================================================
// LIVE PROCESS MONITORING & QUEUE STATE
// ============================================================================

const extractionQueue: string[] = [];
let isProcessingQueue = false;
let isQueuePaused = false;
let processingStartedAt = 0;
let extractionInterval: NodeJS.Timeout | null = null;
let activeJobInfo: ActiveJobInfo | null = null;

const queueStats = {
  totalCompleted: 0,
  totalFailed: 0,
  lastCompletedAt: undefined as Date | undefined,
};

const processLogs: ProcessLogItem[] = [];
type QueueStatusListener = (status: QueueManagerStatus) => void;
const queueStatusListeners = new Set<QueueStatusListener>();

export function addProcessLog(
  message: string,
  level: 'info' | 'success' | 'warn' | 'error' = 'info',
  meta?: { specimenId?: string; country?: string; denomination?: string }
) {
  const log: ProcessLogItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date(),
    level,
    message,
    specimenId: meta?.specimenId,
    country: meta?.country,
    denomination: meta?.denomination,
  };
  processLogs.unshift(log);
  if (processLogs.length > 80) processLogs.pop(); // keep last 80 logs
  broadcastQueueStatus();
}

export function getQueueStatus(): QueueManagerStatus {
  return {
    isProcessing: isProcessingQueue,
    isPaused: isQueuePaused,
    activeJob: activeJobInfo,
    queue: [...extractionQueue],
    queueLength: extractionQueue.length,
    stats: { ...queueStats },
    recentLogs: [...processLogs],
  };
}

export function subscribeToQueueStatus(listener: QueueStatusListener): () => void {
  queueStatusListeners.add(listener);
  try {
    listener(getQueueStatus());
  } catch {}
  return () => {
    queueStatusListeners.delete(listener);
  };
}

function broadcastQueueStatus() {
  const status = getQueueStatus();
  queueStatusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.error('Error in queue status listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('banknote-queue-status-change', {
        detail: status,
      })
    );
  }
}

export function pauseBackgroundQueue() {
  isQueuePaused = true;
  addProcessLog('Background queue paused by user', 'warn');
  broadcastQueueStatus();
}

export function resumeBackgroundQueue() {
  isQueuePaused = false;
  addProcessLog('Background queue resumed', 'info');
  broadcastQueueStatus();
  processNextInQueue();
}

export function clearProcessLogs() {
  processLogs.length = 0;
  broadcastQueueStatus();
}

export async function retryFailedSpecimens(): Promise<number> {
  const all = await getAllSpecimens();
  let retried = 0;
  for (const s of all) {
    if (s.extractionStatus === 'failed') {
      await updateSpecimen({
        ...s,
        extractionStatus: 'pending',
        extractionError: undefined,
      });
      if (!extractionQueue.includes(s.id)) {
        extractionQueue.push(s.id);
        retried++;
      }
    }
  }
  if (retried > 0) {
    addProcessLog(`Re-enqueued ${retried} failed specimen(s) for retry`, 'info');
    broadcastQueueStatus();
    processNextInQueue();
  }
  return retried;
}

/**
 * Enqueue a specimen ID for background AI identification.
 * This returns immediately without waiting for the AI response.
 */
export function enqueueSpecimenForExtraction(specimenId: string) {
  if (!extractionQueue.includes(specimenId)) {
    extractionQueue.push(specimenId);
    addProcessLog(`Enqueued specimen ${specimenId} for background processing`, 'info', { specimenId });
  }
  broadcastQueueStatus();
  processNextInQueue();
}

function isSpecimenMissingValuation(specimen: LocalSpecimen): boolean {
  const ex = (specimen.extractedData || {}) as any;
  const colVal = ex.collectorMarketValue || ex.valuation?.collectorMarketValue;
  const pmgVal = ex.pmgValue || ex.valuation?.pmgValue;
  const numVal = ex.numistaValue || ex.valuation?.numistaValue;

  if (!colVal || !pmgVal || !numVal) return true;

  if (typeof colVal === 'string') {
    const trimmed = colVal.trim();
    if (trimmed === 'Valuation Pending' || trimmed === '—' || trimmed === '$150' || trimmed === '' || trimmed === 'undefined') {
      return true;
    }
  }
  return false;
}

/**
 * Scan IndexedDB for any specimens that are missing valuation
 * or have not yet completed AI extraction.
 */
export async function syncPendingSpecimensFromDB() {
  if (typeof window === 'undefined') return;
  try {
    // Safety watchdog: If queue processing has been busy for >12s, force unlock
    if (isProcessingQueue && Date.now() - processingStartedAt > 12000) {
      console.warn('[Background Worker] Queue was busy for >12s. Resetting lock.');
      isProcessingQueue = false;
    }

    const all = await getAllSpecimens();
    let queuedCount = 0;

    for (const specimen of all) {
      const ex = (specimen.extractedData || {}) as any;
      const isCorrupted =
        ex.countryOfOrigin === 'Canada' &&
        ex.denomination === '10 Dollars' &&
        ex.currency === 'CAD' &&
        !ex.pickNumber &&
        Boolean(specimen.frontImageBlob);

      const needsExtraction =
        specimen.extractionStatus !== 'completed' ||
        !ex.countryOfOrigin ||
        ex.countryOfOrigin === 'Unknown' ||
        isCorrupted;

      const needsValuation = isSpecimenMissingValuation(specimen);

      if ((needsExtraction || needsValuation) && !extractionQueue.includes(specimen.id)) {
        extractionQueue.push(specimen.id);
        queuedCount++;
      }
    }

    if (queuedCount > 0) {
      addProcessLog(`Database scan enqueued ${queuedCount} pending specimen(s)`, 'info');
      broadcastQueueStatus();
    }

    processNextInQueue();
  } catch (err) {
    console.warn('Could not scan pending specimens from IDB:', err);
  }
}

async function processNextInQueue() {
  if (isQueuePaused) return;
  if (isProcessingQueue) return;
  if (extractionQueue.length === 0) {
    activeJobInfo = null;
    broadcastQueueStatus();
    return;
  }

  isProcessingQueue = true;
  processingStartedAt = Date.now();
  const specimenId = extractionQueue.shift();

  if (!specimenId) {
    isProcessingQueue = false;
    activeJobInfo = null;
    broadcastQueueStatus();
    return;
  }

  try {
    const specimen = await getSpecimen(specimenId);
    if (!specimen) {
      isProcessingQueue = false;
      activeJobInfo = null;
      processNextInQueue();
      return;
    }

    const ex = (specimen.extractedData || {}) as any;

    // Detect if specimen was corrupted by previous hardcoded Canada fallback bug
    const isCorruptedByCanadaBug =
      ex.countryOfOrigin === 'Canada' &&
      ex.denomination === '10 Dollars' &&
      ex.currency === 'CAD' &&
      !ex.pickNumber &&
      Boolean(specimen.frontImageBlob);

    // Case 1: Specimen needs visual extraction from camera photos using Gemini Vision
    const needsVisualExtraction =
      Boolean(specimen.frontImageBlob) &&
      (specimen.extractionStatus !== 'completed' ||
        !ex.countryOfOrigin ||
        ex.countryOfOrigin === 'Unknown' ||
        ex.countryOfOrigin === 'World Banknote' ||
        isCorruptedByCanadaBug);

    if (needsVisualExtraction) {
      activeJobInfo = {
        specimenId: specimen.id,
        step: 'extracting',
        stepDescription: 'Running Gemini Vision AI (Gemini 3.5 Flash)...',
        startedAt: Date.now(),
      };
      addProcessLog(`Visual AI extraction started for ${specimen.id}`, 'info', { specimenId: specimen.id });
      broadcastQueueStatus();

      await updateSpecimen({
        ...specimen,
        extractionStatus: 'extracting',
      });

      let extraction: AIExtraction | null = null;
      let extractErrorMsg: string | undefined = undefined;

      try {
        const formData = new FormData();
        const frontName = specimen.frontImageBlob.type?.includes('webp')
          ? 'front.webp'
          : specimen.frontImageBlob.type?.includes('png')
          ? 'front.png'
          : 'front.jpg';
        const backBlob = specimen.backImageBlob || specimen.frontImageBlob;
        const backName = backBlob.type?.includes('webp')
          ? 'back.webp'
          : backBlob.type?.includes('png')
          ? 'back.png'
          : 'back.jpg';

        formData.append('frontImage', specimen.frontImageBlob, frontName);
        formData.append('backImage', backBlob, backName);

        const response = await fetch('/api/ai/extract', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            extraction = result.data;
          } else {
            extractErrorMsg = result?.error || 'AI extraction failed';
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          extractErrorMsg = errJson?.error || `AI extraction HTTP error ${response.status}`;
        }
      } catch (extractErr: any) {
        extractErrorMsg = extractErr?.message || 'AI visual extraction network error';
        console.warn(`[Background Queue] AI visual extraction skipped/failed for ${specimenId}:`, extractErr);
      }

      if (!extraction) {
        queueStats.totalFailed++;
        addProcessLog(`Visual AI extraction failed for ${specimenId}: ${extractErrorMsg}`, 'error', { specimenId: specimen.id });
        await updateSpecimen({
          ...specimen,
          extractionStatus: 'failed',
          extractionError: extractErrorMsg || 'Visual identification failed',
        });
        activeJobInfo = null;
        isProcessingQueue = false;
        broadcastQueueStatus();
        setTimeout(() => processNextInQueue(), 250);
        return;
      }

      activeJobInfo = {
        specimenId: specimen.id,
        step: 'evaluating',
        stepDescription: `Resolving valuation for ${extraction.countryOfOrigin} ${extraction.denomination}...`,
        startedAt: Date.now(),
        country: extraction.countryOfOrigin,
        denomination: extraction.denomination,
      };
      addProcessLog(
        `Identified: ${extraction.countryOfOrigin} ${extraction.denomination} (${extraction.conditionGrade || 'UNC'})`,
        'success',
        { specimenId: specimen.id, country: extraction.countryOfOrigin, denomination: extraction.denomination }
      );
      broadcastQueueStatus();

      // Resolve valuation with the true extracted attributes
      let valuation: BanknoteValuation | undefined = undefined;
      const valPayload = {
        countryOfOrigin: extraction.countryOfOrigin,
        denomination: extraction.denomination,
        currency: extraction.currency,
        pickNumber: extraction.pickNumber,
        issueYear: extraction.issueYear,
        conditionGrade: extraction.conditionGrade,
        isReplacementNote: extraction.isReplacementNote,
        fancySerialType: extraction.fancySerialType,
        serialNumeric: extraction.serialNumeric,
      };

      try {
        const valRes = await fetch(`/api/valuation/${specimen.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(valPayload),
        });
        if (valRes.ok) {
          const valJson = await valRes.json();
          valuation = valJson?.data || valJson;
        }
      } catch (valErr) {
        console.warn('[Background Worker] Server valuation call failed, falling back:', valErr);
      }

      if (!valuation || !valuation.collectorMarketValue) {
        valuation = await resolveBanknoteValuation(valPayload);
      }

      const updatedSpecimen: LocalSpecimen = {
        ...specimen,
        extractionStatus: 'completed',
        extractionError: undefined,
        extractedData: {
          ...(specimen.extractedData || {}),
          ...extraction,
          valuation,
          collectorMarketValue: valuation?.collectorMarketValue || '$1.50',
          numistaValue: valuation?.numistaValue || '$1.50',
          pmgValue: valuation?.pmgValue || '$1.80',
          ebayLastSold: valuation?.ebayLastSold,
          ebaySoldUrl: valuation?.ebaySoldUrl,
          country: extraction.countryOfOrigin,
          countryOfOrigin: extraction.countryOfOrigin,
          denomination: extraction.denomination,
          pickNumber: extraction.pickNumber || undefined,
          fullSerialNumber: extraction.fullSerialNumber || undefined,
          issueYear: extraction.issueYear || undefined,
          seriesDate: extraction.seriesDate || undefined,
          conditionGrade: extraction.conditionGrade || undefined,
          machineEstimatedGrade: extraction.machineEstimatedGrade || undefined,
          currency: extraction.currency || undefined,
          fancySerialType: extraction.fancySerialType || undefined,
          isReplacementNote: extraction.isReplacementNote,
          signature1Name: extraction.signature1Name || undefined,
          signature1Title: extraction.signature1Title || undefined,
          signature2Name: extraction.signature2Name || undefined,
          signature2Title: extraction.signature2Title || undefined,
          watermarks: extraction.watermarks || undefined,
          securityFeatures: extraction.securityFeatures || undefined,
          notes: extraction.notes || undefined,
          defectsAndAnomalies: extraction.defectsAndAnomalies || undefined,
        },
      };

      await updateSpecimen(updatedSpecimen);

      if (specimen.serverId) {
        try {
          await fetch(`/api/banknotes/${specimen.serverId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...extraction,
              collectorMarketValue: valuation?.collectorMarketValue,
              numistaPmgValue: valuation?.numistaValue,
            }),
          });
        } catch (patchErr) {
          console.warn('Server patch skipped for background extraction:', patchErr);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('banknote-specimen-updated', {
            detail: { specimenId: specimen.id, valuation, extraction },
          })
        );
      }

      let thumbUrl: string | undefined;
      try {
        thumbUrl = URL.createObjectURL(specimen.frontImageBlob);
      } catch {}

      const countryName = extraction.countryOfOrigin || 'Banknote';
      const flag = getCountryFlag(countryName);

      notifyListeners({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        specimenId: specimen.id,
        country: countryName,
        countryFlag: flag,
        denomination: extraction.denomination || 'Specimen',
        pickNumber: extraction.pickNumber || undefined,
        serialNumber: extraction.fullSerialNumber || extraction.serialNumeric || undefined,
        conditionGrade: extraction.conditionGrade || undefined,
        issueYear: extraction.issueYear || extraction.seriesDate || undefined,
        valuation: valuation?.collectorMarketValue,
        thumbnailUrl: thumbUrl,
        status: 'completed',
        message: valuation?.collectorMarketValue
          ? `Valuation: ${valuation.collectorMarketValue}`
          : 'AI Identification Complete',
        timestamp: new Date(),
      });

      queueStats.totalCompleted++;
      queueStats.lastCompletedAt = new Date();
      addProcessLog(
        `Completed: ${extraction.countryOfOrigin} ${extraction.denomination} — ${valuation?.collectorMarketValue || '$1.50'}`,
        'success',
        { specimenId: specimen.id, country: extraction.countryOfOrigin, denomination: extraction.denomination }
      );

      activeJobInfo = null;
      isProcessingQueue = false;
      broadcastQueueStatus();
      setTimeout(() => processNextInQueue(), 250);
      return;
    }

    // Case 2: Specimen has ALREADY been visually extracted, but needs valuation calculation
    const missingValuation = isSpecimenMissingValuation(specimen);
    if (missingValuation) {
      activeJobInfo = {
        specimenId: specimen.id,
        step: 'evaluating',
        stepDescription: `Evaluating existing note ${ex.countryOfOrigin || 'Unknown'} ${ex.denomination || ''}...`,
        startedAt: Date.now(),
        country: ex.countryOfOrigin,
        denomination: ex.denomination,
      };
      addProcessLog(`Valuation query started for ${specimen.id}`, 'info', { specimenId: specimen.id });
      broadcastQueueStatus();

      const valPayload = {
        countryOfOrigin: ex.countryOfOrigin || ex.country || 'Unknown',
        denomination: ex.denomination || 'Unknown',
        currency: ex.currency || 'USD',
        pickNumber: ex.pickNumber,
        issueYear: ex.issueYear,
        conditionGrade: ex.conditionGrade || 'UNC',
        isReplacementNote: ex.isReplacementNote,
        fancySerialType: ex.fancySerialType,
        serialNumeric: ex.serialNumeric || ex.fullSerialNumber,
      };

      let valData: any = null;
      try {
        const apiRes = await fetch(`/api/valuation/${specimen.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(valPayload),
        });
        if (apiRes.ok) {
          const json = await apiRes.json();
          valData = json?.data || json;
        }
      } catch (apiErr) {
        console.warn('[Background Worker] Server valuation API call error, using local fallback:', apiErr);
      }

      if (!valData || !valData.collectorMarketValue) {
        valData = await resolveBanknoteValuation(valPayload);
      }

      await updateSpecimen({
        ...specimen,
        extractionStatus: 'completed',
        extractedData: {
          ...ex,
          ...valPayload,
          valuation: valData,
          collectorMarketValue: valData.collectorMarketValue,
          pmgValue: valData.pmgValue,
          numistaValue: valData.numistaValue,
          ebayLastSold: valData.ebayLastSold,
          ebaySoldUrl: valData.ebaySoldUrl,
        },
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('banknote-specimen-updated', {
            detail: { specimenId: specimen.id, valuation: valData },
          })
        );
      }

      queueStats.totalCompleted++;
      queueStats.lastCompletedAt = new Date();
      addProcessLog(`Valuation resolved for ${specimen.id}: ${valData?.collectorMarketValue || '$1.50'}`, 'success', {
        specimenId: specimen.id,
        country: ex.countryOfOrigin,
        denomination: ex.denomination,
      });

      activeJobInfo = null;
      isProcessingQueue = false;
      broadcastQueueStatus();
      setTimeout(() => processNextInQueue(), 250);
      return;
    }
  } catch (err: any) {
    queueStats.totalFailed++;
    addProcessLog(`Queue error processing ${specimenId}: ${err?.message || err}`, 'error', { specimenId });
    console.warn(`Background extraction failed for ${specimenId}:`, err);
  } finally {
    activeJobInfo = null;
    isProcessingQueue = false;
    broadcastQueueStatus();
    setTimeout(() => {
      processNextInQueue();
    }, 300);
  }
}

/**
 * Initializes the background worker. Keeps running continuously
 * across all page navigations.
 */
export function startBackgroundExtractionWorker(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Clean up any stale interval first
  if (extractionInterval) {
    clearInterval(extractionInterval);
    extractionInterval = null;
  }

  // Immediate sync on start
  syncPendingSpecimensFromDB();

  // Periodic check every 4 seconds for any newly queued specimens
  extractionInterval = setInterval(() => {
    syncPendingSpecimensFromDB();
  }, 4000);

  return () => {
    if (extractionInterval) {
      clearInterval(extractionInterval);
      extractionInterval = null;
    }
  };
}
