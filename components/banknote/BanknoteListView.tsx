'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Layers,
  X
} from 'lucide-react';
import type { Banknote } from '@/types';
import BanknoteListItem from './BanknoteListItem';
import { toast } from 'sonner';
import CondensedSpecimenModal from './CondensedSpecimenModal';

function getCountryFlag(country?: string): string {
  const c = (country || '').toLowerCase().trim();
  if (c.includes('india')) return '🇮🇳';
  if (c.includes('united states') || c.includes('usa') || c === 'us') return '🇺🇸';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('brazil') || c.includes('brasil')) return '🇧🇷';
  if (c.includes('bolivia')) return '🇧🇴';
  if (c.includes('philippine') || c.includes('filipino')) return '🇵🇭';
  if (c.includes('united kingdom') || c.includes('uk')) return '🇬🇧';
  if (c.includes('japan')) return '🇯🇵';
  if (c.includes('china')) return '🇨🇳';
  if (c.includes('germany')) return '🇩🇪';
  if (c.includes('france')) return '🇫🇷';
  return '💵';
}

interface BanknoteListViewProps {
  banknotes?: Banknote[];
  isLoading?: boolean;
  onSort?: (sort: 'recent' | 'country' | 'value') => void;
  onFilter?: (filter: string) => void;
  onSpecimenUpdated?: (updated: Banknote) => void;
  initialCountry?: string;
}

export default function BanknoteListView({
  banknotes = [],
  isLoading = false,
  onSort,
  onFilter,
  onSpecimenUpdated,
  initialCountry,
}: BanknoteListViewProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(Boolean(initialCountry));
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry || 'ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [activeSpecimen, setActiveSpecimen] = useState<Banknote | null>(null);

  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
      setShowFilterDropdown(true);
    }
  }, [initialCountry]);


  // Synchronize activeSpecimen when parent banknotes collection updates
  useEffect(() => {
    if (!activeSpecimen) return;
    const current = banknotes.find((b) => b.id === activeSpecimen.id);
    if (current) {
      const curColVal = current.collectorMarketValue;
      const actColVal = activeSpecimen.collectorMarketValue;
      const curNumVal = (current as any).numistaValue;
      const actNumVal = (activeSpecimen as any).numistaValue;
      if (curColVal !== actColVal || curNumVal !== actNumVal) {
        setActiveSpecimen(current);
      }
    }
  }, [banknotes, activeSpecimen]);





  const handleSort = (sort: 'recent' | 'country' | 'value') => {
    setSortBy(sort);
    onSort?.(sort);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(banknotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "banknote_collection_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Collection exported as JSON');
  };


  const filteredBanknotes = banknotes.filter(b => {
    const matchesSearch = 
      b.countryOfOrigin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.denomination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fullSerialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'ALL' || b.countryOfOrigin === selectedCountry;
    const matchesGrade = selectedGrade === 'ALL' || b.conditionGrade === selectedGrade;

    return matchesSearch && matchesCountry && matchesGrade;
  });

  const uniqueCountries = Array.from(new Set(banknotes.map(b => b.countryOfOrigin).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(banknotes.map(b => b.conditionGrade).filter(Boolean)));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR (Clean Royal/Navy Blue Bar with Title & Action Pills)       */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#00246b] dark:bg-[#001744] text-white rounded-2xl px-4 sm:px-6 py-3.5 shadow-md flex flex-wrap items-center justify-between gap-4 border border-blue-900/60">
        
        {/* Left: Bank Building Icon + Title */}
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-blue-200" />
          <h1 className="text-base sm:text-lg font-extrabold tracking-wide uppercase">
            BANKNOTE INVENTORY
          </h1>
        </div>

        {/* Right: Action Buttons (Add Note, Search, Filter, Export) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* + Add Note (Bright Blue Pill) */}
          <Link
            href="/capture"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Note</span>
          </Link>

          {/* Search Button / Toggle (Dark Navy Pill) */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showSearchInput 
                ? 'bg-[#003896] border-blue-400 text-white' 
                : 'bg-[#001b52] hover:bg-[#002d80] text-blue-100 border-blue-900/80'
            }`}
          >
            <Search className="h-3.5 w-3.5 text-blue-300" />
            <span>Search</span>
          </button>

          {/* Filter Button / Toggle (Dark Navy Pill) */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showFilterDropdown || selectedCountry !== 'ALL' || selectedGrade !== 'ALL'
                ? 'bg-[#003896] border-blue-400 text-white' 
                : 'bg-[#001b52] hover:bg-[#002d80] text-blue-100 border-blue-900/80'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-blue-300" />
            <span>Filter</span>
            {(selectedCountry !== 'ALL' || selectedGrade !== 'ALL') && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Export Button (Dark Navy Pill) */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#001b52] hover:bg-[#002d80] text-blue-100 text-xs font-semibold border border-blue-900/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDABLE SEARCH & FILTER BAR                                            */}
      {/* ========================================================================= */}
      {(showSearchInput || showFilterDropdown) && (
        <div className="p-4 bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2">
          {showSearchInput && (
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Country, Pick #, Denomination, Serial, Notes..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {showFilterDropdown && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">All Countries</option>
                {uniqueCountries.map(c => (
                  <option key={c} value={c as string}>{c}</option>
                ))}
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">All Grades</option>
                {uniqueGrades.map(g => (
                  <option key={g} value={g as string}>{g}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="value">Sort: Highest Value</option>
                <option value="country">Sort: Country (A-Z)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPECIMEN LIST ROWS                                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredBanknotes.length > 0 ? (
          filteredBanknotes.map((banknote) => (
            <BanknoteListItem
              key={banknote.id || banknote.fullSerialNumber}
              banknote={banknote}
              imageUrl={banknote.frontImageUrl}
              onOpenViewer={(b) => setActiveSpecimen(b)}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Specimens Match Your Criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Try adjusting your search query or reset your country and grade filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCountry('ALL'); setSelectedGrade('ALL'); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066ff] text-white hover:bg-blue-600"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Shared Condensed Specimen Modal */}
      <CondensedSpecimenModal
        banknote={activeSpecimen}
        isOpen={activeSpecimen !== null}
        onClose={() => setActiveSpecimen(null)}
        onSpecimenUpdated={(updated) => {
          setActiveSpecimen(updated);
          onSpecimenUpdated?.(updated);
        }}
        onSpecimenDeleted={(id) => {
          setActiveSpecimen(null);
        }}
      />
    </div>
  );
}
