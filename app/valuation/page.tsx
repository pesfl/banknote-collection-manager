'use client';

import React, { useState } from 'react';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sliders, 
  Lock, 
  Unlock, 
  Info,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface EvidenceRow {
  field: string;
  aiVision: string;
  pmgGuide: string;
  numista: string;
  banknoteBook: string;
  auctionArchives: string;
  finalMaster: string;
  confidence: string;
  status: 'CONFIRMED' | 'CONFLICT' | 'PROBABLE';
}

const SAMPLE_EVIDENCE: EvidenceRow[] = [
  {
    field: 'Country of Origin',
    aiVision: 'Brazil',
    pmgGuide: 'Brazil',
    numista: 'Brazil',
    banknoteBook: 'Brazil',
    auctionArchives: 'Brazil',
    finalMaster: 'Brazil',
    confidence: '🟢 100%',
    status: 'CONFIRMED',
  },
  {
    field: 'Denomination & Currency',
    aiVision: '100 Cruzados',
    pmgGuide: '100 Cruzados',
    numista: '100 Cruzados',
    banknoteBook: '100 Cruzados',
    auctionArchives: '100 Cruzados',
    finalMaster: '100 Cruzados',
    confidence: '🟢 100%',
    status: 'CONFIRMED',
  },
  {
    field: 'Series / Issue Date',
    aiVision: '1986',
    pmgGuide: '1986',
    numista: '1986',
    banknoteBook: '1986',
    auctionArchives: '1986',
    finalMaster: '1986',
    confidence: '🟢 100%',
    status: 'CONFIRMED',
  },
  {
    field: 'Catalog Pick Number',
    aiVision: 'P-211c',
    pmgGuide: 'P-211b (Baseline)',
    numista: 'P-211c (Signatures)',
    banknoteBook: 'B208c',
    auctionArchives: 'P-211c',
    finalMaster: 'P-211c',
    confidence: '🟢 95%',
    status: 'CONFIRMED',
  },
  {
    field: 'Signatories',
    aiVision: 'Funaro / Sayad',
    pmgGuide: 'Funaro / Sayad',
    numista: 'Funaro / Sayad',
    banknoteBook: 'Funaro / Sayad',
    auctionArchives: 'Funaro / Sayad',
    finalMaster: 'Funaro / Sayad',
    confidence: '🟢 100%',
    status: 'CONFIRMED',
  },
  {
    field: 'Physical Condition Grade',
    aiVision: 'UNC (Uncirculated)',
    pmgGuide: 'UNC 64 EPQ',
    numista: 'UNC',
    banknoteBook: 'UNC',
    auctionArchives: 'UNC 65 EPQ',
    finalMaster: 'UNC (Crisp Original)',
    confidence: '🟢 95%',
    status: 'CONFIRMED',
  },
  {
    field: 'Realized Market Sales ($)',
    aiVision: '$15.00–$18.00',
    pmgGuide: '$15.00 (Reference)',
    numista: '$14.50 (User Sales)',
    banknoteBook: '$16.00',
    auctionArchives: '$14.00–$18.00 (n=14)',
    finalMaster: '$15.00–$16.50',
    confidence: '🟢 92%',
    status: 'CONFIRMED',
  },
];

export default function ValuationMatrixPage() {
  const [selectedSpecimen, setSelectedSpecimen] = useState('BN-000143');
  const [authorityLocked, setAuthorityLocked] = useState(true);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>5+1 Multi-Source Valuation Matrix</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Defensible price consensus and cross-catalog conflict resolution engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthorityLocked(!authorityLocked)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              authorityLocked 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            {authorityLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            <span>{authorityLocked ? 'Authority Locked' : 'Manual Override Active'}</span>
          </button>
        </div>
      </div>

      {/* 4-Tier Valuation Output Summary Box */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-blue-400">Specimen {selectedSpecimen}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🟢 95% Overall Confidence
              </span>
            </div>
            <h2 className="text-xl font-bold">
              Brazil 100 Cruzados (1986) — Pick P-211c
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Serial: <span className="font-mono text-slate-300">97.151.001 C</span> | Grade: <span className="font-semibold text-slate-200">UNC</span> | Location: <span className="font-mono text-slate-300">Box 01 -&gt; Sec A -&gt; Pos 23</span>
            </p>
          </div>

          {/* Master Valuation Display */}
          <div className="text-right">
            <span className="text-xs text-slate-400">Estimated Current Market Value</span>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              $15.00 – $16.50
            </div>
            <span className="text-[11px] text-slate-400">
              Dealer Wholesale / Buyout: <span className="text-slate-200 font-mono">$10.00 – $12.50</span>
            </span>
          </div>
        </div>

        {/* 5-Source Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 text-xs">
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">1. PMG Guide</span>
            <span className="font-bold text-slate-200 font-mono block">$15.00</span>
            <span className="text-[9px] text-slate-500">Catalog Anchor</span>
          </div>
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">2. Heritage Sales</span>
            <span className="font-bold text-slate-200 font-mono block">$16.00</span>
            <span className="text-[9px] text-slate-500">Realized Sales</span>
          </div>
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">3. Stack&apos;s Bowers</span>
            <span className="font-bold text-slate-200 font-mono block">$14.50</span>
            <span className="text-[9px] text-slate-500">Auction History</span>
          </div>
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">4. eBay SOLD</span>
            <span className="font-bold text-emerald-400 font-mono block">$15.50</span>
            <span className="text-[9px] text-slate-500">Completed (n=14)</span>
          </div>
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">5. Numista</span>
            <span className="font-bold text-slate-200 font-mono block">P-211c</span>
            <span className="text-[9px] text-slate-500">Signature Match</span>
          </div>
          <div className="rounded-xl p-3 bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-1">6. Archives</span>
            <span className="font-bold text-slate-200 font-mono block">Low Census</span>
            <span className="text-[9px] text-slate-500">Historical Sales</span>
          </div>
        </div>
      </div>

      {/* Discrepancy & Conflict Banner Alert */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-700/50 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
            Automated Field Authority Engine Active
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            If catalog sources disagree by &gt; 20% in value or report diverging Pick suffixes, the system raises an automated review flag. Pick catalog authority is dynamically assigned to <strong className="font-semibold text-slate-900 dark:text-white">The Banknote Book + PMG</strong>, while marketplace price weight is anchored to <strong className="font-semibold text-slate-900 dark:text-white">eBay SOLD completed listings</strong>.
          </p>
        </div>
      </div>

      {/* Multi-Source Evidence Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Granular Source Evidence Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Independent per-field comparison across AI Vision and verified external numismatic references.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                <th className="pb-3 pl-2">Field</th>
                <th className="pb-3">Gemini Vision AI</th>
                <th className="pb-3">PMG Guide</th>
                <th className="pb-3">Numista</th>
                <th className="pb-3">The Banknote Book</th>
                <th className="pb-3">Auction Archives</th>
                <th className="pb-3 font-semibold text-slate-700 dark:text-slate-300">Master Record</th>
                <th className="pb-3 pr-2 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {SAMPLE_EVIDENCE.map((row) => (
                <tr key={row.field} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pl-2 font-sans font-semibold text-slate-900 dark:text-white">
                    {row.field}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{row.aiVision}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{row.pmgGuide}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{row.numista}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{row.banknoteBook}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{row.auctionArchives}</td>
                  <td className="py-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded">
                    {row.finalMaster}
                  </td>
                  <td className="py-3 pr-2 text-right font-sans font-semibold text-emerald-600 dark:text-emerald-400">
                    {row.confidence}
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
