'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Globe,
  Layers,
  Copy,
  CircleDollarSign,
  Plus,
  Camera,
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
  Box
} from 'lucide-react';
import { toast } from 'sonner';

// Collection categories tabs
const CATEGORIES = [
  { id: 'banknotes', label: 'Banknotes', icon: Banknote },
  { id: 'cards', label: 'Sports Cards', icon: CreditCard },
  { id: 'comics', label: 'Comics', icon: MessageSquare },
  { id: 'pokemon', label: 'Pokémon', icon: CircleDot },
  { id: 'other', label: 'Other', icon: Box },
];

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
}

const SAMPLE_BANKNOTES: BanknoteRow[] = [
  {
    id: 'BN-BR-001',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    denomination: '500 Cruzeiros',
    year: '1981',
    pickNumber: 'P-198b',
    condition: 'UNC',
    qty: 12,
    value: '$240',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    notes: 'Deodoro da Fonseca portrait / Central Bank of Brazil engraving.',
    serialNumber: 'A 0482019482 C'
  },
  {
    id: 'BN-AR-002',
    country: 'Argentina',
    countryFlag: '🇦🇷',
    denomination: '100 Australes',
    year: '1985',
    pickNumber: 'P-331a',
    condition: 'UNC',
    qty: 24,
    value: '$168',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    notes: 'Nicolás Avellaneda portrait. Liberty holding torch on reverse.',
    serialNumber: '14.829.301 A'
  },
  {
    id: 'BN-BO-003',
    country: 'Bolivia',
    countryFlag: '🇧🇴',
    denomination: '10 Bolivianos',
    year: '1981',
    pickNumber: 'P-164a',
    condition: 'UNC',
    qty: 30,
    value: '$90',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    notes: 'Painter Cecilio Guzmán de Rojas / Mount Illimani landscape.',
    serialNumber: '87654321'
  },
  {
    id: 'BN-MX-004',
    country: 'Mexico',
    countryFlag: '🇲🇽',
    denomination: '1000 Pesos',
    year: '1993',
    pickNumber: 'P-94d',
    condition: 'UNC',
    qty: 18,
    value: '$180',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    notes: 'Sor Juana Inés de la Cruz portrait. Bank of Mexico commemorative issue.',
    serialNumber: 'B4829104'
  },
  {
    id: 'BN-IN-005',
    country: 'India',
    countryFlag: '🇮🇳',
    denomination: '50 Rupees',
    year: '—',
    pickNumber: '—',
    condition: 'UNC',
    qty: 8,
    value: '—',
    isSpecial: false,
    isVerified: false,
    hasMissingInfo: true,
    frontImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    notes: 'Missing issue year and Krause-Mishler Pick catalog number. Pending AI re-scan.',
    serialNumber: '72D 819203'
  },
  {
    id: 'BN-CA-006',
    country: 'Canada',
    countryFlag: '🇨🇦',
    denomination: '1,000 Dollars',
    year: '1954',
    pickNumber: 'P-45a',
    condition: 'UNC',
    qty: 2,
    value: '$2,750',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    notes: 'Queen Elizabeth II portrait. Devil face variety verified clean.',
    serialNumber: 'A1234567'
  },
  {
    id: 'BN-US-007',
    country: 'United States',
    countryFlag: '🇺🇸',
    denomination: '$100',
    year: '2013',
    pickNumber: 'P-540',
    condition: 'AU',
    qty: 4,
    value: '$145',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    notes: 'Benjamin Franklin portrait. Color-shifting bell in inkwell.',
    serialNumber: 'L12345678A'
  },
];

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState('banknotes');
  const [countryFilter, setCountryFilter] = useState('All');
  const [denomFilter, setDenomFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [pickFilter, setPickFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [inspectSpecimen, setInspectSpecimen] = useState<BanknoteRow | null>(null);

  // Filtered rows
  const filteredNotes = useMemo(() => {
    return SAMPLE_BANKNOTES.filter((note) => {
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
  }, [countryFilter, denomFilter, yearFilter, pickFilter, conditionFilter, searchQuery]);

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
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0a1931] text-white dark:bg-[#00246b] dark:text-blue-50 shadow-md shadow-slate-900/15'
                  : 'bg-white dark:bg-[#0b132b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-2xs hover:border-slate-400'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MAIN BANKNOTES CARD CONTAINER (High Contrast against App Shell BG)        */}
      {/* ========================================================================= */}
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
                18,700
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
                142
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
                3,850
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
                14,850
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
                $1,248,750
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
                <option value="All">All</option>
                <option value="Brazil">Brazil</option>
                <option value="Argentina">Argentina</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Mexico">Mexico</option>
                <option value="India">India</option>
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
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
                <option value="All">All</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
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
                <option value="All">All</option>
                <option value="1954">1954</option>
                <option value="1981">1981</option>
                <option value="1985">1985</option>
                <option value="1993">1993</option>
                <option value="2013">2013</option>
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
                <option value="All">All</option>
                <option value="P-45a">P-45a</option>
                <option value="P-198b">P-198b</option>
                <option value="P-331a">P-331a</option>
                <option value="P-164a">P-164a</option>
                <option value="P-94d">P-94d</option>
                <option value="P-540">P-540</option>
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
        {/* ACTION BUTTONS ROW (+ Add Note, Photograph Note, AI Identify, Export)      */}
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

            {/* Photograph Note (White/Bordered) */}
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs hover:border-slate-400"
            >
              <Camera className="h-3.5 w-3.5 text-slate-500" />
              <span>Photograph Note</span>
            </Link>

            {/* AI Identify (White/Bordered) */}
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs hover:border-slate-400"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#003399] dark:text-blue-400" />
              <span>AI Identify</span>
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
              {filteredNotes.map((note) => (
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
              ))}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* PAGINATION & FOOTER                                                       */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">
          
          {/* Total info */}
          <div>
            Showing 1 to {filteredNotes.length} of 18,700 notes
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <button className="h-7 w-7 rounded-lg bg-[#003399] text-white font-bold flex items-center justify-center shadow-xs">
              1
            </button>
            <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
              2
            </button>
            <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
              3
            </button>
            <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
              4
            </button>
            <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
              5
            </button>

            <button
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
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

      {/* ========================================================================= */}
      {/* HIGH-RES SPECIMEN INSPECTOR MODAL                                         */}
      {/* ========================================================================= */}
      {inspectSpecimen && (
        <div
          onClick={() => setInspectSpecimen(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-[#0b132b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">{inspectSpecimen.countryFlag}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectSpecimen.country} {inspectSpecimen.denomination} ({inspectSpecimen.year})
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Pick #{inspectSpecimen.pickNumber} | Serial: {inspectSpecimen.serialNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectSpecimen(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 bg-slate-100 dark:bg-slate-900">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  Front Specimen Scan
                </span>
                <img
                  src={inspectSpecimen.frontImage}
                  alt="Front Scan"
                  className="w-full h-48 object-cover"
                />
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 bg-slate-100 dark:bg-slate-900">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  Back Specimen Scan
                </span>
                <img
                  src={inspectSpecimen.backImage}
                  alt="Back Scan"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#111c3d] p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Condition</span>
                <span className="font-bold text-emerald-600">{inspectSpecimen.condition}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Quantity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectSpecimen.qty} notes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Value</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{inspectSpecimen.value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Special Tag</span>
                <span className="font-bold text-amber-500">{inspectSpecimen.isSpecial ? '⭐ Valuable Item' : 'Standard Specimen'}</span>
              </div>
            </div>

            {inspectSpecimen.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111c3d] text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Specimen Notes:</span>
                <p className="text-slate-600 dark:text-slate-300">{inspectSpecimen.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
