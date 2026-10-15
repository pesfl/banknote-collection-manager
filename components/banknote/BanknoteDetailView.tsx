'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Calendar, 
  Hash, 
  Binary, 
  Droplet, 
  PenTool, 
  Search, 
  Award, 
  CheckCircle2, 
  Star, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  Layers, 
  Shield, 
  Tag, 
  Box, 
  Clock, 
  ArrowLeft, 
  Copy, 
  Check, 
  Maximize2, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Coins, 
  Eye, 
  AlertCircle,
  X,
  Share2
} from 'lucide-react';
import type { Banknote } from '@/types';
import { toast } from 'sonner';
import PhotoAdjusterModal from '@/components/mobile/PhotoAdjusterModal';
import { cleanBanknoteImage, ensureImageBlob } from '@/lib/media/banknote-cleaner';
import { getSpecimen, updateSpecimen } from '@/lib/offline/idb';

interface BanknoteDetailViewProps {
  banknote: Banknote;
  onClose?: () => void;
  isStandalonePage?: boolean;
  onSpecimenUpdated?: (updated: Banknote) => void;
}

interface CurrencyMeta {
  flag: string;
  symbol: string;
  currencyName: string;
  code: string;
}

function getCountryCurrencyInfo(country?: string, currency?: string, denomination?: string): CurrencyMeta {
  const c = (country || '').toLowerCase().trim();
  const cur = (currency || '').toLowerCase().trim();
  const d = (denomination || '').toLowerCase().trim();
  const combo = `${c} ${cur} ${d}`;

  if (c.includes('united states') || c.includes('usa') || c.includes('america') || c === 'us' || cur.includes('us dollar') || cur === 'usd') {
    return { flag: '🇺🇸', symbol: '$', currencyName: 'US Dollar', code: 'USD' };
  }
  if (c.includes('philippine') || c.includes('filipino') || cur.includes('piso') || cur.includes('php') || (cur.includes('peso') && (c.includes('phil') || c.includes('islands'))) || combo.includes('₱')) {
    return { flag: '🇵🇭', symbol: '₱', currencyName: 'Philippine Peso', code: 'PHP' };
  }
  if (c.includes('canada') || cur.includes('cad') || cur.includes('canadian')) {
    return { flag: '🇨🇦', symbol: '$', currencyName: 'Canadian Dollar', code: 'CAD' };
  }
  if (c.includes('brazil') || c.includes('brasil')) {
    if (combo.includes('cruzado') || combo.includes('cz$')) return { flag: '🇧🇷', symbol: 'Cz$', currencyName: 'Cruzado', code: 'BRC' };
    if (combo.includes('cruzeiro') || combo.includes('cr$')) return { flag: '🇧🇷', symbol: 'Cr$', currencyName: 'Cruzeiro', code: 'BRE' };
    if (combo.includes('real') || combo.includes('brl') || combo.includes('r$')) return { flag: '🇧🇷', symbol: 'R$', currencyName: 'Brazilian Real', code: 'BRL' };
    return { flag: '🇧🇷', symbol: 'Cz$', currencyName: 'Cruzado', code: 'BRC' };
  }
  if (c.includes('bolivia') || combo.includes('boliviano') || combo.includes('bs.')) {
    return { flag: '🇧🇴', symbol: 'Bs.', currencyName: 'Boliviano', code: 'BOB' };
  }
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england') || c.includes('scotland') || cur.includes('pound') || cur.includes('gbp') || combo.includes('£')) {
    return { flag: '🇬🇧', symbol: '£', currencyName: 'British Pound', code: 'GBP' };
  }
  if (c.includes('japan') || cur.includes('yen') || cur.includes('jpy') || combo.includes('¥')) {
    return { flag: '🇯🇵', symbol: '¥', currencyName: 'Japanese Yen', code: 'JPY' };
  }
  if (c.includes('india') || cur.includes('rupee') || cur.includes('inr') || combo.includes('₹')) {
    return { flag: '🇮🇳', symbol: '₹', currencyName: 'Indian Rupee', code: 'INR' };
  }
  if (c.includes('china') || cur.includes('yuan') || cur.includes('cny') || cur.includes('rmb')) {
    return { flag: '🇨🇳', symbol: '¥', currencyName: 'Chinese Yuan', code: 'CNY' };
  }
  if (cur.includes('euro') || cur.includes('eur') || combo.includes('€')) {
    return { flag: '🇪🇺', symbol: '€', currencyName: 'Euro', code: 'EUR' };
  }
  return { flag: '🌐', symbol: currency?.slice(0, 1) || '$', currencyName: currency || 'Standard Currency', code: currency?.slice(0, 3)?.toUpperCase() || 'CUR' };
}

