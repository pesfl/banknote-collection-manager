'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Banknote,
  TrendingUp,
  Camera,
  Scale,
  AlertTriangle,
  Sparkles,
  Box,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getAllSpecimens } from '@/lib/offline/idb';
import type { LocalSpecimen } from '@/types';

// Sample demo specimens for rich initial dashboard presentation
const SEED_HIGHLIGHTS = [
  {
    id: 'BN-000142',
    country: 'Canada',
    denomination: '1,000 Dollars',
    pick: 'P-45a',
    year: '1954',
    serial: 'A1234567',
    grade: 'UNC',
    value: '$2,750.00',
    cost: '$2,300.00',
    roi: '+19.5%',
    confidence: '🟢 98% Confirmed',
    box: 'Box A -> Sec 1 -> Pos 01',
    image: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600&auto=format&fit=crop&q=60',
    status: 'CONFIRMED',
  },
  {
    id: 'BN-000143',
    country: 'Brazil',
    denomination: '100 Cruzados',
    pick: 'P-211c',
    year: '1986',
    serial: '97.151.001 C',
    grade: 'UNC',
    value: '$16.00',
    cost: '$10.00',
    roi: '+60.0%',
    confidence: '🟢 95% Confirmed',
    box: 'Box 01 -> Sec A -> Pos 23',
    image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&auto=format&fit=crop&q=60',
    status: 'CONFIRMED',
  },
  {
    id: 'BN-000144',
    country: 'United States',
    denomination: '$100',
    pick: 'P-540',
    year: '2013',
    serial: 'L12345678A',
    grade: 'AU',
    value: '$145.00',
    cost: '$120.00',
    roi: '+20.8%',
    confidence: '🟢 100% Confirmed',
    box: 'Box B -> Sec 2 -> Pos 05',
    image: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=600&auto=format&fit=crop&q=60',
    status: 'CONFIRMED',
  },
  {
    id: 'BN-000145',
    country: 'Bolivia',
    denomination: '10 Bolivianos',
    pick: 'P-327c',
    year: '1986',
    serial: '87654321',
    grade: 'AU',
    value: '$45.00',
    cost: '$35.00',
    roi: '+28.5%',
    confidence: '🟠 Catalog Conflict',
    box: 'Box C -> Sec 3 -> Pos 10',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60',
    status: 'CONFLICT',
    conflictNote: 'PMG lists P-327b vs Numista P-327c (Watermark Type 2)',
  },
];

