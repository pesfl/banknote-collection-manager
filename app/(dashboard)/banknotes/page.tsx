'use client';

import { useState, useEffect } from 'react';
import BanknoteGrid from '@/components/dashboard/BanknoteGrid';
import FilterPanel from '@/components/dashboard/FilterPanel';
import StatsPanel from '@/components/dashboard/StatsPanel';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function BanknotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');
  const { pendingCount, syncedCount } = useOfflineSync();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Panel */}
      <StatsPanel pendingCount={pendingCount} syncedCount={syncedCount} />

      {/* Filter & Search Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterCountry={filterCountry}
          onFilterCountryChange={setFilterCountry}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Banknote Grid */}
        <div className="lg:col-span-3">
          <BanknoteGrid
            searchQuery={searchQuery}
            filterCountry={filterCountry}
            sortBy={sortBy}
          />
        </div>
      </div>
    </div>
  );
}