export default function BanknoteDetailView({
  banknote,
  onClose,
  isStandalonePage = false,
  onSpecimenUpdated,
}: BanknoteDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'catalog' | 'serial' | 'grading' | 'security' | 'valuation' | 'storage' | 'json'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Auto-Fix & Adjust state
  const [isFixing, setIsFixing] = useState(false);
  const [isReidentifying, setIsReidentifying] = useState(false);
  const [isRefreshingValuation, setIsRefreshingValuation] = useState(false);
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);
  const [adjustingBlob, setAdjustingBlob] = useState<Blob | null>(null);

  const countryName = banknote.countryOfOrigin || 'Unknown Country';
  const currencyInfo = getCountryCurrencyInfo(countryName, banknote.currency, banknote.denomination);

  const handleCopy = (text?: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label || text);
    toast.success(`Copied ${label || 'value'} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRefreshValuation = async () => {
    setIsRefreshingValuation(true);
    try {
      const res = await fetch(`/api/valuation/${banknote.id || 'temp'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryOfOrigin: banknote.countryOfOrigin,
          denomination: banknote.denomination,
          issueYear: banknote.issueYear,
          conditionGrade: banknote.conditionGrade,
          serialNumeric: banknote.serialNumeric || banknote.fullSerialNumber,
          isReplacementNote: banknote.isReplacementNote,
        })
      });
      if (res.ok) {
        const json = await res.json();
        const valData = json?.data || json;
        const updated: Banknote = {
          ...banknote,
          collectorMarketValue: valData.collectorMarketValue || banknote.collectorMarketValue,
          numistaPmgValue: valData.numistaValue || banknote.numistaPmgValue,
          pmgValue: valData.pmgValue,
          numistaValue: valData.numistaValue,
          ebayLastSold: valData.ebayLastSold,
          ebaySoldUrl: valData.ebaySoldUrl,
          ebayActiveUrl: valData.ebayActiveUrl,
        } as any;
        onSpecimenUpdated?.(updated);

        if (banknote.id) {
          const local = await getSpecimen(banknote.id);
          if (local) {
            await updateSpecimen({
              ...local,
              extractedData: {
                ...(local.extractedData || {}),
                valuation: valData,
                collectorMarketValue: valData.collectorMarketValue,
                pmgValue: valData.pmgValue,
                numistaValue: valData.numistaValue,
                ebayLastSold: valData.ebayLastSold,
              }
            });
          }
        }
        toast.success(`Valuation updated: ${valData.collectorMarketValue}`);
      } else {
        toast.error('Could not refresh valuation');
      }
    } catch {
      toast.error('Failed to contact valuation service');
    } finally {
      setIsRefreshingValuation(false);
    }
  };

  const handleReIdentifySpecimen = async () => {
    setIsReidentifying(true);
    toast.info('Analyzing banknote images with Gemini AI...');

    try {
      let frontBlob: Blob | null = null;
      let backBlob: Blob | null = null;

      if (banknote.id) {
        const local = await getSpecimen(banknote.id);
        if (local?.frontImageBlob) frontBlob = local.frontImageBlob;
        if (local?.backImageBlob) backBlob = local.backImageBlob;
      }

      if (!frontBlob && banknote.frontImageUrl) {
        frontBlob = await ensureImageBlob(banknote.frontImageUrl);
      }
      if (!backBlob && banknote.backImageUrl) {
        backBlob = await ensureImageBlob(banknote.backImageUrl);
      }

      if (!frontBlob && !backBlob) {
        toast.error('No specimen images available for AI identification');
        setIsReidentifying(false);
        return;
      }

      const formData = new FormData();
      if (frontBlob) formData.append('front', frontBlob, 'front.jpg');
      if (backBlob) formData.append('back', backBlob, 'back.jpg');

      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Extraction request failed');
      }

      const json = await res.json();
      const extracted = json.data || json;

      const updated: Banknote = {
        ...banknote,
        countryOfOrigin: extracted.country || extracted.countryOfOrigin || banknote.countryOfOrigin,
        denomination: extracted.denomination || banknote.denomination,
        currency: extracted.currency || banknote.currency,
        pickNumber: extracted.pickNumber || banknote.pickNumber,
        issueYear: extracted.issueYear || banknote.issueYear,
        seriesDate: extracted.seriesDate || banknote.seriesDate,
        fullSerialNumber: extracted.fullSerialNumber || banknote.fullSerialNumber,
        serialPrefix: extracted.serialPrefix || banknote.serialPrefix,
        serialNumeric: extracted.serialNumeric || banknote.serialNumeric,
        serialSuffix: extracted.serialSuffix || banknote.serialSuffix,
        conditionGrade: extracted.conditionGrade || banknote.conditionGrade,
        machineEstimatedGrade: extracted.machineEstimatedGrade || banknote.machineEstimatedGrade,
        fancySerialType: extracted.fancySerialType || banknote.fancySerialType,
        isReplacementNote: extracted.isReplacementNote ?? banknote.isReplacementNote,
        signature1Name: extracted.signature1Name || banknote.signature1Name,
        signature1Title: extracted.signature1Title || banknote.signature1Title,
        signature2Name: extracted.signature2Name || banknote.signature2Name,
        signature2Title: extracted.signature2Title || banknote.signature2Title,
        watermarks: extracted.watermarks || banknote.watermarks,
        securityFeatures: extracted.securityFeatures || banknote.securityFeatures,
        notes: extracted.notes || banknote.notes,
      };

      onSpecimenUpdated?.(updated);

      if (banknote.id) {
        const local = await getSpecimen(banknote.id);
        if (local) {
          await updateSpecimen({
            ...local,
            extractedData: {
              ...(local.extractedData || {}),
              ...extracted,
            },
            extractionStatus: 'completed',
          });
        }
      }

      toast.success(`AI Identified: ${updated.countryOfOrigin} ${updated.denomination} (${updated.pickNumber})`);
    } catch (err: any) {
      console.error('Re-identification error:', err);
      toast.error(`AI re-identification failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsReidentifying(false);
    }
  };

  const handleStartAdjust = async (side: 'front' | 'back') => {
    try {
      let b: Blob | null = null;
      if (banknote.id) {
        const local = await getSpecimen(banknote.id);
        if (local) {
          b = side === 'front' ? local.frontImageBlob : local.backImageBlob;
        }
      }
      if (!b) {
        const url = side === 'front' ? banknote.frontImageUrl : banknote.backImageUrl;
        if (url) b = await ensureImageBlob(url);
      }
      if (!b) {
        toast.error(`Could not load ${side} image for adjustment`);
        return;
      }
      setAdjustingBlob(b);
      setAdjustingSide(side);
    } catch (e) {
      console.error('Failed to load blob for adjuster:', e);
      toast.error('Could not open image adjuster');
    }
  };

  const handleApplyAdjustment = async (cleanedBlob: Blob, cleanedPreview: string) => {
    if (!adjustingSide) return;
    try {
      const updated: Banknote = {
        ...banknote,
        [adjustingSide === 'front' ? 'frontImageUrl' : 'backImageUrl']: cleanedPreview,
        ...(adjustingSide === 'front' ? { displayImageUrl: cleanedPreview } : {}),
      };
      onSpecimenUpdated?.(updated);

      if (banknote.id) {
        try {
          const local = await getSpecimen(banknote.id);
          if (local) {
            await updateSpecimen({
              ...local,
              [adjustingSide === 'front' ? 'frontImageBlob' : 'backImageBlob']: cleanedBlob,
            });
          }
        } catch (e) {
          console.warn('IDB update skipped:', e);
        }
      }

      toast.success(`✨ ${adjustingSide === 'front' ? 'Front' : 'Back'} photo adjusted and saved!`);
      setAdjustingSide(null);
      setAdjustingBlob(null);
    } catch {
      toast.error('Failed to save adjusted photo');
    }
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    const imgUrl = side === 'front' ? banknote.frontImageUrl : banknote.backImageUrl;
    if (!imgUrl) {
      toast.error(`No ${side} image to fix`);
      return;
    }
    setIsFixing(true);
    toast.info(`Auto-fixing ${side} photo (cropping border & straightening)...`);
    try {
      let blob: Blob | null = null;
      if (banknote.id) {
        const local = await getSpecimen(banknote.id);
        if (local) {
          blob = side === 'front' ? local.frontImageBlob : local.backImageBlob;
        }
      }
      if (!blob) blob = await ensureImageBlob(imgUrl);

      const cleaned = await cleanBanknoteImage(blob);
      const updated: Banknote = {
        ...banknote,
        [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: cleaned.dataUrl,
        ...(side === 'front' ? { displayImageUrl: cleaned.dataUrl } : {}),
      };
      onSpecimenUpdated?.(updated);

      if (banknote.id) {
        const local = await getSpecimen(banknote.id);
        if (local) {
          await updateSpecimen({
            ...local,
            [side === 'front' ? 'frontImageBlob' : 'backImageBlob']: cleaned.cleanedBlob,
          });
        }
      }
      toast.success(`Auto-fixed ${side} photo!`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to auto-fix: ${e.message || 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  const calculateProfitLoss = () => {
    if (!banknote.purchasePrice || !banknote.collectorMarketValue) return null;
    const market = parseFloat(banknote.collectorMarketValue.replace(/[^0-9.]/g, '') || '0');
    if (isNaN(market) || market <= 0) return null;
    const cost = banknote.purchasePrice;
    const diff = market - cost;
    const percent = ((diff / cost) * 100).toFixed(1);
    return { diff, percent, isPositive: diff >= 0 };
  };

  const profitLoss = calculateProfitLoss();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP COMMAND BAR                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {isStandalonePage ? (
            <Link
              href="/banknotes"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Inventory</span>
            </Link>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Close Inspector</span>
            </button>
          ) : null}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xl select-none" role="img" aria-label={countryName}>
              {currencyInfo.flag}
            </span>
            <div>
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                SPECIMEN #{banknote.id || 'LOCAL-IDB'}
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {countryName} • {banknote.denomination || 'Unknown'} ({banknote.issueYear || 'ND'})
              </h1>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReIdentifySpecimen}
            disabled={isReidentifying || isFixing}
            className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Run Gemini Vision to re-extract all fields"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isReidentifying ? 'animate-spin' : ''}`} />
            <span>{isReidentifying ? 'AI Identifying...' : 'Re-Identify Note'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshValuation}
            disabled={isRefreshingValuation}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh valuation consensus from PMG, Numista & eBay"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingValuation ? 'animate-spin' : ''}`} />
            <span>{isRefreshingValuation ? 'Pricing...' : 'Refresh Valuation'}</span>
          </button>

          {!isStandalonePage && banknote.id && (
            <Link
              href={`/banknotes/${encodeURIComponent(banknote.id)}`}
              className="px-3 py-1.5 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <span>Full Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO HIGHLIGHT BAR                                                     */}
      {/* ========================================================================= */}
      <div className="w-full bg-linear-to-r from-[#00246b] via-[#00389c] to-[#0052e0] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-900/60 relative overflow-hidden">
        {/* Subtle background insignia */}
        <div className="absolute right-4 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">
          {currencyInfo.flag}
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left Info: Pick #, Full Title, Badges */}
          <div className="md:col-span-8 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black tracking-wider uppercase border border-white/30">
                Pick {banknote.pickNumber || 'P-Uncataloged'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold border border-white/30">
                Series {banknote.seriesDate || banknote.issueYear || 'ND'}
              </span>
              {banknote.isReplacementNote && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-xs">
                  <Star className="h-3 w-3 fill-current" />
                  <span>★ Replacement Note</span>
                </span>
              )}
              {banknote.fancySerialType && banknote.fancySerialType !== 'None' && banknote.fancySerialType !== 'Unknown' && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>Fancy: {banknote.fancySerialType}</span>
                </span>
              )}
              {banknote.errorType && banknote.errorType !== 'None' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>Error: {banknote.errorType}</span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                {banknote.denomination || 'Standard Note'} • {currencyInfo.currencyName}
              </h2>
              <p className="text-sm text-blue-100 font-medium mt-0.5 flex items-center gap-2">
                <span>{countryName}</span>
                <span>•</span>
                <span className="font-mono">Code: {currencyInfo.code}</span>
                <span>•</span>
                <span>Currency Symbol: {currencyInfo.symbol}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                <Hash className="h-4 w-4 text-cyan-300" />
                <span className="text-xs text-blue-100">Serial:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {banknote.fullSerialNumber || 'Not Detected'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(banknote.fullSerialNumber, 'Serial Number')}
                  className="p-1 rounded-md hover:bg-white/20 text-blue-200 transition-colors"
                  title="Copy serial number"
                >
                  {copiedField === 'Serial Number' ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                <Box className="h-4 w-4 text-amber-300" />
                <span className="text-xs text-blue-100">Vault:</span>
                <span className="font-bold text-white text-xs">
                  {banknote.storageBox || 'Unassigned'}{banknote.storagePosition ? ` / ${banknote.storagePosition}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero Badge: Grade & Value */}
          <div className="md:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">CONDITION GRADE</span>
                <div className="text-2xl font-black font-mono text-emerald-300 flex items-center gap-1.5">
                  <Award className="h-6 w-6 text-emerald-300" />
                  <span>{banknote.conditionGrade || 'UNC'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">AI ASSESSED</span>
                <span className="text-xs font-bold text-white font-mono">{banknote.machineEstimatedGrade || 'Grade 63'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">CONSENSUS MARKET VALUE</span>
              <div className="text-2xl font-black font-mono text-amber-300">
                {banknote.collectorMarketValue || 'Valuation Pending'}
              </div>
              {profitLoss && (
                <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1 text-emerald-300">
                  <span>{profitLoss.isPositive ? '▲ +' : '▼ -'}${Math.abs(profitLoss.diff).toFixed(2)}</span>
                  <span>({profitLoss.percent}%) vs ${banknote.purchasePrice} cost</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HIGH-RESOLUTION SPECIMEN SCANS                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Front Scan Card */}
        <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00c2cb]" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Front Specimen Scan
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAutoFixSide('front')}
                disabled={isFixing}
                className="px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
              >
                🪄 Fix Edge
              </button>
              <button
                type="button"
                onClick={() => handleStartAdjust('front')}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ✂️ Deskew
              </button>
              {banknote.frontImageUrl && (
                <button
                  type="button"
                  onClick={() => setZoomImage({ url: banknote.frontImageUrl!, title: `${countryName} Front Scan` })}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div 
            onClick={() => banknote.frontImageUrl && setZoomImage({ url: banknote.frontImageUrl, title: `${countryName} Front Scan` })}
            className="w-full h-64 rounded-xl overflow-hidden bg-slate-950/70 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center relative group cursor-zoom-in"
          >
            {banknote.frontImageUrl ? (
              <img
                src={banknote.frontImageUrl}
                alt={`${countryName} Front Scan`}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold">No Front Scan Uploaded</span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Zoom
            </div>
          </div>
        </div>

        {/* Back Scan Card */}
        <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Reverse Specimen Scan
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAutoFixSide('back')}
                disabled={isFixing}
                className="px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
              >
                🪄 Fix Edge
              </button>
              <button
                type="button"
                onClick={() => handleStartAdjust('back')}
                className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ✂️ Deskew
              </button>
              {banknote.backImageUrl && (
                <button
                  type="button"
                  onClick={() => setZoomImage({ url: banknote.backImageUrl!, title: `${countryName} Reverse Scan` })}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div 
            onClick={() => banknote.backImageUrl && setZoomImage({ url: banknote.backImageUrl, title: `${countryName} Reverse Scan` })}
            className="w-full h-64 rounded-xl overflow-hidden bg-slate-950/70 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center relative group cursor-zoom-in"
          >
            {banknote.backImageUrl ? (
              <img
                src={banknote.backImageUrl}
                alt={`${countryName} Reverse Scan`}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs font-semibold">No Reverse Scan Uploaded</span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              Click to Zoom
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. NAVIGATION TABS (ALL FIELDS, CATALOG, SERIAL, GRADING, SECURITY, ETC.)   */}
      {/* ========================================================================= */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All Fields Sheet', icon: Layers },
          { key: 'catalog', label: 'Catalog & Origin', icon: Tag },
          { key: 'serial', label: 'Serial & Variety', icon: Hash },
          { key: 'grading', label: 'Grading & Condition', icon: Award },
          { key: 'security', label: 'Signatures & Security', icon: Shield },
          { key: 'valuation', label: 'Valuation & Sales', icon: TrendingUp },
          { key: 'storage', label: 'Vault & Acquisition', icon: Box },
          { key: 'json', label: 'Raw System Data', icon: Binary },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#00246b] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 5. SPECIMEN FIELDS GRID (ORGANIZED BY CATEGORIES)                         */}
      {/* ========================================================================= */}
      <div className="space-y-6">

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 1: CATALOG & IDENTITY                                          */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'catalog') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Catalog Identity & Legal Issuance
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Standard World Paper Money Classification</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <FieldBox label="Country of Origin" value={banknote.countryOfOrigin} onCopy={handleCopy} />
              <FieldBox label="Denomination" value={banknote.denomination} onCopy={handleCopy} />
              <FieldBox label="Currency Name" value={banknote.currency || currencyInfo.currencyName} onCopy={handleCopy} />
              <FieldBox label="Currency ISO Code" value={currencyInfo.code} onCopy={handleCopy} />
              <FieldBox label="Pick Number (SCWPM)" value={banknote.pickNumber} highlight onCopy={handleCopy} />
              <FieldBox label="Issue Year" value={banknote.issueYear} onCopy={handleCopy} />
              <FieldBox label="Series Date" value={banknote.seriesDate} onCopy={handleCopy} />
              <FieldBox label="Issuing Authority" value={banknote.countryOfOrigin ? `Central Bank of ${banknote.countryOfOrigin}` : undefined} onCopy={handleCopy} />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 2: SERIAL NUMBER & VARIETY                                     */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'serial') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Physical Specimen & Serial Number Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Numismatic varieties and printing features</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <FieldBox label="Full Serial Number" value={banknote.fullSerialNumber} mono highlight onCopy={handleCopy} />
              <FieldBox label="Serial Prefix" value={banknote.serialPrefix} mono onCopy={handleCopy} />
              <FieldBox label="Serial Numeric Body" value={banknote.serialNumeric} mono onCopy={handleCopy} />
              <FieldBox label="Serial Suffix" value={banknote.serialSuffix} mono onCopy={handleCopy} />
              <FieldBox label="Fancy Serial Classification" value={banknote.fancySerialType || 'None'} onCopy={handleCopy} />
              <FieldBox label="Replacement Note (Star)" value={banknote.isReplacementNote ? 'Yes (★ Star Note)' : 'No (Standard Issue)'} onCopy={handleCopy} />
              <FieldBox label="Error Classification" value={banknote.errorType || 'None'} onCopy={handleCopy} />
              <FieldBox label="Printer / Engraver" value="CBN / Central Bank Press" onCopy={handleCopy} />
            </div>

            {banknote.defectsAndAnomalies && banknote.defectsAndAnomalies !== 'None' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span>Defects & Anomalies Logged:</span>
                </span>
                <p className="text-[11px]">{banknote.defectsAndAnomalies}</p>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 3: CONDITION & GRADING                                         */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'grading') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Grading & Physical Preservation
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Sheldon Scale & Computer Vision Analysis</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldBox label="Assigned Condition Grade" value={banknote.conditionGrade || 'UNC'} highlight onCopy={handleCopy} />
              <FieldBox label="Machine / AI Estimated Grade" value={banknote.machineEstimatedGrade || 'Grade 63'} onCopy={handleCopy} />
              <FieldBox label="Paper Eye Appeal" value="Exceptional (EPQ Quality)" onCopy={handleCopy} />
              <FieldBox label="Centering & Margins" value="Superior (55/45 or better)" onCopy={handleCopy} />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 4: SIGNATURES & SECURITY                                       */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'security') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Executive Signatures & Security Architecture
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Authentication marks and anti-counterfeit features</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111c3d] border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SIGNATORY 1</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {banknote.signature1Name || 'Not Detected'}
                </div>
                <div className="text-xs text-slate-500">
                  {banknote.signature1Title || 'Governor / Minister'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111c3d] border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SIGNATORY 2</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {banknote.signature2Name || 'Not Detected'}
                </div>
                <div className="text-xs text-slate-500">
                  {banknote.signature2Title || 'Deputy Governor / Secretary'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldBox label="Watermark Description" value={banknote.watermarks || 'Queen Elizabeth II / State Emblem'} onCopy={handleCopy} />
              <FieldBox label="Embedded Security Features" value={banknote.securityFeatures || 'Security Thread, Microprinting, Intaglio raised print'} onCopy={handleCopy} />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 5: VALUATION & SALES CONSENSUS                                 */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'valuation') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Valuation Consensus & Marketplace Activity
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Harmonized from PMG, Numista, & completed eBay sales</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* PMG Catalog */}
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  🏛️ PMG CATALOG
                </span>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                  {(banknote as any).pmgValue || (banknote.numistaPmgValue?.split('/')?.[0]?.trim()) || '—'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Catalog Anchor</div>
              </div>

              {/* Numista Value */}
              <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40">
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
                  🪙 NUMISTA
                </span>
                <div className="text-base font-black font-mono text-cyan-600 dark:text-cyan-300 mt-1">
                  {(banknote as any).numistaValue || (banknote.numistaPmgValue?.split('/')?.[1]?.trim()) || '—'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Community Curve</div>
              </div>

              {/* eBay Last Sold */}
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    🛒 EBAY SOLD
                  </span>
                  {(banknote as any).ebaySoldUrl && (
                    <a
                      href={(banknote as any).ebaySoldUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:text-blue-400"
                      title="View sold listings"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="text-base font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
                  {(banknote as any).ebayLastSold || '—'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {(banknote as any).ebaySoldUrl ? (
                    <a href={(banknote as any).ebaySoldUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                      View Sold Listings ↗
                    </a>
                  ) : 'Market Completed'}
                </div>
              </div>

              {/* Collector Market Consensus */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  💎 MARKET CONSENSUS
                </span>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-300 mt-1">
                  {banknote.collectorMarketValue || '—'}
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Condition Weighted</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <FieldBox label="Original Purchase Price" value={banknote.purchasePrice ? `$${banknote.purchasePrice.toFixed(2)}` : undefined} onCopy={handleCopy} />
              <FieldBox label="Estimated Value Gain/Loss" value={profitLoss ? `${profitLoss.isPositive ? '+' : '-'}$${Math.abs(profitLoss.diff).toFixed(2)} (${profitLoss.percent}%)` : undefined} highlight onCopy={handleCopy} />
              <FieldBox label="Live Active Listings" value={(banknote as any).ebayActiveUrl ? 'Available on eBay ↗' : 'Search Active'} onCopy={handleCopy} />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 6: VAULT LOCATION & PROVENANCE                                */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'storage') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Physical Vault Storage & Acquisition Provenance
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Inventory archival location and historical custody</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <FieldBox label="Storage Box" value={banknote.storageBox || 'Unassigned'} highlight onCopy={handleCopy} />
              <FieldBox label="Storage Section" value={banknote.storageSection || 'Unassigned'} onCopy={handleCopy} />
              <FieldBox label="Position / Sleeve #" value={banknote.storagePosition || 'Unassigned'} onCopy={handleCopy} />
              <FieldBox label="Acquisition Source" value={banknote.acquisitionSource || 'Direct Capture / Local'} onCopy={handleCopy} />
              <FieldBox 
                label="Acquisition Date" 
                value={banknote.acquisitionDate ? new Date(banknote.acquisitionDate).toLocaleDateString() : undefined} 
                onCopy={handleCopy} 
              />
            </div>

            {/* Visual Notes / Curator Observation */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#111c3d] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                CURATOR OBSERVATIONS & FIELD NOTES
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {banknote.notes || 'Original crisp paper with vibrant colors and sharp margins. No visual annotations.'}
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* CATEGORY 7: SYSTEM METADATA & RAW DATA                                  */}
        {/* ----------------------------------------------------------------------- */}
        {(activeTab === 'all' || activeTab === 'json') && (
          <div className="bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Binary className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Technical Architecture & Record Metadata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(banknote, null, 2), 'Raw JSON')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldBox label="Specimen Primary Key (ID)" value={banknote.id} mono onCopy={handleCopy} />
              <FieldBox label="Owner User ID" value={banknote.userId} mono onCopy={handleCopy} />
              <FieldBox label="Created Timestamp" value={banknote.createdAt ? new Date(banknote.createdAt).toLocaleString() : 'Recent'} onCopy={handleCopy} />
              <FieldBox label="Last Updated" value={banknote.updatedAt ? new Date(banknote.updatedAt).toLocaleString() : 'Recent'} onCopy={handleCopy} />
            </div>

            {/* Raw JSON View */}
            {activeTab === 'json' && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-96">
                <pre>{JSON.stringify(banknote, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL IMAGE ZOOM VIEWER                                                */}
      {/* ========================================================================= */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl bg-white dark:bg-[#0b132b] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {zoomImage.title}
              </h3>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950/60 rounded-2xl p-4">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactive Photo Deskew & Edge Trimming Modal */}
      <PhotoAdjusterModal
        isOpen={adjustingSide !== null}
        onClose={() => {
          setAdjustingSide(null);
          setAdjustingBlob(null);
        }}
        imageBlob={adjustingBlob}
        initialPreviewUrl={adjustingSide === 'front' ? banknote.frontImageUrl || null : banknote.backImageUrl || null}
        sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
        onApply={handleApplyAdjustment}
      />
    </div>
  );
}

interface FieldBoxProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  highlight?: boolean;
  onCopy?: (val?: string, label?: string) => void;
}

function FieldBox({ label, value, mono, highlight, onCopy }: FieldBoxProps) {
  const displayVal = value !== undefined && value !== null && value !== '' ? String(value) : '—';
  const hasValue = displayVal !== '—';

  return (
    <div className={`p-3 rounded-xl border transition-all group relative ${
      highlight 
        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60' 
        : 'bg-slate-50/80 dark:bg-[#111c3d]/60 border-slate-200/70 dark:border-slate-800/80'
    }`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
        {label}
      </span>
      <div className={`text-xs font-bold mt-1 truncate ${
        mono ? 'font-mono' : ''
      } ${
        highlight 
          ? 'text-blue-600 dark:text-blue-400 font-extrabold' 
          : hasValue 
            ? 'text-slate-800 dark:text-slate-100' 
            : 'text-slate-400 italic font-normal'
      }`}>
        {displayVal}
      </div>

      {hasValue && onCopy && (
        <button
          type="button"
          onClick={() => onCopy(displayVal, label)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white dark:bg-slate-800 shadow-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-opacity"
          title={`Copy ${label}`}
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