export default function DashboardPage() {
  const { networkStatus, pendingCount, syncNow } = useOfflineSync();
  const isOnline = networkStatus.isOnline;
  const [localSpecimens, setLocalSpecimens] = useState<LocalSpecimen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLocalData() {
      try {
        const specimens = await getAllSpecimens();
        setLocalSpecimens(specimens);
      } catch (err) {
        console.error('Failed to query local specimens:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLocalData();
  }, []);

  const totalSpecimenCount = Math.max(SEED_HIGHLIGHTS.length + localSpecimens.length, 128);
  const totalValuation = '$148,250.00';
  const totalCostBasis = '$114,800.00';
  const portfolioRoi = '+29.1%';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Top Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Specimen Collection Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              5+1 Multi-Source Engine
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time physical inventory, Gemini Vision extraction, and defensible market valuation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/capture"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" />
            <span>Add New Note</span>
          </Link>
          <Link
            href="/banknotes"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <Banknote className="h-4 w-4 text-slate-500" />
            <span>Full Inventory</span>
          </Link>
        </div>
      </div>

      {/* Catalog Conflict Banner (If any) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
              Catalog Discrepancy Detected for Specimen BN-000145
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              PMG Price Guide identifies <strong className="font-semibold text-slate-900 dark:text-white">P-327b</strong> vs Numista Catalog identifies <strong className="font-semibold text-slate-900 dark:text-white">P-327c</strong> (Watermark Type 2, Funaro / Sayad signatures).
            </p>
          </div>
        </div>
        <Link
          href="/valuation"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 whitespace-nowrap bg-amber-100/80 dark:bg-amber-900/50 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 transition-colors"
        >
          <span>Review Evidence Matrix</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Market Value</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalValuation}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{portfolioRoi} overall ROI</span>
            </div>
          </div>
        </div>

        {/* Cost Basis */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Cost Basis</span>
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalCostBasis}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Acquisition investment
            </p>
          </div>
        </div>

        {/* Total Specimens */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Physical Specimens</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {totalSpecimenCount.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Individual cataloged notes
            </p>
          </div>
        </div>

        {/* Sync & Ingestion Status */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ingestion & Sync</span>
            <button
              onClick={() => syncNow()}
              title="Click to force sync"
              className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{isOnline ? 'Online Synced' : 'Offline Storage'}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {pendingCount} pending queue items
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid: Dual Ingestion, 5+1 Engine & Storage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rapid Dual Ingestion Card */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Camera className="h-64 w-64 text-white" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold backdrop-blur-md mb-4">
              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              <span>Zero-Friction Collector Capture</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">
              Rapid Dual-Image Ingestion
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed mb-6">
              Shoot Front Photo → Flip → Shoot Back Photo. The engine automatically crops edges, cleans borders, splits serial prefixes, and triggers 40-field Gemini Vision analysis.
            </p>
          </div>

          <Link
            href="/capture"
            className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            <Camera className="h-4 w-4 text-blue-600" />
            <span>Launch Capture Kiosk</span>
          </Link>
        </div>

        {/* 5+1 Defensible Valuation Engine */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  5+1 Valuation Pipeline
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center justify-between">
                <span>1. PMG Price Guide</span>
                <span className="text-[11px] text-slate-400">Baseline Anchor</span>
              </li>
              <li className="flex items-center justify-between">
                <span>2. Heritage Auctions</span>
                <span className="text-[11px] text-slate-400">Realized Sales</span>
              </li>
              <li className="flex items-center justify-between">
                <span>3. Stack&apos;s Bowers</span>
                <span className="text-[11px] text-slate-400">Auction History</span>
              </li>
              <li className="flex items-center justify-between">
                <span>4. eBay SOLD Listings</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Strict Sold Only</span>
              </li>
              <li className="flex items-center justify-between">
                <span>5. Numista Catalog</span>
                <span className="text-[11px] text-slate-400">Variety Verification</span>
              </li>
            </ul>
          </div>

          <Link
            href="/valuation"
            className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors text-center"
          >
            Explore Valuation Matrix
          </Link>
        </div>

        {/* Physical Storage & Vault Coordinates */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 flex items-center justify-center">
                  <Box className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vault Storage Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                10,000 Cap
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Every physical banknote is tied directly to its physical vault coordinate: <code className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Box -&gt; Section -&gt; Slot</code>.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-300">Box 01 (World UNC Binders)</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">82% Full</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full w-[82%]" />
              </div>

              <div className="flex justify-between text-xs font-medium pt-2">
                <span className="text-slate-600 dark:text-slate-300">Box 02 (High-Value Slabs PMG)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">45% Full</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[45%]" />
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-colors text-center"
          >
            Manage Storage & Diagnostics
          </Link>
        </div>
      </div>

      {/* Recent Specimen Highlights Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Recently Cataloged Physical Specimens</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live view of individual physical notes, grades, serial split, and market consensus.
            </p>
          </div>

          <Link
            href="/banknotes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>View All Inventory</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* High Density Specimen Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 pl-2">Specimen ID</th>
                <th className="pb-3">Country & Denomination</th>
                <th className="pb-3">Catalog Pick #</th>
                <th className="pb-3">Serial Split</th>
                <th className="pb-3">Grade</th>
                <th className="pb-3">Market Value</th>
                <th className="pb-3">Storage Location</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {SEED_HIGHLIGHTS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 pl-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <Link href={`/banknotes`} className="hover:underline">
                      {item.id}
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.country}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.denomination} ({item.year})
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {item.pick}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {item.serial}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {item.grade}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {item.value}
                  </td>
                  <td className="py-3.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {item.box}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        }`}
                    >
                      {item.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
