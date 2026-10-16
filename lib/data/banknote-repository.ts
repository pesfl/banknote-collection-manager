import type { Banknote, LocalSpecimen } from '@/types';
import { getAllSpecimens, getSpecimen } from '@/lib/offline/idb';

export const MOCK_BANKNOTES: Banknote[] = [];


export function getSafeBlobUrl(blob?: any): string | undefined {
  if (!blob) return undefined;
  try {
    if (blob instanceof Blob || (typeof blob === 'object' && blob.size)) {
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn('Could not create object URL for blob:', e);
  }
  return undefined;
}

export function mapLocalSpecimenToBanknote(l: LocalSpecimen): Banknote {
  const ex = (l.extractedData || {}) as any;
  const frontUrl = getSafeBlobUrl(l.frontImageBlob);
  const backUrl = getSafeBlobUrl(l.backImageBlob);

  return {
    id: l.id,
    userId: 'local',
    isReplacementNote: Boolean(ex.isReplacementNote),
    countryOfOrigin: ex.countryOfOrigin || ex.country || 'Unknown Country',
    denomination: ex.denomination || 'Unknown',
    currency: ex.currency || '',
    pickNumber: ex.pickNumber || 'P-Pending',
    issueYear: ex.issueYear || undefined,
    seriesDate: ex.seriesDate || undefined,
    fullSerialNumber: ex.fullSerialNumber || ex.serialNumeric || 'Local IDB',
    serialPrefix: ex.serialPrefix || undefined,
    serialNumeric: ex.serialNumeric || undefined,
    serialSuffix: ex.serialSuffix || undefined,
    conditionGrade: ex.conditionGrade || 'UNC',
    machineEstimatedGrade: ex.machineEstimatedGrade || undefined,
    fancySerialType: ex.fancySerialType || 'None',
    errorType: ex.errorType || undefined,
    defectsAndAnomalies: ex.defectsAndAnomalies || undefined,
    signature1Name: ex.signature1Name || undefined,
    signature1Title: ex.signature1Title || undefined,
    signature2Name: ex.signature2Name || undefined,
    signature2Title: ex.signature2Title || undefined,
    watermarks: ex.watermarks || undefined,
    securityFeatures: ex.securityFeatures || undefined,
    storageBox: ex.storageBox || undefined,
    storageSection: ex.storageSection || undefined,
    storagePosition: ex.storagePosition || undefined,
    frontImageUrl: frontUrl,
    backImageUrl: backUrl,
    displayImageUrl: frontUrl,
    notes: ex.notes || l.notes || 'Specimen captured locally.',
    collectorMarketValue: ex.collectorMarketValue || ex.valuation?.collectorMarketValue || undefined,
    numistaPmgValue: ex.numistaValue || ex.valuation?.numistaValue || ex.pmgValue || undefined,
    pmgValue: ex.pmgValue || ex.valuation?.pmgValue || undefined,
    numistaValue: ex.numistaValue || ex.valuation?.numistaValue || undefined,
    ebayLastSold: ex.ebayLastSold || ex.valuation?.ebayLastSold || undefined,
    ebaySoldUrl: ex.ebaySoldUrl || ex.valuation?.ebaySoldUrl || undefined,
    ebayActiveUrl: ex.ebayActiveUrl || ex.valuation?.ebayActiveUrl || undefined,
    acquisitionDate: l.capturedAt ? new Date(l.capturedAt) : undefined,
    acquisitionSource: 'Direct Camera Capture',
    purchasePrice: ex.purchasePrice ? Number(ex.purchasePrice) : undefined,
    createdAt: l.capturedAt ? new Date(l.capturedAt) : new Date(),
    updatedAt: l.capturedAt ? new Date(l.capturedAt) : new Date(),
    syncStatus: l.syncStatus,
    extractionStatus: l.extractionStatus,
    extractionError: l.extractionError,
  } as any;
}

export async function getBanknoteById(id: string): Promise<Banknote | null> {
  // 1. Check local IndexedDB (browser)
  if (typeof window !== 'undefined') {
    try {
      const local = await getSpecimen(id);
      if (local) {
        return mapLocalSpecimenToBanknote(local);
      }
    } catch (err) {
      console.warn(`Could not check IndexedDB for specimen ${id}:`, err);
    }

    // 2. Query cloud database API
    try {
      const res = await fetch(`/api/banknotes/${id}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data?.banknote) return data.banknote;
      }
    } catch {}
  }

  // 3. Check Mock / Catalog banknotes
  const found = MOCK_BANKNOTES.find(
    (b) => b.id?.toLowerCase() === id?.toLowerCase() || b.fullSerialNumber?.toLowerCase() === id?.toLowerCase()
  );
  if (found) return found;

  return null;
}

export async function getAllBanknotes(): Promise<Banknote[]> {
  const list: Banknote[] = [];
  const seenIds = new Set<string>();

  // 1. Load local IndexedDB (browser)
  if (typeof window !== 'undefined') {
    try {
      const locals = await getAllSpecimens();
      if (locals && locals.length > 0) {
        for (const loc of locals) {
          const mapped = mapLocalSpecimenToBanknote(loc);
          if (mapped.id) seenIds.add(mapped.id);
          list.push(mapped);
        }
      }
    } catch (err) {
      console.warn('Error loading specimens from IndexedDB:', err);
    }

    // 2. Query cloud database API
    try {
      const res = await fetch('/api/banknotes').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data?.banknotes && Array.isArray(data.banknotes)) {
          for (const note of data.banknotes) {
            if (note.id && !seenIds.has(note.id)) {
              seenIds.add(note.id);
              list.push(note);
            }
          }
        }
      }
    } catch {}
  }

  // 3. Add mock banknotes (deduplicated)
  for (const mock of MOCK_BANKNOTES) {
    if (mock.id && !seenIds.has(mock.id)) {
      list.push(mock);
    }
  }

  return list;
}

