'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Globe2, 
  Award, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  Layers
} from 'lucide-react';

const COUNTRY_DISTRIBUTION = [
  { country: 'Canada', count: 42, value: '$64,200', pct: '43.3%' },
  { country: 'United States', count: 35, value: '$38,450', pct: '25.9%' },
  { country: 'Brazil', count: 28, value: '$22,100', pct: '14.9%' },
  { country: 'Japan', count: 14, value: '$15,800', pct: '10.7%' },
  { country: 'Bolivia & Others', count: 9, value: '$7,700', pct: '5.2%' },
];

const GRADE_PYRAMID = [
  { grade: 'UNC (Uncirculated 65-70)', count: 68, pct: '53.1%', color: 'bg-emerald-500' },
  { grade: 'AU (About Uncirculated 50-58)', count: 32, pct: '25.0%', color: 'bg-blue-500' },
  { grade: 'XF / EF (Extremely Fine 40-45)', count: 18, pct: '14.1%', color: 'bg-indigo-500' },
  { grade: 'VF (Very Fine 20-35)', count: 7, pct: '5.5%', color: 'bg-amber-500' },
  { grade: 'Fine & Below (<20)', count: 3, pct: '2.3%', color: 'bg-slate-400' },
];

const FANCY_SERIAL_METRICS = [
  { type: '⭐ Solid Serials (e.g. 77777777)', count: 2, premium: '+$450.00 avg' },
  { type: '⭐ Radar / Palindrome (e.g. 12344321)', count: 6, premium: '+$120.00 avg' },
  { type: '⭐ Low Serials (#1 to #1000)', count: 8, premium: '+$280.00 avg' },
  { type: '⭐ Star / Replacement Notes (*, Z)', count: 14, premium: '+$85.00 avg' },
  { type: '⭐ Ladder / Binary Serials', count: 4, premium: '+$150.00 avg' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span>Collection Analytics & Market Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Portfolio performance, geographic breakdown, grade distribution, and rarity premiums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Portfolio +29.1% ROI</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Market Value</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            $148,250.00
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="h-3 w-3" /> +$33,450.00 Unrealized Gain
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Average Specimen Value</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            $1,158.20
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across 128 physical specimens
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">UNC Specimen Share</span>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            53.1%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            68 Crisp Uncirculated notes
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Special / Fancy Serials</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            34 Notes
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            +$6,820.00 Added Premium
          </span>
        </div>
      </div>

      {/* Main Analytics Grid: Geographic & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Geographic Portfolio Distribution</span>
            </h3>
            <span className="text-xs text-slate-400">Top Regions</span>
          </div>

          <div className="space-y-3">
            {COUNTRY_DISTRIBUTION.map((item) => (
              <div key={item.country} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-200">
                    {item.country} <span className="text-slate-400 font-normal">({item.count} notes)</span>
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    {item.value} <span className="text-slate-400 text-[10px]">({item.pct})</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: item.pct }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Condition Grade Pyramid */}
        <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Condition Grade Pyramid</span>
            </h3>
            <span className="text-xs text-slate-400">Physical Grade Scale</span>
          </div>

          <div className="space-y-3">
            {GRADE_PYRAMID.map((item) => (
              <div key={item.grade} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-200">
                    {item.grade}
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    {item.count} notes <span className="text-slate-400 text-[10px]">({item.pct})</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full`} 
                    style={{ width: item.pct }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fancy Serials & Special Varieties Breakdown */}
      <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Fancy Serial & Numismatic Variety Value Drivers</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mathematical detection of radar, solid, low serials, and replacement star notes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FANCY_SERIAL_METRICS.map((item) => (
            <div key={item.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                {item.type}
              </span>
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  {item.count} verified specimens
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {item.premium}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
