'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BanknoteListView from '@/components/banknote/BanknoteListView';
import type { Banknote } from '@/types';
import { getAllSpecimens } from '@/lib/offline/idb';

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
  const [banknotes, setBanknotes] = useState<Banknote[]>(MOCK_BANKNOTES);
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');

  useEffect(() => {
    async function loadIndexedDb() {
      try {
        const local = await getAllSpecimens();
        if (local.length > 0) {
          const mappedLocal: Banknote[] = local.map((l) => ({
            id: l.id,
            userId: 'local',
            isReplacementNote: false,
            countryOfOrigin: l.extractedData?.country || 'Unknown',
            denomination: l.extractedData?.denomination || 'Unknown',
            currency: '',
            pickNumber: l.extractedData?.pickNumber || 'P-Pending',
            fullSerialNumber: 'Local IDB',
            conditionGrade: 'UNC',
            frontImageUrl: l.frontImageBlob ? URL.createObjectURL(l.frontImageBlob) : undefined,
            backImageUrl: l.backImageBlob ? URL.createObjectURL(l.backImageBlob) : undefined,
            notes: l.notes || 'Local capture pending AI extraction sync.',
            createdAt: new Date(l.capturedAt),
            updatedAt: new Date(l.capturedAt),
          }));
          setBanknotes([...mappedLocal, ...MOCK_BANKNOTES]);
        }
      } catch (err) {
        console.error('Error querying local specimens:', err);
      }
    }
    loadIndexedDb();
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
