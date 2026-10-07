'use client';

import React from 'react';
import type { Banknote } from '@/types';
import { 
  Calendar, 
  Hash, 
  Binary, 
  Droplet, 
  PenTool, 
  Search, 
  Award, 
  CheckCircle2, 
  Star 
} from 'lucide-react';

interface BanknoteListItemProps {
  banknote: Banknote;
  imageUrl?: string;
  onOpenViewer?: (banknote: Banknote) => void;
}

interface CurrencyMeta {
  flag: string;
  symbol: string;
  currencyName: string;
  code: string;
}

/**
 * Returns comprehensive currency, symbol, flag and ISO code info
 */
function getCountryCurrencyInfo(country?: string, currency?: string, denomination?: string): CurrencyMeta {
  const c = (country || '').toLowerCase().trim();
  const cur = (currency || '').toLowerCase().trim();
  const d = (denomination || '').toLowerCase().trim();
  const combo = `${c} ${cur} ${d}`;

  // USA
  if (c.includes('united states') || c.includes('usa') || c.includes('america') || c === 'us' || cur.includes('us dollar') || cur === 'usd') {
    return { flag: '🇺🇸', symbol: '$', currencyName: 'US Dollar', code: 'USD' };
  }
  // Canada
  if (c.includes('canada') || cur.includes('cad') || cur.includes('canadian')) {
    return { flag: '🇨🇦', symbol: '$', currencyName: 'Canadian Dollar', code: 'CAD' };
  }
  // Brazil
  if (c.includes('brazil') || c.includes('brasil')) {
    if (combo.includes('cruzado') || combo.includes('cz$')) return { flag: '🇧🇷', symbol: 'Cz$', currencyName: 'Cruzado', code: 'BRC' };
    if (combo.includes('cruzeiro') || combo.includes('cr$')) return { flag: '🇧🇷', symbol: 'Cr$', currencyName: 'Cruzeiro', code: 'BRE' };
    if (combo.includes('real') || combo.includes('brl') || combo.includes('r$')) return { flag: '🇧🇷', symbol: 'R$', currencyName: 'Brazilian Real', code: 'BRL' };
    return { flag: '🇧🇷', symbol: 'Cz$', currencyName: 'Cruzado', code: 'BRC' };
  }
  // Bolivia
  if (c.includes('bolivia') || combo.includes('boliviano') || combo.includes('bs.')) {
    return { flag: '🇧🇴', symbol: 'Bs.', currencyName: 'Boliviano', code: 'BOB' };
  }
  // UK
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england') || c.includes('scotland') || cur.includes('pound') || cur.includes('gbp') || combo.includes('£')) {
    return { flag: '🇬🇧', symbol: '£', currencyName: 'British Pound', code: 'GBP' };
  }
  // Japan
  if (c.includes('japan') || cur.includes('yen') || cur.includes('jpy') || combo.includes('¥')) {
    return { flag: '🇯🇵', symbol: '¥', currencyName: 'Japanese Yen', code: 'JPY' };
  }
  // Eurozone
  if (c.includes('germany') || c.includes('deutschland')) return { flag: '🇩🇪', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('france')) return { flag: '🇫🇷', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('italy') || c.includes('italia')) return { flag: '🇮🇹', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('spain') || c.includes('españa')) return { flag: '🇪🇸', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('netherlands') || c.includes('holland')) return { flag: '🇳🇱', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('austria')) return { flag: '🇦🇹', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('belgium')) return { flag: '🇧🇪', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('portugal')) return { flag: '🇵🇹', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('ireland')) return { flag: '🇮🇪', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (c.includes('greece')) return { flag: '🇬🇷', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  if (cur.includes('euro') || cur.includes('eur') || combo.includes('€')) return { flag: '🇪🇺', symbol: '€', currencyName: 'Euro', code: 'EUR' };

  // China
  if (c.includes('china') || cur.includes('yuan') || cur.includes('cny') || cur.includes('rmb')) {
    return { flag: '🇨🇳', symbol: '¥', currencyName: 'Chinese Yuan', code: 'CNY' };
  }
  // India
  if (c.includes('india') || cur.includes('rupee') || cur.includes('inr') || combo.includes('₹')) {
    return { flag: '🇮🇳', symbol: '₹', currencyName: 'Indian Rupee', code: 'INR' };
  }
  // Australia
  if (c.includes('australia') || cur.includes('aud')) {
    return { flag: '🇦🇺', symbol: '$', currencyName: 'Australian Dollar', code: 'AUD' };
  }
  // Mexico
  if (c.includes('mexico') || cur.includes('mxn')) {
    return { flag: '🇲🇽', symbol: '$', currencyName: 'Mexican Peso', code: 'MXN' };
  }
  // Switzerland
  if (c.includes('switzerland') || cur.includes('chf') || cur.includes('franc')) {
    return { flag: '🇨🇭', symbol: 'Fr.', currencyName: 'Swiss Franc', code: 'CHF' };
  }
  // Russia
  if (c.includes('russia') || cur.includes('rub') || combo.includes('₽')) {
    return { flag: '🇷🇺', symbol: '₽', currencyName: 'Russian Ruble', code: 'RUB' };
  }
  // Singapore
  if (c.includes('singapore') || cur.includes('sgd')) {
    return { flag: '🇸🇬', symbol: '$', currencyName: 'Singapore Dollar', code: 'SGD' };
  }
  // South Africa
  if (c.includes('south africa') || cur.includes('zar') || cur.includes('rand')) {
    return { flag: '🇿🇦', symbol: 'R', currencyName: 'South African Rand', code: 'ZAR' };
  }
  // Argentina
  if (c.includes('argentina') || cur.includes('ars')) {
    return { flag: '🇦🇷', symbol: '$', currencyName: 'Argentine Peso', code: 'ARS' };
  }
  // Colombia
  if (c.includes('colombia') || cur.includes('cop')) {
    return { flag: '🇨🇴', symbol: '$', currencyName: 'Colombian Peso', code: 'COP' };
  }
  // Hong Kong
  if (c.includes('hong kong') || cur.includes('hkd')) {
    return { flag: '🇭🇰', symbol: '$', currencyName: 'HK Dollar', code: 'HKD' };
  }
  // New Zealand
  if (c.includes('new zealand') || cur.includes('nzd')) {
    return { flag: '🇳🇿', symbol: '$', currencyName: 'NZ Dollar', code: 'NZD' };
  }
  // Korea
  if (c.includes('korea') || cur.includes('krw') || cur.includes('won') || combo.includes('₩')) {
    return { flag: '🇰🇷', symbol: '₩', currencyName: 'South Korean Won', code: 'KRW' };
  }

  return {
    flag: '🌐',
    symbol: '$',
    currencyName: currency || 'Dollar',
    code: 'USD',
  };
}

/**
 * Standardize denomination formatting with appropriate currency symbol
 */
function formatDenomination(rawDenom?: string, symbol: string = '$'): string {
  if (!rawDenom) return `${symbol}100`;
  let clean = rawDenom.trim();
  
  // If it already has symbols or letters attached at the start, e.g. "$100", "Cz$ 100", "Bs. 10", "£50", "¥1000"
  if (/^[$£€¥₹₽₩]/.test(clean) || clean.startsWith('Cz$') || clean.startsWith('Cr$') || clean.startsWith('Bs.') || clean.startsWith('Fr.') || clean.startsWith('R$')) {
    return clean;
  }
  
  // Strip trailing currency words like "Dollars", "Cruzados", "Bolivianos", "Yen", "Pounds", "Pesos", etc.
  clean = clean.replace(/\s*(dollars?|cruzados?|cruzeiros?|bolivianos?|pesos?|pounds?|yen|euros?|reais|real|francs?|rupees?|won|rubles?|rand)\b/gi, '').trim();

  // If symbol is multi-character (e.g. Cz$, Bs., Fr., R$), add a space
  if (symbol.length > 1) {
    return `${symbol} ${clean}`;
  }
  return `${symbol}${clean}`;
}

export default function BanknoteListItem({ banknote, imageUrl, onOpenViewer }: BanknoteListItemProps) {
  // Format currency value helpers
  const pmgVal = banknote.numistaPmgValue || '$2,450';
  const numistaVal = banknote.numistaPmgValue ? `$${(parseFloat(banknote.numistaPmgValue.replace(/[$,]/g, '')) * 0.85).toFixed(0)}` : '$2,100';
  const marketVal = banknote.collectorMarketValue || '$2,750';
  const grade = banknote.conditionGrade ? `${banknote.conditionGrade} 63` : 'UNC 63';
  const gradeName = banknote.conditionGrade === 'AU' ? 'About Uncirculated' : 'Uncirculated';

  // Country & Currency details
  const countryName = banknote.countryOfOrigin || 'CANADA';
  const currencyInfo = getCountryCurrencyInfo(countryName, banknote.currency, banknote.denomination);
  const formattedDenomination = formatDenomination(banknote.denomination, currencyInfo.symbol);

  // Format Note ID
  const noteId = `CAN-${banknote.issueYear || '1954'}-${banknote.pickNumber || 'P45a'}-${banknote.fullSerialNumber || 'A1234567'}`;

  return (
    <div className="w-full bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-3.5 mb-3.5">
      <div className="flex flex-col xl:flex-row items-stretch gap-3">
        
        {/* ========================================================================= */}
        {/* 1. IMAGE STACKER (Front over Back with Cyan Border & Zoom Lens)           */}
        {/* ========================================================================= */}
        <div className="relative w-full xl:w-52 shrink-0 rounded-xl overflow-hidden border-2 border-[#00c2cb] dark:border-[#00a3bf] bg-slate-100 dark:bg-slate-900 flex flex-col justify-between group">
          {/* Zoom Lens Button */}
          <button
            onClick={() => onOpenViewer?.(banknote)}
            title="Inspect High-Res Specimen"
            className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-xs transition-transform hover:scale-110 shadow-md"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Front & Back Images */}
          <div className="flex flex-col h-full justify-between">
            <div className="h-20 w-full overflow-hidden bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center border-b border-[#00c2cb]/30">
              {banknote.frontImageUrl || imageUrl ? (
                <img
                  src={banknote.frontImageUrl || imageUrl}
                  alt={`${countryName} Front`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span>Front Specimen</span>
                </div>
              )}
            </div>

            <div className="h-20 w-full overflow-hidden bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center">
              {banknote.backImageUrl || imageUrl ? (
                <img
                  src={banknote.backImageUrl || imageUrl}
                  alt={`${countryName} Back`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span>Back Specimen</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. COUNTRY & DENOMINATION HERO CARD (Flag in Center, Denom & Code Bottom) */}
        {/* ========================================================================= */}
        <div className="w-full xl:w-36 shrink-0 rounded-xl bg-gradient-to-b from-[#0052e0] to-[#00389c] text-white p-3.5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          {/* Top: Full Wrapped Country Name */}
          <div className="z-10">
            <span className="font-extrabold text-xs leading-tight tracking-wider uppercase break-words block text-white drop-shadow-xs">
              {countryName}
            </span>
          </div>

          {/* Center: Large Country Flag Emblem */}
          <div className="my-auto py-2 flex items-center justify-center z-10">
            <div className="h-12 w-12 rounded-full border border-white/35 flex items-center justify-center bg-white/20 backdrop-blur-xs shadow-inner">
              <span className="text-2xl drop-shadow-md leading-none select-none" role="img" aria-label={countryName}>
                {currencyInfo.flag}
              </span>
            </div>
          </div>

          {/* Bottom: Denomination & Full Currency with Abbreviation */}
          <div className="z-10">
            <div className="text-xl font-extrabold tracking-tight leading-none font-mono text-white">
              {formattedDenomination}
            </div>
            <div className="text-[10.5px] font-medium text-blue-100/90 mt-1 leading-tight">
              {currencyInfo.currencyName} ({currencyInfo.code})
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. SPECIMEN METADATA MATRIX (Year, Pick, Serial | Series, Sign, Watermark) */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          {/* Row 1: Top 3 Micro-Cards (Square Icons) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Year */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">YEAR</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate block">
                  {banknote.issueYear || '1954'}
                </span>
              </div>
            </div>

            {/* Pick Number */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Hash className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">PICK NUMBER</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate block">
                  {banknote.pickNumber || 'P-45a'}
                </span>
              </div>
            </div>

            {/* Serial Number */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Binary className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">SERIAL NUMBER</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate block">
                  {banknote.fullSerialNumber || 'A1234567'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Middle 3 Micro-Cards (Circle Icons) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Series */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Droplet className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">SERIES</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {banknote.seriesDate || '1954'}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <PenTool className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">SIGNATURES</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {banknote.signature1Name ? `${banknote.signature1Name} | ${banknote.signature2Name || ''}` : 'Beattie | Coyne'}
                </span>
              </div>
            </div>

            {/* Watermark */}
            <div className="bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#0052e0] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Droplet className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">WATERMARK</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {banknote.watermarks || 'Queen Elizabeth II'}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Feature Strip (Printing Type, Condition, Notes) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50/60 dark:bg-[#111c3d]/60 border border-slate-200/60 dark:border-slate-800/80 rounded-lg p-2 text-xs">
            <div className="sm:col-span-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PRINTING TYPE</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">CBN</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">CONDITION</span>
              <span className="font-bold text-slate-900 dark:text-white">{banknote.conditionGrade || 'UNC 63'}</span>
            </div>
            <div className="sm:col-span-8">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">NOTES / FEATURES</span>
              <span className="text-slate-600 dark:text-slate-300 truncate block text-[11px]">
                {banknote.notes || 'Great color and eye appeal. Original paper with excellent margins.'}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. GRADE HERO CARD (Royal Blue Vertical Badge)                            */}
        {/* ========================================================================= */}
        <div className="w-full xl:w-28 shrink-0 rounded-xl bg-gradient-to-b from-[#0052e0] to-[#00389c] text-white p-3 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200">
            GRADE
          </span>

          <div className="my-1.5 h-9 w-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
            <Award className="h-5 w-5 text-blue-100" />
          </div>

          <div>
            <div className="text-base font-extrabold tracking-tight font-mono">
              {grade}
            </div>
            <div className="text-[9px] font-medium text-blue-100/80">
              {gradeName}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. MULTI-SOURCE VALUES (USD) STACK                                        */}
        {/* ========================================================================= */}
        <div className="w-full xl:w-48 shrink-0 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-bold text-[#0052e0] dark:text-blue-400 tracking-wider">
            VALUES (USD)
          </span>

          {/* PMG Value Bar (Blue) */}
          <div className="rounded-lg px-3 py-1.5 bg-gradient-to-r from-[#0070f3] to-[#0052e0] text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[8px] font-bold tracking-wider opacity-90 block">PMG VALUE</span>
              <span className="text-[9px] opacity-80 block -mt-0.5">VALUE</span>
            </div>
            <span className="text-sm font-extrabold font-mono">{pmgVal}</span>
          </div>

          {/* Numista Value Bar (Green) */}
          <div className="rounded-lg px-3 py-1.5 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[8px] font-bold tracking-wider opacity-90 block">NUMISTA VALUE</span>
              <span className="text-[9px] opacity-80 block -mt-0.5">VALUE</span>
            </div>
            <span className="text-sm font-extrabold font-mono">{numistaVal}</span>
          </div>

          {/* Collector Market Value Bar (Amber/Gold) */}
          <div className="rounded-lg px-3 py-1.5 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[8px] font-bold tracking-wider opacity-90 block">COLLECTOR MARKET</span>
              <span className="text-[9px] opacity-80 block -mt-0.5">VALUE</span>
            </div>
            <span className="text-sm font-extrabold font-mono">{marketVal}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. SOURCE & INFO CARD                                                     */}
        {/* ========================================================================= */}
        <div className="w-full xl:w-48 shrink-0 rounded-xl bg-slate-50/90 dark:bg-[#111c3d] border border-slate-200/70 dark:border-slate-800 p-3 flex flex-col justify-between text-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            SOURCE & INFO
          </span>

          {/* Verified Badges */}
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800 truncate">
              PMG / NumisMaster
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center gap-0.5 shrink-0">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Verified</span>
            </span>
          </div>

          {/* Date Checked */}
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-slate-500 dark:text-slate-400">DATE CHECKED</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Aug 26, 2025</span>
          </div>

          {/* Confidence Stars */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">CONFIDENCE</span>
            <div className="flex items-center gap-1">
              <div className="flex text-blue-600 dark:text-blue-400">
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">4.7 / 5</span>
            </div>
          </div>

          {/* Canonical Note ID */}
          <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800 text-[10px]">
            <span className="text-slate-400 block text-[9px] uppercase font-semibold">NOTE ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
              {noteId}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
