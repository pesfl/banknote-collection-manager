'use client';

import { useState, useEffect } from 'react';
import type { Banknote } from '@/types';
import BanknoteListItem from './BanknoteListItem';

interface BanknoteListViewProps {
  banknotes?: Banknote[];
  isLoading?: boolean;
  onSort?: (sort: 'recent' | 'country' | 'value') => void;
  onFilter?: (filter: string) => void;
}

export default function BanknoteListView({
  banknotes = [],
  isLoading = false,
  onSort,
  onFilter,
}: BanknoteListViewProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (sort: 'recent' | 'country' | 'value') => {
    setSortBy(sort);
    onSort?.(sort);
  };

  const filteredBanknotes = banknotes.filter(b =>
    b.countryOfOrigin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.denomination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🏦 Banknote Inventory
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and view your complete banknote collection
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Search
            </label>
            <input
              type="text"
              placeholder="Country, denomination, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📊 Sort By
            </label>
            <select
              value={sortBy}
              onChange={e => handleSort(e.target.value as 'recent' | 'country' | 'value')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="country">Country (A-Z)</option>
              <option value="value">Estimated Value</option>
            </select>
          </div>

          {/* Stats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📈 Collection Stats
            </label>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Total: <span className="font-bold text-gray-900 dark:text-white">{filteredBanknotes.length}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-gray-600 dark:text-gray-400">Loading collection...</p>
            </div>
          </div>
        ) : filteredBanknotes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600 dark:text-gray-400">
                {banknotes.length === 0 ? 'No banknotes yet. Start by capturing your first specimen!' : 'No results found for your search.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBanknotes.map(banknote => (
              <BanknoteListItem
                key={banknote.id}
                banknote={banknote}
                imageUrl={banknote.displayImageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
