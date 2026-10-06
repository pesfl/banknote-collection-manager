'use client';

import { useState } from 'react';
import BanknoteListView from '@/components/banknote/BanknoteListView';

// Mock data for demo
const MOCK_BANKNOTES = [
  {
    id: '1',
    userId: 'user1',
    countryOfOrigin: 'Canada',
    denomination: '1,000 Dodoen Dollars',
    currency: 'Canadian Dollar',
    pickNumber: 'P-45a',
    issueYear: '1954',
    seriesDate: '1954',
    fullSerialNumber: 'A1234567',
    serialPrefix: 'A',
    serialNumeric: '1234567',
    serialSuffix: '',
    signature1Name: 'Beattie',
    signature1Title: 'Signature 1',
    signature2Name: 'Coyne',
    signature2Title: 'Signature 2',
    watermarks: 'Queen Elizabeth II',
    securityFeatures: 'Thread, Hologram',
    conditionGrade: 'UNC' as const,
    machineEstimatedGrade: 'UNC' as const,
    fancySerialType: 'None' as const,
    isReplacementNote: false,
    errorType: undefined,
    storageBox: 'Box A',
    storageSection: 'Section 1',
    storagePosition: 'Position 1',
    frontImageUrl: 'https://via.placeholder.com/500x300?text=Canada+1000',
    backImageUrl: 'https://via.placeholder.com/500x300?text=Canada+1000+Back',
    displayImageUrl: 'https://via.placeholder.com/500x300?text=Canada+1000',
    notes: 'Great color and eye appeal. Original paper with excellent margins.',
    defectsAndAnomalies: 'None',
    numistaPmgValue: '$2,450',
    collectorMarketValue: '$2,750',
    acquisitionDate: new Date('2025-08-26'),
    acquisitionSource: 'Auction',
    purchasePrice: 2300,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
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
    securityFeatures: 'Security thread, Color-shifting ink',
    conditionGrade: 'AU' as const,
    machineEstimatedGrade: 'AU' as const,
    fancySerialType: 'None' as const,
    isReplacementNote: false,
    errorType: undefined,
    storageBox: 'Box B',
    storageSection: 'Section 2',
    storagePosition: 'Position 5',
    frontImageUrl: 'https://via.placeholder.com/500x300?text=USD+100',
    backImageUrl: 'https://via.placeholder.com/500x300?text=USD+100+Back',
    displayImageUrl: 'https://via.placeholder.com/500x300?text=USD+100',
    notes: 'Bright, crisp note with vibrant colors. Minimal handling.',
    defectsAndAnomalies: 'Light corner fold',
    numistaPmgValue: '$125',
    collectorMarketValue: '$145',
    acquisitionDate: new Date('2024-11-15'),
    acquisitionSource: 'Collector Exchange',
    purchasePrice: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    countryOfOrigin: 'Japan',
    denomination: '¥10,000',
    currency: 'Japanese Yen',
    pickNumber: 'P-105',
    issueYear: '2004',
    seriesDate: '2004',
    fullSerialNumber: 'YA123456B',
    serialPrefix: 'YA',
    serialNumeric: '123456',
    serialSuffix: 'B',
    signature1Name: 'Masaru Hayami',
    signature1Title: 'Governor',
    signature2Name: 'Toshihiko Fukui',
    signature2Title: 'Deputy Governor',
    watermarks: 'Fukuzawa Yukichi',
    securityFeatures: 'Intaglio printing, Hologram',
    conditionGrade: 'XF' as const,
    machineEstimatedGrade: 'XF' as const,
    fancySerialType: 'Radar' as const,
    isReplacementNote: false,
    errorType: undefined,
    storageBox: 'Box C',
    storageSection: 'Section 3',
    storagePosition: 'Position 10',
    frontImageUrl: 'https://via.placeholder.com/500x300?text=JPY+10000',
    backImageUrl: 'https://via.placeholder.com/500x300?text=JPY+10000+Back',
    displayImageUrl: 'https://via.placeholder.com/500x300?text=JPY+10000',
    notes: 'Excellent condition. Very rare radar serial number.',
    defectsAndAnomalies: 'Minor crease in lower right corner',
    numistaPmgValue: '$650',
    collectorMarketValue: '$750',
    acquisitionDate: new Date('2025-01-20'),
    acquisitionSource: 'Online Dealer',
    purchasePrice: 600,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function InventoryPage() {
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');

  const sortedBanknotes = [...MOCK_BANKNOTES].sort((a, b) => {
    if (sortBy === 'country') {
      return (a.countryOfOrigin || '').localeCompare(b.countryOfOrigin || '');
    }
    if (sortBy === 'value') {
      const aValue = parseFloat(a.numistaPmgValue?.replace(/[$,]/g, '') || '0');
      const bValue = parseFloat(b.numistaPmgValue?.replace(/[$,]/g, '') || '0');
      return bValue - aValue;
    }
    // recent
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
