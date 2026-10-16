'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAllSpecimens, deleteSpecimen, clearAllSpecimens, clearAllSyncData } from '@/lib/offline/idb';
import CondensedSpecimenModal from '@/components/banknote/CondensedSpecimenModal';
import {
  Banknote,
  Globe,
  Layers,
  Copy,
  CircleDollarSign,
  Plus,
  Sparkles,
  Printer,
  Search,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CreditCard,
  MessageSquare,
  CircleDot,
  Box,
  Bell,
  ArrowLeft,
  Clock,
  Trash2,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Collection categories tabs
const CATEGORIES = [
  { id: 'banknotes', label: 'Banknotes', icon: Banknote, isComingSoon: false },
  { id: 'cards', label: 'Sports Cards', icon: CreditCard, isComingSoon: true },
  { id: 'comics', label: 'Comics', icon: MessageSquare, isComingSoon: true },
  { id: 'pokemon', label: 'Pokémon', icon: CircleDot, isComingSoon: true },
  { id: 'other', label: 'Other', icon: Box, isComingSoon: true },
];

interface ComingSoonInfo {
  title: string;
  subtitle: string;
  description: string;
  targetRelease: string;
  icon: React.ElementType;
  badge: string;
  features: { title: string; desc: string; icon: string }[];
  sampleStats: { label: string; value: string }[];
}

const COMING_SOON_DATA: Record<string, ComingSoonInfo> = {
  cards: {
    title: 'Sports Cards Vault',
    subtitle: 'Baseball • Basketball • Football • Soccer • Hockey',
    description: 'Track raw & graded slabs with automated PSA/BGS/SGC certification lookup, real-time eBay sold pricing, pop report tracking, and rookie card indexing.',
    targetRelease: 'Q4 2026',
    icon: CreditCard,
    badge: 'Coming Soon',
    features: [
      { title: 'Slab Barcode & Cert Scanner', desc: 'Instant PSA, BGS, CGC, and SGC barcode recognition with automatic grade verification.', icon: '🏷️' },
      { title: 'Live Pop Report & Census', desc: 'Real-time population analysis comparing PSA 10 gem mints to raw ungraded print runs.', icon: '📈' },
      { title: 'Raw-to-Graded Arbitrage', desc: 'AI-assisted sub-grade inspection (centering, corners, edges, surface) before submitting for grading.', icon: '💎' },
    ],
    sampleStats: [
      { label: 'Planned Card Sets', value: '12,500+' },
      { label: 'Grading Companies', value: 'PSA • BGS • SGC • CGC' },
      { label: 'Price Feeds', value: 'eBay • Card Ladder • PWCC' },
    ]
  },
  comics: {
    title: 'Comics Collection Vault',
    subtitle: 'Golden Age • Silver Age • Bronze Age • Modern Age',
    description: 'Catalog your comic books with key issue first appearance detection, CGC/CBCS census data, signature series verification, and variant cover archives.',
    targetRelease: 'Q1 2027',
    icon: MessageSquare,
    badge: 'Coming Soon',
    features: [
      { title: 'Key Issue & 1st Appearance AI', desc: 'Automatically tag crucial origin stories, first appearances, and artist deaths from cover scans.', icon: '📖' },
      { title: 'CGC / CBCS Census & Pedigree', desc: 'Track Universal, Signature Series, and Qualified labels alongside historical pedigree provenance.', icon: '🛡️' },
      { title: 'Variant & Incentive Ratios', desc: 'Index 1:25, 1:50, 1:100 retailer incentive variants with cover artist classification.', icon: '🎨' },
    ],
    sampleStats: [
      { label: 'Indexed Titles', value: '45,000+' },
      { label: 'Grading Standard', value: 'Overstreet 10-Point Scale' },
      { label: 'Market Indexes', value: 'GoCollect • GPAnalysis' },
    ]
  },
  pokemon: {
    title: 'Pokémon TCG Vault',
    subtitle: 'WOTC Era • EX Series • Sun & Moon • Sword & Shield • Scarlet & Violet',
    description: 'Comprehensive Pokémon card inventory system featuring set symbol AI recognition, 1st Edition and shadowless detection, holographic scratch grading, and live TCGPlayer valuation.',
    targetRelease: 'Q4 2026',
    icon: CircleDot,
    badge: 'Coming Soon',
    features: [
      { title: 'Set Symbol & 1st Edition AI Scanner', desc: 'Instant camera recognition of Base Set through modern expansion set symbols, rarity stars, and card numbers.', icon: '⚡' },
      { title: 'Holo Foil & Centering Inspection', desc: 'Multi-angle reflection scan to calculate 60/40 centering ratios and micro-scratch detection.', icon: '✨' },
      { title: 'TCGPlayer & Cardmarket Live Feeds', desc: 'Real-time market price syncing across near mint, lightly played, and PSA 10 slabs.', icon: '📊' },
    ],
    sampleStats: [
      { label: 'Expansions Supported', value: '110+ Sets' },
      { label: 'Language Editions', value: 'English • Japanese' },
      { label: 'Valuation Feeds', value: 'TCGPlayer • PriceCharting' },
    ]
  },
  other: {
    title: 'Custom Collectibles & Curiosities',
    subtitle: 'Coins • Bullion • Stamps • Vintage Watches • Historical Artifacts',
    description: 'Versatile cataloging suite for coins (Krause/KM), stamps (Scott/Michel), luxury timepieces, and rare memorabilia with custom schema builder and provenance tracking.',
    targetRelease: 'Q1 2027',
    icon: Box,
    badge: 'Coming Soon',
    features: [
      { title: 'Numismatic Coins & Bullion', desc: 'Gold/silver melt value live calculations tied to spot precious metal price indices.', icon: '🪙' },
      { title: 'Philatelic Stamp Archives', desc: 'Watermark, perforation gauge, and gum condition cataloging with Scott catalog indexing.', icon: '📮' },
      { title: 'Dynamic Schema Builder', desc: 'Create custom attributes, materials, dimensions, and provenance documents for any heirloom.', icon: '⚙️' },
    ],
    sampleStats: [
      { label: 'Asset Types', value: 'Unlimited' },
      { label: 'Spot Metal Feeds', value: 'Gold • Silver • Platinum' },
      { label: 'Media Support', value: 'High-Res Multi-Angle Scans' },
    ]
  }
};

interface BanknoteRow {
  id: string;
  country: string;
  countryFlag: string;
  denomination: string;
  year: string;
  pickNumber: string;
  condition: string;
  qty: number;
  value: string;
  isSpecial: boolean;
  isVerified: boolean;
  hasMissingInfo: boolean;
  frontImage: string;
  backImage: string;
  notes?: string;
  serialNumber?: string;
  pmgValue?: string;
  numistaValue?: string;
  ebayLastSold?: string;
  ebaySoldUrl?: string;
}

const SAMPLE_BANKNOTES: BanknoteRow[] = [];

function getCountryFlag(countryName?: string): string {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase();
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('brazil') || c.includes('brasil')) return '🇧🇷';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('bolivia')) return '🇧🇴';
  if (c.includes('mexico') || c.includes('méxico')) return '🇲🇽';
  if (c.includes('united states') || c.includes('usa') || c.includes('us')) return '🇺🇸';
  if (c.includes('india')) return '🇮🇳';
  if (c.includes('china')) return '🇨🇳';
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england')) return '🇬🇧';
  if (c.includes('japan')) return '🇯🇵';
  if (c.includes('germany')) return '🇩🇪';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('italy')) return '🇮🇹';
  if (c.includes('spain')) return '🇪🇸';
  return '🌐';
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlCountry = searchParams?.get('country');
  const [banknotesList, setBanknotesList] = useState<BanknoteRow[]>([]);

  useEffect(() => {
    function getSafeBlobUrl(blob?: any): string {
      if (!blob) return '';
      try {
        if (blob instanceof Blob || (typeof blob === 'object' && blob.size)) {
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn('Could not create object URL for blob:', e);
      }
      return '';
    }

    async function loadLocalNotes() {
      try {
        const local = await getAllSpecimens();
        if (local && local.length > 0) {
          const mapped: BanknoteRow[] = local.map((l) => {
            const ex = (l.extractedData || {}) as any;
            const realValuation = 
              ex.collectorMarketValue ||
              ex.valuation?.collectorMarketValue ||
              (typeof ex.valuation === 'string' && ex.valuation !== '$150' ? ex.valuation : null) ||
              'Valuation Pending';
            const countryName = ex.countryOfOrigin || ex.country || 'Unknown';

            return {
              id: l.id,
              country: countryName,
              countryFlag: getCountryFlag(countryName),
              denomination: ex.denomination && ex.denomination !== 'Unknown' ? ex.denomination : '—',
              year: ex.issueYear || ex.seriesDate || new Date(l.capturedAt).getFullYear().toString(),
              pickNumber: ex.pickNumber || 'P-Pending',
              condition: ex.conditionGrade || 'UNC',
              qty: 1,
              value: realValuation,
              pmgValue: ex.pmgValue || ex.valuation?.pmgValue,
              numistaValue: ex.numistaValue || ex.valuation?.numistaValue,
              ebayLastSold: ex.ebayLastSold || ex.valuation?.ebayLastSold,
              ebaySoldUrl: ex.valuation?.ebaySoldUrl,
              isSpecial: Boolean(ex.fancySerialType && ex.fancySerialType !== 'None') || Boolean(ex.isReplacementNote),
              isVerified: l.syncStatus === 'synced',
              hasMissingInfo: !ex.pickNumber || !ex.issueYear,
              frontImage: getSafeBlobUrl(l.frontImageBlob),
              backImage: getSafeBlobUrl(l.backImageBlob),
              notes: ex.notes || l.notes || 'Specimen captured locally',
              serialNumber: ex.fullSerialNumber || ex.serialNumeric || 'Local IDB',
            };
          });

          const localIds = new Set(local.map((l) => l.id));

          // Merge cloud banknotes from Neon PostgreSQL if available
          try {
            const cloudRes = await fetch('/api/banknotes').catch(() => null);
            if (cloudRes && cloudRes.ok) {
              const cloudData = await cloudRes.json();
              if (cloudData?.banknotes && Array.isArray(cloudData.banknotes)) {
                for (const cb of cloudData.banknotes) {
                  if (!localIds.has(cb.id)) {
                    localIds.add(cb.id);
                    const countryName = cb.countryOfOrigin || 'Unknown';
                    mapped.push({
                      id: cb.id,
                      country: countryName,
                      countryFlag: getCountryFlag(countryName),
                      denomination: cb.denomination && cb.denomination !== 'Unknown' ? cb.denomination : '—',
                      year: cb.issueYear || cb.seriesDate || '—',
                      pickNumber: cb.pickNumber || 'P-Pending',
                      condition: cb.conditionGrade || 'UNC',
                      qty: 1,
                      value: cb.collectorMarketValue || 'Valuation Pending',
                      pmgValue: cb.numistaPmgValue ? cb.numistaPmgValue.split('/')?.[0]?.trim() : undefined,
                      numistaValue: cb.numistaPmgValue ? cb.numistaPmgValue.split('/')?.[1]?.trim() : undefined,
                      ebayLastSold: cb.extractionData?.ebayLastSold,
                      ebaySoldUrl: cb.extractionData?.ebaySoldUrl,
                      isSpecial: Boolean(cb.fancySerialType && cb.fancySerialType !== 'None') || Boolean(cb.isReplacementNote),
                      isVerified: true,
                      hasMissingInfo: !cb.pickNumber || !cb.issueYear,
                      frontImage: cb.frontImageUrl || cb.displayImageUrl || '',
                      backImage: cb.backImageUrl || '',
                      notes: cb.notes || 'Cloud synchronized specimen',
                      serialNumber: cb.fullSerialNumber || 'N/A',
                    });
                  }
                }

                // Automatically push any existing local notes up to Neon PostgreSQL cloud
                const cloudBanknoteIds = new Set(cloudData.banknotes.map((b: any) => b.id));
                const unSynced = local.filter((l: any) => !cloudBanknoteIds.has(l.id));
                if (unSynced.length > 0) {
                  const toUpload = unSynced.map((l: any) => {
                    const ex = (l.extractedData || {}) as any;
                    return {
                      id: l.id,
                      countryOfOrigin: ex.countryOfOrigin || ex.country,
                      denomination: ex.denomination,
                      currency: ex.currency,
                      pickNumber: ex.pickNumber,
                      issueYear: ex.issueYear,
                      seriesDate: ex.seriesDate,
                      fullSerialNumber: ex.fullSerialNumber,
                      serialPrefix: ex.serialPrefix,
                      serialNumeric: ex.serialNumeric,
                      serialSuffix: ex.serialSuffix,
                      conditionGrade: ex.conditionGrade,
                      machineEstimatedGrade: ex.machineEstimatedGrade,
                      fancySerialType: ex.fancySerialType,
                      isReplacementNote: ex.isReplacementNote,
                      notes: ex.notes || l.notes,
                      collectorMarketValue: ex.collectorMarketValue || ex.valuation?.collectorMarketValue,
                      numistaPmgValue: ex.numistaPmgValue || ex.numistaValue,
                      extractedData: ex,
                    };
                  });
                  fetch('/api/banknotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(toUpload),
                  }).catch(() => {});
                }
              }
            }
          } catch {}

          setBanknotesList(mapped);
        } else {
          // If local IDB is empty, still attempt to hydrate from Cloud PostgreSQL
          try {
            const cloudRes = await fetch('/api/banknotes').catch(() => null);
            if (cloudRes && cloudRes.ok) {
              const cloudData = await cloudRes.json();
              if (cloudData?.banknotes && Array.isArray(cloudData.banknotes) && cloudData.banknotes.length > 0) {
                const cloudMapped = cloudData.banknotes.map((cb: any) => {
                  const countryName = cb.countryOfOrigin || 'Unknown';
                  return {
                    id: cb.id,
                    country: countryName,
                    countryFlag: getCountryFlag(countryName),
                    denomination: cb.denomination && cb.denomination !== 'Unknown' ? cb.denomination : '—',
                    year: cb.issueYear || cb.seriesDate || '—',
                    pickNumber: cb.pickNumber || 'P-Pending',
                    condition: cb.conditionGrade || 'UNC',
                    qty: 1,
                    value: cb.collectorMarketValue || 'Valuation Pending',
                    pmgValue: cb.numistaPmgValue ? cb.numistaPmgValue.split('/')?.[0]?.trim() : undefined,
                    numistaValue: cb.numistaPmgValue ? cb.numistaPmgValue.split('/')?.[1]?.trim() : undefined,
                    ebayLastSold: cb.extractionData?.ebayLastSold,
                    ebaySoldUrl: cb.extractionData?.ebaySoldUrl,
                    isSpecial: Boolean(cb.fancySerialType && cb.fancySerialType !== 'None') || Boolean(cb.isReplacementNote),
                    isVerified: true,
                    hasMissingInfo: !cb.pickNumber || !cb.issueYear,
                    frontImage: cb.frontImageUrl || cb.displayImageUrl || '',
                    backImage: cb.backImageUrl || '',
                    notes: cb.notes || 'Cloud synchronized specimen',
                    serialNumber: cb.fullSerialNumber || 'N/A',
                  };
                });
                setBanknotesList(cloudMapped);
              } else {
                setBanknotesList([]);
              }
            } else {
              setBanknotesList([]);
            }
          } catch {
            setBanknotesList([]);
          }
        }
      } catch (err) {
        console.warn('Error loading local banknotes for dashboard:', err);
      }
    }

    loadLocalNotes();
    const interval = setInterval(loadLocalNotes, 3000);

    const handleSpecimenUpdated = () => {
      loadLocalNotes();
    };
    window.addEventListener('banknote-specimen-updated', handleSpecimenUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState('banknotes');
  const currentComingSoon = COMING_SOON_DATA[activeCategory];
  const [countryFilter, setCountryFilter] = useState('All');
  const [denomFilter, setDenomFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [pickFilter, setPickFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [inspectSpecimen, setInspectSpecimen] = useState<BanknoteRow | null>(null);



  // Dynamic Metrics derived directly from actual banknotes
  const metrics = useMemo(() => {
    const totalNotes = banknotesList.reduce((acc, n) => acc + (Number(n.qty) || 1), 0);
    const countrySet = new Set(banknotesList.map((n) => n.country?.trim()).filter(Boolean));
    const differentNotesSet = new Set(
      banknotesList.map((n) => `${n.country?.trim()}_${n.denomination?.trim()}_${n.year?.trim()}_${n.pickNumber?.trim()}`).filter(Boolean)
    );
    const differentNotes = differentNotesSet.size;
    const duplicates = Math.max(0, totalNotes - differentNotes);

    const totalValueNum = banknotesList.reduce((acc, n) => {
      const raw = (n.value || '').replace(/[^0-9.]/g, '');
      const parsed = parseFloat(raw);
      const qty = Number(n.qty) || 1;
      return acc + (isNaN(parsed) ? 0 : parsed * qty);
    }, 0);

    const formattedValue = totalValueNum === 0
      ? '$0.00'
      : totalValueNum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return {
      totalNotes,
      countries: countrySet.size,
      differentNotes,
      duplicates,
      totalValueStr: formattedValue,
    };
  }, [banknotesList]);

  // Dynamic filter options derived from current inventory
  const availableCountries = useMemo(() => {
    return Array.from(new Set(banknotesList.map((n) => n.country?.trim()).filter(Boolean))).sort() as string[];
  }, [banknotesList]);

  const availableDenominations = useMemo(() => {
    return Array.from(new Set(banknotesList.map((n) => n.denomination?.trim()).filter((d) => d && d !== '—'))).sort() as string[];
  }, [banknotesList]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(banknotesList.map((n) => n.year?.trim()).filter((y) => y && y !== '—'))).sort() as string[];
  }, [banknotesList]);

  const availablePickNumbers = useMemo(() => {
    return Array.from(new Set(banknotesList.map((n) => n.pickNumber?.trim()).filter((p) => p && p !== '—' && p !== 'P-Pending'))).sort() as string[];
  }, [banknotesList]);

  // Synchronize countryFilter with ?country=... query parameter from URL
  useEffect(() => {
    if (!urlCountry) return;
    const match = availableCountries.find(
      (c) => c.toLowerCase() === urlCountry.toLowerCase()
    );
    if (match) {
      setCountryFilter(match);
    } else {
      setCountryFilter(urlCountry);
    }
  }, [urlCountry, availableCountries]);

  // Filtered rows
  const filteredNotes = useMemo(() => {
    return banknotesList.filter((note) => {
      const matchCountry = countryFilter === 'All' || note.country === countryFilter;
      const matchDenom = denomFilter === 'All' || note.denomination.includes(denomFilter);
      const matchYear = yearFilter === 'All' || note.year === yearFilter;
      const matchPick = pickFilter === 'All' || note.pickNumber === pickFilter;
      const matchCondition = conditionFilter === 'All' || note.condition === conditionFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        note.country.toLowerCase().includes(q) ||
        note.denomination.toLowerCase().includes(q) ||
        note.year.toLowerCase().includes(q) ||
        note.pickNumber.toLowerCase().includes(q) ||
        (note.notes && note.notes.toLowerCase().includes(q));

      return matchCountry && matchDenom && matchYear && matchPick && matchCondition && matchQuery;
    });
  }, [banknotesList, countryFilter, denomFilter, yearFilter, pickFilter, conditionFilter, searchQuery]);

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    toast.success(`Exporting inventory as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* TOP CATEGORY SWITCHER TABS (Banknotes, Sports Cards, Comics, etc.)        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                ? 'bg-[#0a1931] text-white dark:bg-[#00246b] dark:text-blue-50 shadow-md shadow-slate-900/15'
                : 'bg-white dark:bg-[#0b132b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-2xs hover:border-slate-400'
                }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <span>{cat.label}</span>
              {cat.isComingSoon && (
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isActive
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30'
                    }`}
                >
                  {/* Coming Soon */}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER: BANKNOTES ACTIVE OR COMING SOON MODULE PREVIEW            */}
      {/* ========================================================================= */}
      {activeCategory === 'banknotes' ? (
        <div className="bg-white dark:bg-[#0a1329] rounded-2xl border border-slate-300/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">

          {/* Section Title Header */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#002b80] dark:text-blue-400 shadow-2xs">
              <Banknote className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Banknotes
            </h2>
          </div>

          {/* ========================================================================= */}
          {/* 5 SUMMARY STAT CARDS GRID (Uniform Deep Navy Color & Bigger Icons)         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">

            {/* Card 1: Total Notes */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Banknote className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Total Notes
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.totalNotes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card 2: Countries */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Globe className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Countries
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.countries.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card 3: Different Notes */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Layers className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Different Notes
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.differentNotes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card 4: Duplicates */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Copy className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Duplicates
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.duplicates.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card 5: Estimated Value */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors col-span-2 sm:col-span-1">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <CircleDollarSign className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Estimated Value
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {metrics.totalValueStr}
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* FILTER DROPDOWNS & SEARCH ROW (Distinct Light Theme Borders)              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">

            {/* Country */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All {availableCountries.length > 0 ? `(${availableCountries.length})` : ''}</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Denomination */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Denomination
              </label>
              <div className="relative">
                <select
                  value={denomFilter}
                  onChange={(e) => setDenomFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All {availableDenominations.length > 0 ? `(${availableDenominations.length})` : ''}</option>
                  {availableDenominations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Year
              </label>
              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All {availableYears.length > 0 ? `(${availableYears.length})` : ''}</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Pick # */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pick #
              </label>
              <div className="relative">
                <select
                  value={pickFilter}
                  onChange={(e) => setPickFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All {availablePickNumbers.length > 0 ? `(${availablePickNumbers.length})` : ''}</option>
                  {availablePickNumbers.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <div className="relative">
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="UNC">UNC</option>
                  <option value="AU">AU</option>
                  <option value="XF">XF</option>
                  <option value="VF">VF</option>
                  <option value="F">F</option>
                  <option value="VG">VG</option>
                  <option value="Good">Good</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search Banknotes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Search Banknotes
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by country, denomination, year, pick #..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#003399] shadow-2xs hover:border-slate-400 transition-colors"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* ACTION BUTTONS ROW (+ Add Note, Clear Collection, Export)                  */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">

            {/* Left Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">

              {/* + Add Note (Solid Dark Blue) */}
              <Link
                href="/capture"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#003399] hover:bg-[#002b80] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Note</span>
              </Link>
            </div>

            {/* Right Action: Export / Print Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs hover:border-slate-400"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Export / Print</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export as CSV / Excel
                  </button>
                  <button
                    onClick={() => { setShowExportMenu(false); window.print(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800"
                  >
                    Print Inventory Catalog
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* BANKNOTES DATA TABLE                                                      */}
          {/* ========================================================================= */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#0a1329]">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <th className="py-3 px-4 text-center w-48">Photo</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Denomination</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Pick #</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4 text-center">Special</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-500 dark:text-slate-400">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#002b80] dark:text-blue-400 mb-3.5 border border-blue-100 dark:border-blue-900/60 shadow-xs">
                          <Banknote className="h-7 w-7 stroke-[1.8]" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                          {banknotesList.length === 0 ? 'No banknotes in collection yet' : 'No banknotes match your filters'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed text-center">
                          {banknotesList.length === 0
                            ? 'Your collection is fresh and empty. Scan or upload both sides of a banknote to let the AI extract details, estimate grades, and catalog it.'
                            : 'Try adjusting your filters or search query to find matching banknotes in your collection.'}
                        </p>
                        {banknotesList.length === 0 ? (
                          <Link
                            href="/capture"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#003399] hover:bg-[#002b80] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Capture First Banknote</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setCountryFilter('All');
                              setDenomFilter('All');
                              setYearFilter('All');
                              setPickFilter('All');
                              setConditionFilter('All');
                              setSearchQuery('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Reset Filters</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotes.map((note) => (
                    <tr
                    key={note.id}
                    onClick={() => setInspectSpecimen(note)}
                    className="hover:bg-[#f1f5f9]/80 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                  >
                    {/* Photo Column: Side-by-Side Front & Back Mini Images */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-10 w-16 rounded overflow-hidden bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          <img
                            src={note.frontImage}
                            alt={`${note.country} Front`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="h-10 w-16 rounded overflow-hidden bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          <img
                            src={note.backImage}
                            alt={`${note.country} Back`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Country Column (Flag + Name) */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none" role="img" aria-label={note.country}>
                          {note.countryFlag}
                        </span>
                        <span>{note.country}</span>
                      </div>
                    </td>

                    {/* Denomination Column */}
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {note.denomination}
                    </td>

                    {/* Year Column */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {note.year === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.year
                      )}
                    </td>

                    {/* Pick # Column */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {note.pickNumber === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.pickNumber
                      )}
                    </td>

                    {/* Condition Column */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {note.condition}
                      </span>
                    </td>

                    {/* Qty Column */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {note.qty}
                    </td>

                    {/* Value Column */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {note.value === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.value
                      )}
                    </td>

                    {/* Special Column (Star, Green Check, Red Exclamation) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {note.isSpecial && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        )}
                        {note.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {note.hasMissingInfo && (
                          <AlertCircle className="h-4 w-4 text-rose-500 fill-rose-50 dark:fill-rose-950/40" />
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* PAGINATION & FOOTER                                                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">

            {/* Total info */}
            <div>
              Showing {filteredNotes.length > 0 ? 1 : 0} to {filteredNotes.length} of {metrics.totalNotes} notes
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={true}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={true}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button className="h-7 w-7 rounded-lg bg-[#003399] text-white font-bold flex items-center justify-center shadow-xs">
                1
              </button>

              <button
                disabled={true}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={true}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Per Page Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                defaultValue="25"
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-800 dark:text-slate-200 font-medium outline-none shadow-2xs"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

          </div>

        </div>
      ) : (
        currentComingSoon && (
          <div className="bg-white dark:bg-[#0a1329] rounded-2xl border border-slate-300/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#002b80] dark:text-blue-400 shadow-sm">
                  <currentComingSoon.icon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {currentComingSoon.title}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {currentComingSoon.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setActiveCategory('banknotes')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Banknotes</span>
                </button>
                <button
                  onClick={() => toast.success(`You're subscribed! We'll notify you when ${currentComingSoon.title} launches.`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#002b80] hover:bg-blue-900 text-white shadow-sm transition-all active:scale-95"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Notify Me</span>
                </button>
              </div>
            </div>

            {/* Hero description & timeline */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/60 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Vault Module In Active Development</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentComingSoon.description}
                </p>
              </div>
              <div className="shrink-0 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Launch</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{currentComingSoon.targetRelease}</span>
              </div>
            </div>

            {/* 3 Key Feature Previews */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Upcoming Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentComingSoon.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1a36] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="text-2xl">{feat.icon}</div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Specifications / Matrix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Engine Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentComingSoon.sampleStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">{stat.label}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* SHARED CONDENSED SPECIMEN MODAL                                            */}
      {/* ========================================================================= */}
      <CondensedSpecimenModal
        banknote={inspectSpecimen}
        isOpen={inspectSpecimen !== null}
        onClose={() => setInspectSpecimen(null)}
        onSpecimenUpdated={(updated) => {
          setBanknotesList(prev => prev.map(n => n.id === updated.id ? {
            ...n,
            value: updated.collectorMarketValue || n.value,
            frontImage: updated.frontImageUrl || n.frontImage,
            backImage: updated.backImageUrl || n.backImage,
          } : n));
        }}
        onSpecimenDeleted={(id) => {
          setBanknotesList(prev => prev.filter(n => n.id !== id));
          setInspectSpecimen(null);
        }}
      />

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
