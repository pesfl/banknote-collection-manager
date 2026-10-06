'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
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
    <div className="min-h-screen bg-slate-100/50 dark:bg-slate-950 p-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              🏦 <span>BANKNOTE INVENTORY</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage and view your complete banknote collection
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm">
              <span>➕</span> <span>Add Note</span>
            </button>
            <button className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              🔍 Search
            </button>
            <button className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              📥 Export
            </button>
            <button className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
              ☰
            </button>
            <AnimatedThemeToggler />
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-3 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                🔍 SEARCH
              </label>
              <Input
                placeholder="Country, denomination, notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs h-9"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                📊 SORT BY
              </label>
              <Select value={sortBy} onValueChange={(val) => handleSort(val as 'recent' | 'country' | 'value')}>
                <SelectTrigger className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="country">Country (A-Z)</SelectItem>
                  <SelectItem value="value">Estimated Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                📈 STATS
              </label>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-900 dark:text-white text-xs h-9 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Notes:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{filteredBanknotes.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-slate-600 dark:text-slate-400 text-lg">Loading collection...</p>
            </div>
          </div>
        ) : filteredBanknotes.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {banknotes.length === 0 ? 'No banknotes yet. Start by capturing your first specimen!' : 'No results found for your search.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
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
