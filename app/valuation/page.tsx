'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react';
import { MultiSourceValuationCard } from '@/components/banknote/MultiSourceValuationCard';
import { HistoricalValuationTrendChart } from '@/components/banknote/HistoricalValuationTrendChart';
import type { Banknote } from '@/types';

const PRESET_RANDOM_NOTES = [
  { label: '🇨🇦 Canada $10 (2024) P-114', country: 'Canada', denomination: '10 Dollars', year: '2024', pick: 'P-114', grade: 'UNC' },
  { label: '🇮🇳 India ₹50 (2018) P-104', country: 'India', denomination: '50 Rupees', year: '2018', pick: 'P-104', grade: 'UNC' },
  { label: '🇯🇵 Japan ¥1,000 (2004) P-104', country: 'Japan', denomination: '1000 Yen', year: '2004', pick: 'P-104', grade: 'UNC' },
  { label: '🇬🇧 UK £5 (2016) P-391', country: 'United Kingdom', denomination: '5 Pounds', year: '2016', pick: 'P-391', grade: 'UNC' },
  { label: '🇺🇸 USA $100 (2013) P-540', country: 'United States', denomination: '$100', year: '2013', pick: 'P-540', grade: 'AU' },
  { label: '🇧🇷 Brazil 100 Cruzados (1986)', country: 'Brazil', denomination: '100 Cruzados', year: '1986', pick: 'P-211c', grade: 'UNC' },
];

