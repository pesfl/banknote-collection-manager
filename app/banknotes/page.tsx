'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BanknoteListView from '@/components/banknote/BanknoteListView';
import type { Banknote } from '@/types';
import { getAllSpecimens } from '@/lib/offline/idb';
import ComingSoonFeature from '@/components/common/ComingSoonFeature';

const MOCK_BANKNOTES: Banknote[] = [
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
    securityFeatures: 'Thread, Hologram, Intaglio ink',
    conditionGrade: 'UNC' as const,
    machineEstimatedGrade: 'UNC' as const,
    fancySerialType: 'None' as const,
    isReplacementNote: false,
    storageBox: 'Box A',
    storageSection: 'Section 1',
    storagePosition: 'Position 1',
    frontImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=60',
    backImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=60',
    displayImageUrl: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=60',
    notes: 'Great color and eye appeal. Original crisp paper with excellent margins.',
    defectsAndAnomalies: 'None',
    numistaPmgValue: '$2,450.00',
    collectorMarketValue: '$2,750.00',
    acquisitionDate: new Date('2025-08-26'),
    acquisitionSource: 'Heritage Auctions',
    purchasePrice: 2300,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    securityFeatures: 'Microprinting, Security thread',
    conditionGrade: 'UNC' as const,
    machineEstimatedGrade: 'UNC' as const,
    fancySerialType: 'None' as const,
    isReplacementNote: false,
    storageBox: 'Box 01',
    storageSection: 'Section A',
    storagePosition: 'Position 23',
    frontImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=60',
    backImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=60',
    displayImageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=60',
    notes: 'Crisp uncirculated specimen from original 100-note bank bundle.',
    defectsAndAnomalies: 'None',
    numistaPmgValue: '$15.00',
    collectorMarketValue: '$16.00',
    acquisitionDate: new Date('2026-02-10'),
    acquisitionSource: 'Collector Exchange',
    purchasePrice: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    securityFeatures: '3D Security Ribbon, Bell in Inkwell',
    conditionGrade: 'AU' as const,
    machineEstimatedGrade: 'AU' as const,
    fancySerialType: 'Ladder' as const,
    isReplacementNote: false,
    storageBox: 'Box B',
    storageSection: 'Section 2',
    storagePosition: 'Position 05',
    frontImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=600&auto=format&fit=crop&q=60',
    backImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=600&auto=format&fit=crop&q=60',
    displayImageUrl: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=600&auto=format&fit=crop&q=60',
    notes: 'Bright, crisp note with vibrant colors. Minimal handling.',
    defectsAndAnomalies: 'Light handling crease',
    numistaPmgValue: '$125.00',
    collectorMarketValue: '$145.00',
    acquisitionDate: new Date('2024-11-15'),
    acquisitionSource: 'Dealer Direct',
    purchasePrice: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    watermarks: 'Type 2 Watermark',
    securityFeatures: 'Security Thread',
    conditionGrade: 'AU' as const,
    machineEstimatedGrade: 'AU' as const,
    fancySerialType: 'Ladder' as const,
    isReplacementNote: false,
    storageBox: 'Box C',
    storageSection: 'Section 3',
    storagePosition: 'Position 10',
    frontImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60',
    backImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60',
    displayImageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60',
    notes: 'Reverse ladder fancy serial. Discrepancy logged between PMG P-327b and Numista P-327c.',
    defectsAndAnomalies: 'Minor corner crease',
    numistaPmgValue: '$35.00',
    collectorMarketValue: '$45.00',
    acquisitionDate: new Date('2025-01-20'),
    acquisitionSource: 'Online Auction',
    purchasePrice: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function BanknotesInventoryContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const view = searchParams.get('view');

  if (view === 'countries') return <ComingSoonFeature type="countries" />;
  if (view === 'duplicates') return <ComingSoonFeature type="duplicates" />;
  if (view === 'valuable') return <ComingSoonFeature type="valuable" />;
  if (view === 'missing') return <ComingSoonFeature type="missing" />;
  if (view === 'recent' || view === 'recently-added') return <ComingSoonFeature type="recently-added" />;

  const [banknotes, setBanknotes] = useState<Banknote[]>(MOCK_BANKNOTES);
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');

  useEffect(() => {
    function getSafeBlobUrl(blob?: any): string | undefined {
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

    async function loadIndexedDb() {
      try {
        const local = await getAllSpecimens();
        if (local && local.length > 0) {
          const mappedLocal: Banknote[] = local.map((l) => {
            const ex = (l.extractedData || {}) as any;
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
              signature1Name: ex.signature1Name || undefined,
              signature1Title: ex.signature1Title || undefined,
              signature2Name: ex.signature2Name || undefined,
              signature2Title: ex.signature2Title || undefined,
              watermarks: ex.watermarks || undefined,
              securityFeatures: ex.securityFeatures || undefined,
              frontImageUrl: getSafeBlobUrl(l.frontImageBlob),
              backImageUrl: getSafeBlobUrl(l.backImageBlob),
              displayImageUrl: getSafeBlobUrl(l.frontImageBlob),
              notes: ex.notes || l.notes || 'Specimen captured locally.',
              collectorMarketValue: ex.collectorMarketValue || ex.valuation?.collectorMarketValue || undefined,
              numistaPmgValue: ex.numistaValue || ex.valuation?.numistaValue || ex.pmgValue || undefined,
              pmgValue: ex.pmgValue || ex.valuation?.pmgValue || undefined,
              numistaValue: ex.numistaValue || ex.valuation?.numistaValue || undefined,
              ebayLastSold: ex.ebayLastSold || ex.valuation?.ebayLastSold || undefined,
              ebaySoldUrl: ex.ebaySoldUrl || ex.valuation?.ebaySoldUrl || undefined,
              createdAt: new Date(l.capturedAt),
              updatedAt: new Date(l.capturedAt),
            } as any;
          });

          const localIds = new Set(local.map((l) => l.id));

          // Merge cloud banknotes from Neon PostgreSQL
          try {
            const cloudRes = await fetch('/api/banknotes').catch(() => null);
            if (cloudRes && cloudRes.ok) {
              const cloudData = await cloudRes.json();
              if (cloudData?.banknotes && Array.isArray(cloudData.banknotes)) {
                for (const cb of cloudData.banknotes) {
                  if (!localIds.has(cb.id)) {
                    localIds.add(cb.id);
                    mappedLocal.push({
                      id: cb.id,
                      userId: cb.userId || 'cloud',
                      isReplacementNote: Boolean(cb.isReplacementNote),
                      countryOfOrigin: cb.countryOfOrigin || 'Unknown',
                      denomination: cb.denomination || '—',
                      currency: cb.currency || '',
                      pickNumber: cb.pickNumber || 'P-Pending',
                      issueYear: cb.issueYear || undefined,
                      seriesDate: cb.seriesDate || undefined,
                      fullSerialNumber: cb.fullSerialNumber || 'N/A',
                      conditionGrade: cb.conditionGrade || 'UNC',
                      machineEstimatedGrade: cb.machineEstimatedGrade || undefined,
                      fancySerialType: cb.fancySerialType || 'None',
                      frontImageUrl: cb.frontImageUrl || cb.displayImageUrl || undefined,
                      backImageUrl: cb.backImageUrl || undefined,
                      displayImageUrl: cb.displayImageUrl || cb.frontImageUrl || undefined,
                      notes: cb.notes || 'Cloud synchronized specimen',
                      collectorMarketValue: cb.collectorMarketValue || undefined,
                      numistaPmgValue: cb.numistaPmgValue || undefined,
                      createdAt: new Date(cb.createdAt || Date.now()),
                      updatedAt: new Date(cb.updatedAt || Date.now()),
                    } as any);
                  }
                }
              }
            }
          } catch {}

          setBanknotes([...mappedLocal, ...MOCK_BANKNOTES]);
        } else {
          // If local IDB is empty, attempt to hydrate from Cloud PostgreSQL
          try {
            const cloudRes = await fetch('/api/banknotes').catch(() => null);
            if (cloudRes && cloudRes.ok) {
              const cloudData = await cloudRes.json();
              if (cloudData?.banknotes && Array.isArray(cloudData.banknotes) && cloudData.banknotes.length > 0) {
                const cloudMapped = cloudData.banknotes.map((cb: any) => ({
                  id: cb.id,
                  userId: cb.userId || 'cloud',
                  isReplacementNote: Boolean(cb.isReplacementNote),
                  countryOfOrigin: cb.countryOfOrigin || 'Unknown',
                  denomination: cb.denomination || '—',
                  currency: cb.currency || '',
                  pickNumber: cb.pickNumber || 'P-Pending',
                  issueYear: cb.issueYear || undefined,
                  seriesDate: cb.seriesDate || undefined,
                  fullSerialNumber: cb.fullSerialNumber || 'N/A',
                  conditionGrade: cb.conditionGrade || 'UNC',
                  machineEstimatedGrade: cb.machineEstimatedGrade || undefined,
                  fancySerialType: cb.fancySerialType || 'None',
                  frontImageUrl: cb.frontImageUrl || cb.displayImageUrl || undefined,
                  backImageUrl: cb.backImageUrl || undefined,
                  displayImageUrl: cb.displayImageUrl || cb.frontImageUrl || undefined,
                  notes: cb.notes || 'Cloud synchronized specimen',
                  collectorMarketValue: cb.collectorMarketValue || undefined,
                  numistaPmgValue: cb.numistaPmgValue || undefined,
                  createdAt: new Date(cb.createdAt || Date.now()),
                  updatedAt: new Date(cb.updatedAt || Date.now()),
                } as any));
                setBanknotes([...cloudMapped, ...MOCK_BANKNOTES]);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error('Error querying local specimens:', err);
      }
    }

    loadIndexedDb();
    const interval = setInterval(loadIndexedDb, 3000);
    const handleSpecimenUpdated = () => {
      loadIndexedDb();
    };
    window.addEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    };
  }, []);

  const sortedBanknotes = [...banknotes].sort((a, b) => {
    if (sortBy === 'country') {
      return (a.countryOfOrigin || '').localeCompare(b.countryOfOrigin || '');
    }
    if (sortBy === 'value') {
      const aVal = parseFloat(a.collectorMarketValue?.replace(/[$,]/g, '') || '0');
      const bVal = parseFloat(b.collectorMarketValue?.replace(/[$,]/g, '') || '0');
      return bVal - aVal;
    }
    return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
  });

  return (
    <BanknoteListView
      banknotes={sortedBanknotes}
      isLoading={false}
      onSort={setSortBy}
      onSpecimenUpdated={(updated) => {
        setBanknotes(prev => prev.map(b => b.id === updated.id ? updated : b));
      }}
    />
  );
}

export default function BanknotesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Banknote Inventory...</div>}>
      <BanknotesInventoryContent />
    </Suspense>
  );
}
