import type { Banknote, LocalSpecimen } from '@/types';
import { getAllSpecimens, getSpecimen } from '@/lib/offline/idb';

export const MOCK_BANKNOTES: Banknote[] = [
  {
    id: 'BN-000142',
    userId: 'user1',
    countryOfOrigin: 'Canada',
    denomination: '1,000 Dollars',
    currency: 'Canadian Dollar',
    pickNumber: 'P-45a',
    issueYear: '1954',
    seriesDate: '1954',
    fullSerialNumber: 'A1234567',
    serialPrefix: 'A',
    serialNumeric: '1234567',
    serialSuffix: '',
    signature1Name: 'Beattie',
    signature1Title: 'Deputy Governor',
    signature2Name: 'Coyne',
    signature2Title: 'Governor',
    watermarks: 'Queen Elizabeth II',
    securityFeatures: 'Security Thread, Intaglio Printing, Planchettes',
    conditionGrade: 'UNC',
    machineEstimatedGrade: 'UNC',
    fancySerialType: 'None',
    isReplacementNote: false,
    errorType: 'None',
    defectsAndAnomalies: 'None. Crisp original paper with virgin embossed intaglio feel.',
    storageBox: 'Box A',
    storageSection: 'Section 1',
    storagePosition: 'Position 01',
    frontImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=1000&auto=format&fit=crop&q=80',
    backImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=1000&auto=format&fit=crop&q=80',
    displayImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=1000&auto=format&fit=crop&q=80',
    notes: 'Great color and eye appeal. Original crisp paper with excellent margins. Iconic Devil\'s Face portrait series.',
    numistaPmgValue: '$2,450.00',
    collectorMarketValue: '$2,750.00',
    acquisitionDate: new Date('2025-08-26'),
    acquisitionSource: 'Heritage Auctions',
    purchasePrice: 2300,
    createdAt: new Date('2025-08-26T14:30:00Z'),
    updatedAt: new Date('2025-08-26T14:30:00Z'),
  },
  {
    id: 'BN-000143',
    userId: 'user1',
    countryOfOrigin: 'Brazil',
    denomination: '100 Cruzados',
    currency: 'Cruzados',
    pickNumber: 'P-211c',
    issueYear: '1986',
    seriesDate: '1986',
    fullSerialNumber: '97.151.001 C',
    serialPrefix: '97',
    serialNumeric: '151001',
    serialSuffix: 'C',
    signature1Name: 'Funaro',
    signature1Title: 'Minister of Finance',
    signature2Name: 'Sayad',
    signature2Title: 'Central Bank President',
    watermarks: 'Effigy of Republic',
    securityFeatures: 'Microprinting, Security thread, Latent image',
    conditionGrade: 'UNC',
    machineEstimatedGrade: 'UNC',
    fancySerialType: 'LowNumber',
    isReplacementNote: false,
    errorType: 'None',
    defectsAndAnomalies: 'None',
    storageBox: 'Box 01',
    storageSection: 'Section A',
    storagePosition: 'Position 23',
    frontImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=1000&auto=format&fit=crop&q=80',
    backImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=1000&auto=format&fit=crop&q=80',
    displayImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=1000&auto=format&fit=crop&q=80',
    notes: 'Crisp uncirculated specimen from original 100-note bank bundle. Features Juscelino Kubitschek.',
    numistaPmgValue: '$15.00',
    collectorMarketValue: '$16.00',
    acquisitionDate: new Date('2026-02-10'),
    acquisitionSource: 'Collector Exchange',
    purchasePrice: 10,
    createdAt: new Date('2026-02-10T09:15:00Z'),
    updatedAt: new Date('2026-02-10T09:15:00Z'),
  },
  {
    id: 'BN-000144',
    userId: 'user1',
    countryOfOrigin: 'United States',
    denomination: '$100',
    currency: 'US Dollar',
    pickNumber: 'P-540',
    issueYear: '2013',
    seriesDate: '2013',
    fullSerialNumber: 'L12345678A',
    serialPrefix: 'L',
    serialNumeric: '12345678',
    serialSuffix: 'A',
    signature1Name: 'Jacob Lew',
    signature1Title: 'Secretary of Treasury',
    signature2Name: 'Ben Bernanke',
    signature2Title: 'Federal Reserve Chair',
    watermarks: 'Benjamin Franklin',
    securityFeatures: '3D Security Ribbon, Bell in Inkwell, Microprinting, Color-Shifting Ink 100',
    conditionGrade: 'AU',
    machineEstimatedGrade: 'AU',
    fancySerialType: 'Ladder',
    isReplacementNote: false,
    errorType: 'None',
    defectsAndAnomalies: 'Light handling crease',
    storageBox: 'Box B',
    storageSection: 'Section 2',
    storagePosition: 'Position 05',
    frontImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=1000&auto=format&fit=crop&q=80',
    backImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=1000&auto=format&fit=crop&q=80',
    displayImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=1000&auto=format&fit=crop&q=80',
    notes: 'Bright, crisp note with vibrant colors. Minimal handling. Rare true ascending 12345678 ladder serial.',
    numistaPmgValue: '$125.00',
    collectorMarketValue: '$145.00',
    acquisitionDate: new Date('2024-11-15'),
    acquisitionSource: 'Dealer Direct',
    purchasePrice: 120,
    createdAt: new Date('2024-11-15T18:00:00Z'),
    updatedAt: new Date('2024-11-15T18:00:00Z'),
  },
  {
    id: 'BN-000145',
    userId: 'user1',
    countryOfOrigin: 'Bolivia',
    denomination: '10 Bolivianos',
    currency: 'Boliviano',
    pickNumber: 'P-327c',
    issueYear: '1986',
    seriesDate: '1986',
    fullSerialNumber: '87654321',
    serialPrefix: '',
    serialNumeric: '87654321',
    serialSuffix: '',
    signature1Name: 'Funaro',
    signature1Title: 'Signatory A',
    signature2Name: 'Sayad',
    signature2Title: 'Signatory B',
    watermarks: 'Cecilio Guzmán de Rojas',
    securityFeatures: 'Security Thread, Watermark, Latent Value',
    conditionGrade: 'AU',
    machineEstimatedGrade: 'AU',
    fancySerialType: 'Ladder',
    isReplacementNote: false,
    errorType: 'None',
    defectsAndAnomalies: 'Minor corner crease',
    storageBox: 'Box C',
    storageSection: 'Section 3',
    storagePosition: 'Position 10',
    frontImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000&auto=format&fit=crop&q=80',
    backImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000&auto=format&fit=crop&q=80',
    displayImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1000&auto=format&fit=crop&q=80',
    notes: 'Reverse ladder fancy serial. Discrepancy logged between PMG P-327b and Numista P-327c.',
    numistaPmgValue: '$35.00',
    collectorMarketValue: '$45.00',
    acquisitionDate: new Date('2025-01-20'),
    acquisitionSource: 'Online Auction',
    purchasePrice: 35,
    createdAt: new Date('2025-01-20T11:20:00Z'),
    updatedAt: new Date('2025-01-20T11:20:00Z'),
  },
];

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
  // 1. Check local IndexedDB
  try {
    const local = await getSpecimen(id);
    if (local) {
      return mapLocalSpecimenToBanknote(local);
    }
  } catch (err) {
    console.warn(`Could not check IndexedDB for specimen ${id}:`, err);
  }

  // 2. Check Mock / Catalog banknotes
  const found = MOCK_BANKNOTES.find(
    (b) => b.id?.toLowerCase() === id?.toLowerCase() || b.fullSerialNumber?.toLowerCase() === id?.toLowerCase()
  );
  if (found) return found;

  return null;
}

export async function getAllBanknotes(): Promise<Banknote[]> {
  const list: Banknote[] = [];
  try {
    const locals = await getAllSpecimens();
    if (locals && locals.length > 0) {
      for (const loc of locals) {
        list.push(mapLocalSpecimenToBanknote(loc));
      }
    }
  } catch (err) {
    console.warn('Error loading specimens from IndexedDB:', err);
  }

  // Add mock banknotes
  list.push(...MOCK_BANKNOTES);
  return list;
}
