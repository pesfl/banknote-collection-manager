'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Globe, 
  Copy, 
  Star, 
  AlertCircle, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  PlusCircle, 
  ListOrdered
} from 'lucide-react';

export type ComingSoonFeatureType = 
  | 'countries' 
  | 'duplicates' 
  | 'valuable' 
  | 'missing' 
  | 'recently-added';

interface FeatureConfig {
  title: string;
  tagline: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  summary: string;
}

const FEATURE_CONFIGS: Record<ComingSoonFeatureType, FeatureConfig> = {
  countries: {
    title: 'Countries & Geocatalog',
    tagline: 'Browse notes by sovereign nation, continent, and historic currency issuing authority.',
    badge: 'Geographic Atlas',
    icon: Globe,
    gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
    summary: 'An interactive world map and territorial atlas grouping banknotes by issuing country, colonial jurisdictions, and central banks with historical context.',
  },
  duplicates: {
    title: 'Duplicate Specimen Manager',
    tagline: 'Detect repeat Pick varieties, serial duplicates, and generate trade/sale recommendations.',
    badge: 'Inventory Optimizer',
    icon: Copy,
    gradient: 'from-purple-600 via-fuchsia-600 to-indigo-600',
    summary: 'Smart algorithmic identification of redundant catalog items, comparing grades and valuations to help you retain the best copy and prepare surplus notes for collector exchange.',
  },
  valuable: {
    title: 'Valuable & Special Varieties',
    tagline: 'Curated showcase of high-value notes, Gem Uncirculated grades, and rare fancy serials.',
    badge: 'Crown Showcase',
    icon: Star,
    gradient: 'from-amber-500 via-orange-600 to-yellow-600',
    summary: 'A luxury gallery celebrating your most valuable assets, verified PMG high grades, star replacement notes, radar/ladder serials, and error printings.',
  },
  missing: {
    title: 'Missing Information & Audit',
    tagline: 'Scan your inventory for uncataloged notes, missing reverse photos, and unpriced items.',
    badge: 'Collection Hygiene',
    icon: AlertCircle,
    gradient: 'from-rose-600 via-red-600 to-amber-600',
    summary: 'A quality audit engine that scans every item in your collection, identifying records lacking Pick catalog numbers, official signatures, reverse scans, or current market valuations.',
  },
  'recently-added': {
    title: 'Recently Added Timeline',
    tagline: 'Chronological timeline of camera captures, batch acquisitions, and catalog ingestions.',
    badge: 'Collector Timeline',
    icon: Clock,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    summary: 'Track the growth of your banknote vault over time. Review recent scanning sessions, view total money spent versus current value, and replay acquisition milestones.',
  },
};

export default function ComingSoonFeature({ type }: { type: ComingSoonFeatureType }) {
  const config = FEATURE_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Navigation Link */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/banknotes"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0b132b] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Notes</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Hero Showcase Banner */}
      <div className={`w-full bg-linear-to-r ${config.gradient} text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-white/20`}>
        {/* Subtle Background Watermark Icon */}
        <div className="absolute -right-6 -bottom-10 opacity-15 select-none pointer-events-none">
          <Icon className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black tracking-wider uppercase border border-white/30 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Coming Soon • {config.badge}</span>
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
              {config.title}
            </h1>
            <p className="text-sm sm:text-base text-blue-100 font-medium mt-1 leading-relaxed">
              {config.tagline}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed pt-1">
            {config.summary}
          </p>

          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <Link
              href="/banknotes"
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ListOrdered className="h-4 w-4 text-blue-600" />
              <span>Browse All Notes</span>
            </Link>

            <Link
              href="/capture"
              className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-white text-xs font-bold flex items-center gap-2 border border-white/20 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add More Banknotes</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
