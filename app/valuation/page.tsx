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
  Sparkles,
  RefreshCw,
  ExternalLink
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

const PRESET_RANDOM_NOTES = [
  { label: '🇨🇦 Canada $10 (2024) P-114', country: 'Canada', denomination: '10 Dollars', year: '2024', pick: 'P-114', grade: 'UNC' },
  { label: '🇮🇳 India ₹50 (2018) P-104', country: 'India', denomination: '50 Rupees', year: '2018', pick: 'P-104', grade: 'UNC' },
  { label: '🇯🇵 Japan ¥1,000 (2004) P-104', country: 'Japan', denomination: '1000 Yen', year: '2004', pick: 'P-104', grade: 'UNC' },
  { label: '🇬🇧 UK £5 (2016) P-391', country: 'United Kingdom', denomination: '5 Pounds', year: '2016', pick: 'P-391', grade: 'UNC' },
  { label: '🇺🇸 USA $100 (2013) P-540', country: 'United States', denomination: '$100', year: '2013', pick: 'P-540', grade: 'AU' },
  { label: '🇧🇷 Brazil 100 Cruzados (1986)', country: 'Brazil', denomination: '100 Cruzados', year: '1986', pick: 'P-211c', grade: 'UNC' },
];

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

  // Live Sandbox state
  const [testCountry, setTestCountry] = useState('Canada');
  const [testDenom, setTestDenom] = useState('10 Dollars');
  const [testYear, setTestYear] = useState('2024');
  const [testPick, setTestPick] = useState('P-114');
  const [testGrade, setTestGrade] = useState('UNC');
  const [testIsStar, setTestIsStar] = useState(false);
  const [testFancySerial, setTestFancySerial] = useState('None');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);

  const handleTestValuation = async (override?: any) => {
    setIsEvaluating(true);
    const payload = {
      countryOfOrigin: override?.country || testCountry,
      denomination: override?.denomination || testDenom,
      issueYear: override?.year || testYear,
      pickNumber: override?.pick || testPick,
      conditionGrade: override?.grade || testGrade,
      isReplacementNote: override ? false : testIsStar,
      fancySerialType: override ? 'None' : testFancySerial,
    };

    try {
      const res = await fetch('/api/valuation/sandbox-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        setLiveResult(json?.data || json);
      }
    } catch (err) {
      console.warn('Valuation sandbox error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_RANDOM_NOTES[0]) => {
    setTestCountry(preset.country);
    setTestDenom(preset.denomination);
    setTestYear(preset.year);
    setTestPick(preset.pick);
    setTestGrade(preset.grade);
    handleTestValuation(preset);
  };

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

      {/* Live Random Banknote Valuation Sandbox */}
      <div className="rounded-3xl p-6 bg-linear-to-br from-slate-900 via-[#0e1a38] to-[#071026] text-white shadow-2xl border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Live Banknote Valuation Sandbox
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Instant Test
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Test any arbitrary banknote across PMG, Numista catalog, live eBay sold listings, and market consensus.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleTestValuation()}
            disabled={isEvaluating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Calculating...' : 'Run Live Valuation'}</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="py-4 border-b border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
            Quick 1-Click Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_RANDOM_NOTES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 text-xs transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-4 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Country</label>
            <input
              type="text"
              value={testCountry}
              onChange={(e) => setTestCountry(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs"
              placeholder="e.g. Canada"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Denomination</label>
            <input
              type="text"
              value={testDenom}
              onChange={(e) => setTestDenom(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs"
              placeholder="e.g. 10 Dollars"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Year</label>
            <input
              type="text"
              value={testYear}
              onChange={(e) => setTestYear(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
              placeholder="e.g. 2024"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pick #</label>
            <input
              type="text"
              value={testPick}
              onChange={(e) => setTestPick(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
              placeholder="e.g. P-114"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Condition Grade</label>
            <select
              value={testGrade}
              onChange={(e) => setTestGrade(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs"
            >
              <option value="UNC">UNC (Uncirculated)</option>
              <option value="AU">AU (About Uncirculated)</option>
              <option value="XF">XF (Extra Fine)</option>
              <option value="VF">VF (Very Fine)</option>
              <option value="F">F (Fine)</option>
            </select>
          </div>
          <div className="flex flex-col justify-end gap-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={testIsStar}
                onChange={(e) => setTestIsStar(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span>★ Star Note (+150%)</span>
            </label>
          </div>
        </div>

        {/* Live Calculation Results Breakdown */}
        {liveResult && (
          <div className="mt-2 pt-4 border-t border-white/10 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* PMG */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">🏛️ PMG Catalog</span>
                <span className="text-xl font-bold font-mono text-blue-400 block">{liveResult.pmgValue || '—'}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Catalog Baseline Anchor</span>
              </div>

              {/* Numista */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">🪙 Numista Catalog</span>
                <span className="text-xl font-bold font-mono text-cyan-300 block">{liveResult.numistaValue || '—'}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Community Curve (v2)</span>
              </div>

              {/* eBay */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="uppercase font-semibold">🛒 eBay Last Sold</span>
                  {liveResult.ebaySoldUrl && (
                    <a
                      href={liveResult.ebaySoldUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <div className="text-xl font-bold font-mono text-amber-300">
                  {liveResult.ebayLastSold ? (
                    liveResult.ebayLastSold
                  ) : liveResult.ebaySoldUrl ? (
                    <a
                      href={liveResult.ebaySoldUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 font-sans underline"
                    >
                      Check Sold ↗
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Verified Sold Listings</span>
              </div>

              {/* Market Consensus */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block mb-1">💎 Market Consensus</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-400 block">{liveResult.collectorMarketValue || '—'}</span>
                <span className="text-[10px] text-emerald-300/80 mt-0.5 block">Condition Weighted</span>
              </div>
            </div>

            {liveResult.valuationNotes && (
              <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                ✨ {liveResult.valuationNotes}
              </div>
            )}
          </div>
        )}
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
