'use client';

import React, { useState } from 'react';
import { 
  Scale, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import type { BanknoteValuation } from '@/types';

interface MultiSourceValuationCardProps {
  banknoteId?: string;
  valuation?: Partial<BanknoteValuation> | null;
  banknoteData?: {
    countryOfOrigin?: string | null;
    denomination?: string | null;
    currency?: string | null;
    pickNumber?: string | null;
    issueYear?: string | null;
    conditionGrade?: string | null;
    isReplacementNote?: boolean | null;
    fancySerialType?: string | null;
    collectorMarketValue?: string | null;
    numistaPmgValue?: string | null;
    purchasePrice?: number | null;
  };
  onValuationUpdated?: (newValuation: BanknoteValuation) => void;
  compact?: boolean;
}

export function MultiSourceValuationCard({
  banknoteId,
  valuation: initialValuation,
  banknoteData,
  onValuationUpdated,
  compact = false,
}: MultiSourceValuationCardProps) {
  const [valuation, setValuation] = useState<Partial<BanknoteValuation> | null>(initialValuation || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Parse fallbacks from banknoteData
  const pmgVal = valuation?.pmgValue || 
    (banknoteData as any)?.pmgValue || 
    (banknoteData?.numistaPmgValue ? banknoteData.numistaPmgValue.split('/')?.[0]?.trim() : '—');

  const numistaVal = valuation?.numistaValue || 
    (banknoteData as any)?.numistaValue || 
    (banknoteData?.numistaPmgValue ? banknoteData.numistaPmgValue.split('/')?.[1]?.trim() : '—');

  const marketVal = valuation?.collectorMarketValue || 
    banknoteData?.collectorMarketValue || 
    '—';

  const heritageVal = valuation?.heritageValue || (banknoteData as any)?.heritageValue || '—';
  const stacksVal = valuation?.stacksBowersValue || (banknoteData as any)?.stacksBowersValue || '—';
  const ebayVal = valuation?.ebayValue || valuation?.ebayLastSold || (banknoteData as any)?.ebayValue || '—';
  const wholesaleVal = valuation?.wholesaleBuyoutValue || '—';

  const conflictDetected = valuation?.conflictDetected || false;
  const divergencePct = valuation?.divergencePercentage;

  const handleRefreshValuation = async () => {
    if (!banknoteId && !banknoteData) return;
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const url = banknoteId ? `/api/valuation/${banknoteId}` : '/api/valuation/sandbox-test';
      const method = banknoteId ? 'POST' : 'POST';
      const body = {
        countryOfOrigin: banknoteData?.countryOfOrigin,
        denomination: banknoteData?.denomination,
        currency: banknoteData?.currency,
        pickNumber: banknoteData?.pickNumber,
        issueYear: banknoteData?.issueYear,
        conditionGrade: banknoteData?.conditionGrade,
        isReplacementNote: banknoteData?.isReplacementNote,
        fancySerialType: banknoteData?.fancySerialType,
        source: 'user_refresh',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Valuation calculation failed');

      const data = await res.json();
      const updatedValuation = data.data || data;
      setValuation(updatedValuation);
      if (onValuationUpdated) {
        onValuationUpdated(updatedValuation);
      }
    } catch (err: any) {
      setRefreshError(err?.message || 'Failed to update valuation');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-linear-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>5+1 Multi-Source Valuation Matrix</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Defensible
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              5 Authoritative Industry Data Vectors + 1 Consensus Master
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshValuation}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          title="Re-run 5+1 multi-source calculation and record a new valuation log point"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Evaluating...' : 'Re-evaluate'}</span>
        </button>
      </div>

      {refreshError && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          ⚠️ {refreshError}
        </div>
      )}

      {/* Discrepancy Conflict Banner if > 20% */}
      {conflictDetected && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold block">
              Divergence Conflict Detected ({divergencePct ? `${divergencePct}% spread` : '> 20% variance'})
            </span>
            <span className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
              Auction floor and catalog guides deviate significantly. Consensus calculation applied conservative liquidity weighting.
            </span>
          </div>
        </div>
      )}

      {/* Main Consensus Master Display */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          {/* Master Retail Value */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-500/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              💎 Collector Market Consensus
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {marketVal}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Condition & variety weighted fair market replacement value
            </p>
          </div>

          {/* Wholesale Buyout */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              💼 Dealer Wholesale / Liquidation Floor
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-700 dark:text-slate-200">
              {wholesaleVal !== '—' ? wholesaleVal : (marketVal !== '—' ? `$${(parseFloat(marketVal.replace(/[$,]/g, '')) * 0.65).toFixed(2)}` : '—')}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Estimated dealer buyout or immediate auction reserve
            </p>
          </div>
        </div>

        {/* 5 Independent Source Cards */}
        <div className="pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            5 Independent Numismatic Vectors:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. PMG */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">1. PMG Guide</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-white block">{pmgVal}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Catalog Anchor</span>
            </div>

            {/* 2. Heritage */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">2. Heritage</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-white block">{heritageVal}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Auction Realized</span>
            </div>

            {/* 3. Stack's Bowers */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">3. Stack&apos;s Bowers</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-white block">{stacksVal}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Hammer Floor</span>
            </div>

            {/* 4. eBay SOLD */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                <span>4. eBay SOLD</span>
                {valuation?.ebaySoldUrl && (
                  <a
                    href={valuation.ebaySoldUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400"
                    title="View completed & sold listings on eBay"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 block">{ebayVal}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {valuation?.ebaySoldUrl ? (
                  <a href={valuation.ebaySoldUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
                    Verified Sold ↗
                  </a>
                ) : (
                  'Realized Trades'
                )}
              </span>
            </div>

            {/* 5. Numista */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">5. Numista</span>
              <span className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 block">{numistaVal}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Community v3</span>
            </div>
          </div>
        </div>

        {/* Special Tags / Multipliers */}
        {valuation?.valuationNotes && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{valuation.valuationNotes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
