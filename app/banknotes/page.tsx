'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BanknoteListView from '@/components/banknote/BanknoteListView';
import type { Banknote } from '@/types';
import { getAllSpecimens } from '@/lib/offline/idb';
import ComingSoonFeature from '@/components/common/ComingSoonFeature';
const MOCK_BANKNOTES: Banknote[] = [];

function BanknotesInventoryContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const view = searchParams.get('view');

  if (view === 'countries') return <ComingSoonFeature type="countries" />;
  if (view === 'duplicates') return <ComingSoonFeature type="duplicates" />;
  if (view === 'valuable') return <ComingSoonFeature type="valuable" />;
  if (view === 'missing') return <ComingSoonFeature type="missing" />;
  if (view === 'recent' || view === 'recently-added') return <ComingSoonFeature type="recently-added" />;

  const [banknotes, setBanknotes] = useState<Banknote[]>([]);
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

                // Automatically push any existing local notes up to Neon PostgreSQL cloud
                const cloudBanknoteIds = new Set(cloudData.banknotes.map((b: any) => b.id));
                const unSynced = local.filter((l: any) => !cloudBanknoteIds.has(l.id));
                if (unSynced.length > 0) {
                  const toUpload = unSynced.map((l: any) => {
                    const ex = (l.extractedData || {}) as any;
                    return {
                      id: l.id,
                      countryOfOrigin: ex.countryOfOrigin || ex.country,
                      denomination: ex.denomination,
                      currency: ex.currency,
                      pickNumber: ex.pickNumber,
                      issueYear: ex.issueYear,
                      seriesDate: ex.seriesDate,
                      fullSerialNumber: ex.fullSerialNumber,
                      serialPrefix: ex.serialPrefix,
                      serialNumeric: ex.serialNumeric,
                      serialSuffix: ex.serialSuffix,
                      conditionGrade: ex.conditionGrade,
                      machineEstimatedGrade: ex.machineEstimatedGrade,
                      fancySerialType: ex.fancySerialType,
                      isReplacementNote: ex.isReplacementNote,
                      notes: ex.notes || l.notes,
                      collectorMarketValue: ex.collectorMarketValue || ex.valuation?.collectorMarketValue,
                      numistaPmgValue: ex.numistaPmgValue || ex.numistaValue,
                      extractedData: ex,
                    };
                  });
                  fetch('/api/banknotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(toUpload),
                  }).catch(() => {});
                }
              }
            }
          } catch {}

          setBanknotes(mappedLocal);
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
                setBanknotes(cloudMapped);
              } else {
                setBanknotes([]);
              }
            } else {
              setBanknotes([]);
            }
          } catch {
            setBanknotes([]);
          }
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
      initialCountry={searchParams.get('country') || undefined}
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
