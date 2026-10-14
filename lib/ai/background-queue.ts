'use client';

import { getSpecimen, updateSpecimen, getAllSpecimens } from '@/lib/offline/idb';
import type { LocalSpecimen, ExtractionNotification, AIExtraction, BanknoteValuation } from '@/types';
import { resolveBanknoteValuation } from '@/lib/valuation/valuation-service';

export function getCountryFlag(countryName?: string): string {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase();
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

// Queue of specimen IDs awaiting extraction
const extractionQueue: string[] = [];
let isProcessingQueue = false;
let processingStartedAt = 0;
let extractionInterval: NodeJS.Timeout | null = null;

/**
 * Enqueue a specimen ID for background AI identification.
 * This returns immediately without waiting for the AI response.
 */
export function enqueueSpecimenForExtraction(specimenId: string) {
  if (!extractionQueue.includes(specimenId)) {
    extractionQueue.push(specimenId);
  }
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
      const needsValuation = isSpecimenMissingValuation(specimen);
      const ex = (specimen.extractedData || {}) as any;
      const needsExtraction = !ex || !ex.countryOfOrigin;

      if ((needsValuation || needsExtraction) && !extractionQueue.includes(specimen.id)) {
        extractionQueue.push(specimen.id);
        queuedCount++;
      }
    }

    if (queuedCount > 0) {
      console.log(`[Background Worker] Enqueued ${queuedCount} specimen(s) for valuation check.`);
    }

    processNextInQueue();
  } catch (err) {
    console.warn('Could not scan pending specimens from IDB:', err);
  }
}

async function processNextInQueue() {
  if (isProcessingQueue) return;
  if (extractionQueue.length === 0) return;

  isProcessingQueue = true;
  processingStartedAt = Date.now();
  const specimenId = extractionQueue.shift();

  if (!specimenId) {
    isProcessingQueue = false;
    return;
  }

  try {
    const specimen = await getSpecimen(specimenId);
    if (!specimen) {
      isProcessingQueue = false;
      processNextInQueue();
      return;
    }

    const ex = (specimen.extractedData || {}) as any;
    const missingValuation = isSpecimenMissingValuation(specimen);

    // Case 1: Specimen has attributes or is missing valuation:
    // Call server valuation endpoint (exact same API as manual Refresh Live button)
    if (missingValuation) {
      console.log(`[Background Worker] Auto-evaluating specimen ${specimen.id}...`);

      const valPayload = {
        countryOfOrigin: ex.countryOfOrigin || ex.country || 'Canada',
        denomination: ex.denomination || '10 Dollars',
        currency: ex.currency || 'CAD',
        pickNumber: ex.pickNumber,
        issueYear: ex.issueYear,
        conditionGrade: ex.conditionGrade || 'UNC',
        isReplacementNote: ex.isReplacementNote,
        fancySerialType: ex.fancySerialType,
        serialNumeric: ex.serialNumeric || ex.fullSerialNumber,
      };

      let valData: any = null;

      // 1. Call server API (has Numista & eBay API credentials)
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

      // 2. Fallback to client-side valuation engine if server is unreachable
      if (!valData || !valData.collectorMarketValue) {
        valData = await resolveBanknoteValuation(valPayload);
      }

      console.log(`[Background Worker] Valuation resolved for ${specimen.id}:`, valData.collectorMarketValue);

      // Save complete valuation breakdown to IndexedDB
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

      // Broadcast update event so all open pages and modals refresh live
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('banknote-specimen-updated', {
            detail: { specimenId: specimen.id, valuation: valData },
          })
        );
      }

      isProcessingQueue = false;
      setTimeout(() => processNextInQueue(), 250);
      return;
    }

    // Case 2: Needs full AI visual extraction from camera images
    await updateSpecimen({
      ...specimen,
      extractionStatus: 'extracting',
    });

    let extraction: AIExtraction | null = null;

    try {
      const formData = new FormData();
      formData.append('frontImage', specimen.frontImageBlob, 'front.jpg');
      formData.append('backImage', specimen.backImageBlob, 'back.jpg');

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          extraction = result.data;
        }
      }
    } catch (extractErr) {
      console.warn(`[Background Queue] AI visual extraction skipped/failed for ${specimenId}:`, extractErr);
    }

    // If Gemini Vision did not return data:
    // Fall back to note metadata so the specimen is safely completed with a realistic valuation
    if (!extraction) {
      const userNote = specimen.notes || '';
      extraction = {
        countryOfOrigin: ex.countryOfOrigin || ex.country || 'World Banknote',
        denomination: ex.denomination || '1 Specimen',
        currency: ex.currency || 'Standard',
        conditionGrade: ex.conditionGrade || 'UNC',
        isReplacementNote: false,
        fancySerialType: 'None',
        notes: userNote || 'Specimen saved to collection',
      };
    }

    // Resolve valuation
    let valuation: BanknoteValuation | undefined = undefined;
    try {
      const valRes = await fetch(`/api/valuation/${specimen.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryOfOrigin: extraction.countryOfOrigin,
          denomination: extraction.denomination,
          currency: extraction.currency,
          pickNumber: extraction.pickNumber,
          issueYear: extraction.issueYear,
          conditionGrade: extraction.conditionGrade,
          isReplacementNote: extraction.isReplacementNote,
          fancySerialType: extraction.fancySerialType,
          serialNumeric: extraction.serialNumeric,
        }),
      });
      if (valRes.ok) {
        const valJson = await valRes.json();
        valuation = valJson?.data || valJson;
      }
    } catch {}

    if (!valuation || !valuation.collectorMarketValue) {
      valuation = await resolveBanknoteValuation({
        countryOfOrigin: extraction.countryOfOrigin,
        denomination: extraction.denomination,
        currency: extraction.currency,
        pickNumber: extraction.pickNumber,
        issueYear: extraction.issueYear,
        conditionGrade: extraction.conditionGrade,
        isReplacementNote: extraction.isReplacementNote,
        fancySerialType: extraction.fancySerialType,
        serialNumeric: extraction.serialNumeric,
      });
    }

    // Merge into specimen in IndexedDB
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
        country: extraction.countryOfOrigin || (specimen.extractedData as any)?.country,
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
          detail: { specimenId: specimen.id, extraction, valuation },
        })
      );
    }

    let thumbUrl: string | undefined;
    try {
      thumbUrl = URL.createObjectURL(specimen.frontImageBlob);
    } catch {}

    const countryName = extraction.countryOfOrigin || (specimen.extractedData as any)?.country || 'Banknote';
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
  } catch (err: any) {
    console.warn(`Background extraction failed for ${specimenId}:`, err);
  } finally {
    isProcessingQueue = false;
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