export default function ValuationMatrixPage() {
  const [activeTab, setActiveTab] = useState<'COLLECTION' | 'SANDBOX'>('COLLECTION');
  const [collectionNotes, setCollectionNotes] = useState<Banknote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Live Sandbox state
  const [testCountry, setTestCountry] = useState('Canada');
  const [testDenom, setTestDenom] = useState('10 Dollars');
  const [testYear, setTestYear] = useState('2024');
  const [testPick, setTestPick] = useState('P-114');
  const [testGrade, setTestGrade] = useState('UNC');
  const [testIsStar, setTestIsStar] = useState(false);
  const [testFancySerial, setTestFancySerial] = useState('None');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Load real notes from collection
  useEffect(() => {
    async function fetchCollection() {
      try {
        setIsLoadingNotes(true);
        const res = await fetch('/api/banknotes');
        if (res.ok) {
          const json = await res.json();
          const items: Banknote[] = json.banknotes || json.items || [];
          setCollectionNotes(items);
          if (items.length > 0) {
            setSelectedNoteId(items[0].id || '');
          } else {
            setActiveTab('SANDBOX');
          }
        }
      } catch (err) {
        console.warn('Failed to load banknotes for valuation:', err);
      } finally {
        setIsLoadingNotes(false);
      }
    }

    fetchCollection();
  }, []);

  const selectedNote = collectionNotes.find((n) => n.id === selectedNoteId);

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
        setSandboxResult(json?.data || json);
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
            Reconciles PMG Guide, Heritage, Stack&apos;s Bowers, eBay SOLD, and Numista with historical price tracking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('COLLECTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COLLECTION'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Collection Note ({collectionNotes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SANDBOX')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SANDBOX'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Instant Sandbox</span>
          </button>
        </div>
      </div>

      {/* COLLECTION MODE: REAL SPECIMEN SELECTOR */}
      {activeTab === 'COLLECTION' && (
        <div className="space-y-6">
          {collectionNotes.length > 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Select Specimen:
                </span>
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer min-w-64"
                >
                  {collectionNotes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.countryOfOrigin} {note.denomination} ({note.issueYear || 'ND'}) — {note.pickNumber || 'No Pick'} [{note.conditionGrade || 'UNC'}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedNote && (
                <div className="text-xs text-slate-500 font-mono">
                  Serial: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedNote.fullSerialNumber || '—'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500">
              <Database className="h-8 w-8 mx-auto mb-2 text-slate-400 opacity-60" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No banknotes found in collection database.</p>
              <p className="mt-1">Capture or sync notes on the mobile capture page, or use the Instant Sandbox below.</p>
              <button
                type="button"
                onClick={() => setActiveTab('SANDBOX')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Open Instant Sandbox</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNote && (
            <div className="space-y-6">
              {/* 5+1 Multi-Source Matrix Card */}
              <MultiSourceValuationCard
                banknoteId={selectedNote.id}
                banknoteData={{
                  countryOfOrigin: selectedNote.countryOfOrigin,
                  denomination: selectedNote.denomination,
                  currency: selectedNote.currency,
                  pickNumber: selectedNote.pickNumber,
                  issueYear: selectedNote.issueYear,
                  conditionGrade: selectedNote.conditionGrade,
                  isReplacementNote: selectedNote.isReplacementNote,
                  fancySerialType: selectedNote.fancySerialType,
                  collectorMarketValue: selectedNote.collectorMarketValue,
                  numistaPmgValue: selectedNote.numistaPmgValue,
                  purchasePrice: selectedNote.purchasePrice,
                }}
                onValuationUpdated={(newVal) => {
                  setCollectionNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, collectorMarketValue: newVal.collectorMarketValue } : n))
                  );
                }}
              />

              {/* Historical Valuation Trend Chart & Log */}
              <HistoricalValuationTrendChart
                banknoteId={selectedNote.id || ''}
                purchasePrice={selectedNote.purchasePrice}
                acquisitionDate={selectedNote.acquisitionDate}
                currentValue={selectedNote.collectorMarketValue}
              />
            </div>
          )}
        </div>
      )}

      {/* SANDBOX MODE: ARBITRARY BANKNOTE TESTER */}
      {activeTab === 'SANDBOX' && (
        <div className="space-y-6">
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
                      Multi-Source
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Query the live 5+1 consensus engine for any arbitrary world banknote.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleTestValuation()}
                disabled={isEvaluating}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Calculating...' : 'Run Live 5+1 Valuation'}</span>
              </button>
            </div>

            {/* Presets */}
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

            {/* Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Country</label>
                <input
                  type="text"
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Denomination</label>
                <input
                  type="text"
                  value={testDenom}
                  onChange={(e) => setTestDenom(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Year</label>
                <input
                  type="text"
                  value={testYear}
                  onChange={(e) => setTestYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pick #</label>
                <input
                  type="text"
                  value={testPick}
                  onChange={(e) => setTestPick(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-medium focus:outline-hidden focus:border-emerald-400 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Grade</label>
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
          </div>

          {/* Sandbox 5+1 Results Card */}
          {sandboxResult && (
            <MultiSourceValuationCard
              valuation={sandboxResult}
              banknoteData={{
                countryOfOrigin: testCountry,
                denomination: testDenom,
                pickNumber: testPick,
                issueYear: testYear,
                conditionGrade: testGrade,
              }}
            />
          )}
        </div>
      )}

      {/* Discrepancy & 20% Conflict Engine Documentation Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 dark:border-amber-700/50 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
            Automated 5+1 Conflict Resolution & Divergence Rule Active
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            If external sources disagree by &gt; 20% in valuation, the system raises an automated conflict flag. The master consensus weights real-world market liquidity (<strong className="font-semibold text-slate-900 dark:text-white">eBay SOLD listings 35%</strong> + <strong className="font-semibold text-slate-900 dark:text-white">Numista 25%</strong> + <strong className="font-semibold text-slate-900 dark:text-white">PMG Guide 20%</strong> + <strong className="font-semibold text-slate-900 dark:text-white">Heritage 10%</strong> + <strong className="font-semibold text-slate-900 dark:text-white">Stack&apos;s Bowers 10%</strong>) and logs date-stamped records into your permanent audit history.
          </p>
        </div>
      </div>
    </div>
  );
}
