'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  Layers, 
  Search, 
  Sparkles, 
  X, 
  ArrowRight, 
  Database, 
  ExternalLink,
  Camera,
  Coins
} from 'lucide-react';
import { InteractiveWorldHeatmap, type CountryStat } from '@/components/countries/InteractiveWorldHeatmap';
import { normalizeCountryCode, getCountryFlagByCode } from '@/lib/utils/country-matcher';
import worldMapData from '@/lib/data/world-map-paths.json';
import { getAllSpecimens } from '@/lib/offline/idb';
import type { Banknote } from '@/types';

function getSafeBlobUrl(blob?: Blob | null): string | undefined {
  if (!blob) return undefined;
  try {
    if (typeof window !== 'undefined' && blob instanceof Blob) {
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn('Could not create object URL for blob:', e);
  }
  return undefined;
}

export default function CountriesPage() {
  const router = useRouter();
  const [banknotes, setBanknotes] = useState<Banknote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metricMode, setMetricMode] = useState<'COUNT' | 'VALUE'>('COUNT');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigateToMainTable = (countryName: string) => {
    router.push(`/?country=${encodeURIComponent(countryName)}`);
  };

  // Fetch live banknotes from database and local offline IndexedDB
  useEffect(() => {
    async function loadBanknotes() {
      try {
        setIsLoading(true);

        const mappedList: Banknote[] = [];
        const seenIds = new Set<string>();

        // 1. Load local offline specimens if any
        try {
          const local = await getAllSpecimens();
          if (local && local.length > 0) {
            local.forEach((l) => {
              const ex = (l.extractedData || {}) as any;
              seenIds.add(l.id);
              mappedList.push({
                id: l.id,
                userId: 'local',
                isReplacementNote: Boolean(ex.isReplacementNote),
                countryOfOrigin: ex.countryOfOrigin || ex.country || 'Unknown',
                denomination: ex.denomination || '—',
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
                frontImageUrl: getSafeBlobUrl(l.frontImageBlob),
                backImageUrl: getSafeBlobUrl(l.backImageBlob),
                displayImageUrl: getSafeBlobUrl(l.frontImageBlob),
                notes: ex.notes || l.notes || '',
                collectorMarketValue: ex.collectorMarketValue || ex.valuation?.collectorMarketValue || undefined,
                numistaPmgValue: ex.numistaValue || ex.valuation?.numistaValue || ex.pmgValue || undefined,
                createdAt: new Date(l.capturedAt),
                updatedAt: new Date(l.capturedAt),
              } as any);
            });
          }
        } catch (idbErr) {
          console.warn('[Countries] Local IndexedDB read bypassed:', idbErr);
        }

        // 2. Fetch cloud database banknotes from Neon PostgreSQL
        try {
          const res = await fetch('/api/banknotes');
          if (res.ok) {
            const json = await res.json();
            const cloudNotes: Banknote[] = json.banknotes || json.items || [];
            if (Array.isArray(cloudNotes)) {
              for (const cb of cloudNotes) {
                if (cb.id && !seenIds.has(cb.id)) {
                  seenIds.add(cb.id);
                  mappedList.push(cb);
                }
              }
            }
          }
        } catch (apiErr) {
          console.warn('[Countries] Failed to fetch cloud banknotes from /api/banknotes:', apiErr);
        }

        setBanknotes(mappedList);
      } catch (err) {
        console.warn('[Countries] Failed to load collection banknotes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBanknotes();
  }, []);

  // Compute country statistics from active banknotes
  const countryStats = useMemo(() => {
    const stats: Record<string, CountryStat> = {};

    // Map of country code to country name & continent from world map dataset
    const worldMeta: Record<string, { name: string; continent: string }> = {};
    worldMapData.countries.forEach((c: any) => {
      worldMeta[c.code] = { name: c.name, continent: c.continent };
    });

    banknotes.forEach((note) => {
      const countryRaw = note.countryOfOrigin || (note as any).country || (note as any).extractedData?.countryOfOrigin || (note as any).extractedData?.country || 'Unknown';
      const code = normalizeCountryCode(countryRaw);
      if (!code) return;

      const meta = worldMeta[code] || { name: countryRaw, continent: 'Other' };

      // Parse numerical market value
      let numVal = 0;
      const rawVal = note.collectorMarketValue || (note as any).value || (note as any).extractedData?.collectorMarketValue;
      if (rawVal) {
        const parsed = parseFloat(String(rawVal).replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed)) numVal = parsed;
      }

      if (!stats[code]) {
        stats[code] = {
          code,
          name: meta.name,
          continent: meta.continent,
          flag: getCountryFlagByCode(code),
          count: 0,
          totalValue: 0,
          uniquePicks: [],
          denominations: [],
        };
      }

      stats[code].count += 1;
      stats[code].totalValue += numVal;
      if (note.pickNumber && typeof note.pickNumber === 'string' && !stats[code].uniquePicks.includes(note.pickNumber)) {
        stats[code].uniquePicks.push(note.pickNumber);
      }
      if (note.denomination && typeof note.denomination === 'string' && !stats[code].denominations.includes(note.denomination)) {
        stats[code].denominations.push(note.denomination);
      }
    });

    return stats;
  }, [banknotes]);

  // Global KPIs
  const totalRepresentedCountries = Object.keys(countryStats).length;
  const worldCoveragePct = ((totalRepresentedCountries / 195) * 100).toFixed(1);
  const totalValueSum = useMemo(() => {
    return Object.values(countryStats).reduce((sum, s) => sum + s.totalValue, 0);
  }, [countryStats]);

  const activeContinents = useMemo(() => {
    const set = new Set<string>();
    Object.values(countryStats).forEach((s) => set.add(s.continent));
    return Array.from(set).filter((c) => c !== 'Other');
  }, [countryStats]);



  // Filtered country leaderboard
  const filteredCountryList = useMemo(() => {
    const list = Object.values(countryStats);
    if (!searchQuery.trim()) {
      return list.sort((a, b) => (metricMode === 'COUNT' ? b.count - a.count : b.totalValue - a.totalValue));
    }
    const q = searchQuery.toLowerCase().trim();
    return list
      .filter((s) => s.name.toLowerCase().includes(q) || s.continent.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .sort((a, b) => (metricMode === 'COUNT' ? b.count - a.count : b.totalValue - a.totalValue));
  }, [countryStats, searchQuery, metricMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Globe className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive World Map & Country Heatmap</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Geographic distribution and density heatmap of world banknotes in your database.
          </p>
        </div>

        {/* Metric Heatmap Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMetricMode('COUNT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'COUNT'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Volume Heatmap (Note Count)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('VALUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'VALUE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wealth Heatmap ($ Value)
          </button>
        </div>
      </div>

      {/* Global Collection KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Global Coverage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">World Coverage</span>
            <Globe className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {totalRepresentedCountries} <span className="text-xs font-sans text-slate-400 font-normal">/ 195</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {worldCoveragePct}% Sovereign Reach
          </div>
        </div>

        {/* 2. Total Banknotes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Banknotes</span>
            <Coins className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {banknotes.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Physical specimens registered
          </div>
        </div>

        {/* 3. Total Valuation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Portfolio Value</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ${totalValueSum.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Condition-weighted consensus
          </div>
        </div>

        {/* 4. Active Continents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Active Continents</span>
            <Layers className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {activeContinents.length} <span className="text-xs font-sans text-slate-400 font-normal">/ 6</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {activeContinents.slice(0, 3).join(', ') || 'No active notes'}
          </div>
        </div>
      </div>

      {/* Interactive World Vector Heatmap */}
      <InteractiveWorldHeatmap
        countryStats={countryStats}
        onSelectCountry={(code, stat) => {
          const target = stat?.name || worldMapData.countries.find((c: any) => c.code === code)?.name || code;
          handleNavigateToMainTable(target);
        }}
        metricMode={metricMode}
      />

      {/* ALL REPRESENTED COUNTRIES DIRECTORY */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>Country Density Leaderboard ({filteredCountryList.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked breakdown of world banknote holdings by territory. Click any country to filter the main table.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search country or continent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredCountryList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 pl-2">Country</th>
                  <th className="pb-3">Continent</th>
                  <th className="pb-3">Volume</th>
                  <th className="pb-3 font-mono">Catalog Picks</th>
                  <th className="pb-3 font-mono text-right">Portfolio Value</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCountryList.map((country) => (
                  <tr
                    key={country.code}
                    onClick={() => handleNavigateToMainTable(country.name)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 pl-2 flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                      <span className="text-lg">{country.flag}</span>
                      <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{country.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">({country.code})</span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{country.continent}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {country.count}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (country.count / (banknotes.length || 1)) * 100 * 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-cyan-600 dark:text-cyan-400">
                      {country.uniquePicks.slice(0, 3).join(', ') || '—'}
                      {country.uniquePicks.length > 3 && ` +${country.uniquePicks.length - 3}`}
                    </td>
                    <td className="py-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                      ${country.totalValue.toFixed(2)}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToMainTable(country.name);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
                      >
                        <span>View Notes</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No country holdings found matching &quot;{searchQuery}&quot;.</p>
            <p className="mt-1">Add banknotes to your collection to populate the global heatmap.</p>
            <Link
              href="/capture"
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Capture Banknote</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
