'use client';

import { useState, useEffect } from 'react';
import BanknoteListView from '@/components/banknote/BanknoteListView';
import { getAllBanknotes } from '@/lib/data/banknote-repository';
import type { Banknote } from '@/types';

export default function CollectionListPage() {
  const [banknotes, setBanknotes] = useState<Banknote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getAllBanknotes();
        if (isMounted) {
          setBanknotes(data || []);
        }
      } catch (err) {
        console.error('Failed to load banknotes for collection list:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('banknote-specimen-updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('banknote-specimen-updated', handleUpdate);
    };
  }, []);

  const sortedBanknotes = [...banknotes].sort((a, b) => {
    if (sortBy === 'country') {
      return (a.countryOfOrigin || '').localeCompare(b.countryOfOrigin || '');
    }
    if (sortBy === 'value') {
      const aValue = parseFloat(a.numistaPmgValue?.replace(/[$,]/g, '') || a.collectorMarketValue?.replace(/[$,]/g, '') || '0');
      const bValue = parseFloat(b.numistaPmgValue?.replace(/[$,]/g, '') || b.collectorMarketValue?.replace(/[$,]/g, '') || '0');
      return bValue - aValue;
    }
    // recent
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <BanknoteListView
      banknotes={sortedBanknotes}
      isLoading={isLoading}
      onSort={setSortBy}
    />
  );
}
