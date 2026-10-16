'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';
import type { Banknote } from '@/types';
import { toast } from 'sonner';
import PhotoAdjusterModal from '@/components/mobile/PhotoAdjusterModal';
import { cleanBanknoteImage, ensureImageBlob } from '@/lib/media/banknote-cleaner';
import { getSpecimen, updateSpecimen, deleteSpecimen } from '@/lib/offline/idb';
import { resolveBanknoteValuation } from '@/lib/valuation/valuation-service';
import { getCountryFlag } from '@/lib/ai/background-queue';
import { MultiSourceValuationCard } from './MultiSourceValuationCard';
import { HistoricalValuationTrendChart } from './HistoricalValuationTrendChart';

export interface ExtendedBanknote extends Banknote {
  pmgValue?: string;
  numistaValue?: string;
  ebayLastSold?: string;
  ebaySoldUrl?: string;
}

export interface CondensedSpecimenModalProps {
  banknote: Banknote | ExtendedBanknote | any | null;
  isOpen: boolean;
  onClose: () => void;
  onSpecimenUpdated?: (updated: Banknote) => void;
  onSpecimenDeleted?: (id: string) => void;
}

function normalizeToBanknote(item: any): ExtendedBanknote | null {
  if (!item) return null;
  return {
    userId: item.userId || 'guest',
    id: item.id || '',
    countryOfOrigin: item.countryOfOrigin || item.country || 'Unknown',
    denomination: item.denomination || '—',
    currency: item.currency || '',
    issueYear: item.issueYear || item.year || '',
    pickNumber: item.pickNumber || '',
    fullSerialNumber: item.fullSerialNumber || item.serialNumber || '',
    conditionGrade: item.conditionGrade || item.condition || 'UNC',
    frontImageUrl: item.frontImageUrl || item.frontImage || item.displayImageUrl || '',
    backImageUrl: item.backImageUrl || item.backImage || '',
    displayImageUrl: item.displayImageUrl || item.frontImageUrl || item.frontImage || '',
    collectorMarketValue: item.collectorMarketValue || item.value || 'Valuation Pending',
    pmgValue: item.pmgValue || (item.numistaPmgValue ? item.numistaPmgValue.split('/')?.[0]?.trim() : ''),
    numistaValue: item.numistaValue || (item.numistaPmgValue ? item.numistaPmgValue.split('/')?.[1]?.trim() : ''),
    ebayLastSold: item.ebayLastSold || '',
    ebaySoldUrl: item.ebaySoldUrl || '',
    numistaPmgValue: item.numistaPmgValue || '',
    notes: item.notes || '',
    isReplacementNote: Boolean(item.isReplacementNote),
    fancySerialType: item.fancySerialType || (item.isSpecial ? 'Special' : 'None'),
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  } as ExtendedBanknote;
}

export default function CondensedSpecimenModal({
  banknote,
  isOpen,
  onClose,
  onSpecimenUpdated,
  onSpecimenDeleted,
}: CondensedSpecimenModalProps) {
  const [activeSpecimen, setActiveSpecimen] = useState<Banknote | null>(() => normalizeToBanknote(banknote));
  const [isFixing, setIsFixing] = useState(false);
  const [isRefreshingValuation, setIsRefreshingValuation] = useState(false);
  const [originalImages, setOriginalImages] = useState<Record<string, { front?: string; back?: string }>>({});

  // Deskew / crop manual adjuster state
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);
  const [adjustingBlob, setAdjustingBlob] = useState<Blob | null>(null);

  useEffect(() => {
    setActiveSpecimen(normalizeToBanknote(banknote));
  }, [banknote]);

  if (!isOpen || !activeSpecimen) return null;

  const handleAutoFixBoth = async () => {
    if (!activeSpecimen) return;
    const frontUrl = activeSpecimen.frontImageUrl;
    const backUrl = activeSpecimen.backImageUrl;
    if (!frontUrl && !backUrl) {
      toast.error('No images available to fix');
      return;
    }

    setIsFixing(true);
    try {
      toast.info('Straightening and cropping both note images...');
      const specKey = activeSpecimen.id || activeSpecimen.fullSerialNumber || 'specimen';
      if (!originalImages[specKey]) {
        setOriginalImages(prev => ({
          ...prev,
          [specKey]: {
            front: activeSpecimen.frontImageUrl,
            back: activeSpecimen.backImageUrl,
          }
        }));
      }

      const fixes: Promise<any>[] = [];
      if (frontUrl) {
        fixes.push(
          ensureImageBlob(frontUrl).then(b =>
            cleanBanknoteImage(b, {
              autoStraighten: true,
              autoCropEdges: true,
              autoRotateLandscape: false,
              cropMarginPercent: 0,
              enhanceClarity: false,
            })
          )
        );
      } else {
        fixes.push(Promise.resolve(null));
      }

      if (backUrl) {
        fixes.push(
          ensureImageBlob(backUrl).then(b =>
            cleanBanknoteImage(b, {
              autoStraighten: true,
              autoCropEdges: true,
              autoRotateLandscape: false,
              cropMarginPercent: 0,
              enhanceClarity: false,
            })
          )
        );
      } else {
        fixes.push(Promise.resolve(null));
      }

      const [cleanFront, cleanBack] = await Promise.all(fixes);

      const updated: Banknote = {
        ...activeSpecimen,
        frontImageUrl: cleanFront?.dataUrl || activeSpecimen.frontImageUrl,
        backImageUrl: cleanBack?.dataUrl || activeSpecimen.backImageUrl,
        displayImageUrl: cleanFront?.dataUrl || activeSpecimen.displayImageUrl,
      };
      setActiveSpecimen(updated);
      onSpecimenUpdated?.(updated);

      if (activeSpecimen.id) {
        try {
          const local = await getSpecimen(activeSpecimen.id);
          if (local) {
            await updateSpecimen({
              ...local,
              ...(cleanFront?.cleanedBlob ? { frontImageBlob: cleanFront.cleanedBlob } : {}),
              ...(cleanBack?.cleanedBlob ? { backImageBlob: cleanBack.cleanedBlob } : {}),
            });
            window.dispatchEvent(new CustomEvent('banknote-specimen-updated', { detail: { id: activeSpecimen.id } }));
          }
        } catch (e) {
          console.warn('IDB update skipped:', e);
        }
      }

      toast.success('✨ Both specimen images straightened and cropped!');
    } catch (err) {
      console.error('Auto fix both error:', err);
      toast.error('Could not fix specimen images');
    } finally {
      setIsFixing(false);
    }
  };

  const handleResetOriginal = async (side: 'front' | 'back') => {
    if (!activeSpecimen) return;
    const specKey = activeSpecimen.id || activeSpecimen.fullSerialNumber || 'specimen';
    const orig = originalImages[specKey];
    const origUrl = side === 'front' ? orig?.front : orig?.back;
    if (!origUrl) {
      toast.info(`${side === 'front' ? 'Front' : 'Back'} image is already at original state`);
      return;
    }

    const updated: Banknote = {
      ...activeSpecimen,
      ...(side === 'front' 
        ? { frontImageUrl: origUrl, displayImageUrl: origUrl } 
        : { backImageUrl: origUrl }
      ),
    };
    setActiveSpecimen(updated);
    onSpecimenUpdated?.(updated);
    toast.success(`Restored original ${side} scan`);
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    if (!activeSpecimen) return;
    const url = side === 'front' ? activeSpecimen.frontImageUrl : activeSpecimen.backImageUrl;
    if (!url) {
      toast.error(`No ${side} image to fix`);
      return;
    }

    setIsFixing(true);
    try {
      toast.info(`Straightening and cropping ${side} image...`);
      const specKey = activeSpecimen.id || activeSpecimen.fullSerialNumber || 'specimen';
      if (!originalImages[specKey]) {
        setOriginalImages(prev => ({
          ...prev,
          [specKey]: {
            front: activeSpecimen.frontImageUrl,
            back: activeSpecimen.backImageUrl,
          }
        }));
      }

      const blob = await ensureImageBlob(url);
      const cleaned = await cleanBanknoteImage(blob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
        cropMarginPercent: 0,
        enhanceClarity: false,
      });

      const updated: Banknote = {
        ...activeSpecimen,
        ...(side === 'front'
          ? { frontImageUrl: cleaned.dataUrl, displayImageUrl: cleaned.dataUrl }
          : { backImageUrl: cleaned.dataUrl }
        ),
      };
      setActiveSpecimen(updated);
      onSpecimenUpdated?.(updated);

      if (activeSpecimen.id) {
        try {
          const local = await getSpecimen(activeSpecimen.id);
          if (local) {
            await updateSpecimen({
              ...local,
              ...(side === 'front' ? { frontImageBlob: cleaned.cleanedBlob } : { backImageBlob: cleaned.cleanedBlob }),
            });
            window.dispatchEvent(new CustomEvent('banknote-specimen-updated', { detail: { id: activeSpecimen.id } }));
          }
        } catch (e) {
          console.warn('IDB update skipped:', e);
        }
      }

      toast.success(`✨ ${side === 'front' ? 'Front' : 'Back'} image straightened and cropped!`);
    } catch (err) {
      console.error(`Auto fix ${side} error:`, err);
      toast.error(`Could not fix ${side} image`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleStartAdjust = async (side: 'front' | 'back') => {
    if (!activeSpecimen) return;
    const url = side === 'front' ? activeSpecimen.frontImageUrl : activeSpecimen.backImageUrl;
    if (!url) {
      toast.error(`No ${side} image to adjust`);
      return;
    }

    try {
      const blob = await ensureImageBlob(url);
      setAdjustingBlob(blob);
      setAdjustingSide(side);
    } catch (e) {
      console.error('Failed to prepare image for adjuster:', e);
      toast.error('Could not open photo adjuster');
    }
  };

  const handleApplyAdjustment = async (croppedBlob: Blob, dataUrl: string) => {
    if (!activeSpecimen || !adjustingSide) return;
    const side = adjustingSide;

    const specKey = activeSpecimen.id || activeSpecimen.fullSerialNumber || 'specimen';
    if (!originalImages[specKey]) {
      setOriginalImages(prev => ({
        ...prev,
        [specKey]: {
          front: activeSpecimen.frontImageUrl,
          back: activeSpecimen.backImageUrl,
        }
      }));
    }

    const updated: Banknote = {
      ...activeSpecimen,
      ...(side === 'front'
        ? { frontImageUrl: dataUrl, displayImageUrl: dataUrl }
        : { backImageUrl: dataUrl }
      ),
    };
    setActiveSpecimen(updated);
    onSpecimenUpdated?.(updated);

    if (activeSpecimen.id) {
      try {
        const local = await getSpecimen(activeSpecimen.id);
        if (local) {
          await updateSpecimen({
            ...local,
            ...(side === 'front' ? { frontImageBlob: croppedBlob } : { backImageBlob: croppedBlob }),
          });
          window.dispatchEvent(new CustomEvent('banknote-specimen-updated', { detail: { id: activeSpecimen.id } }));
        }
      } catch (e) {
        console.warn('IDB update skipped:', e);
      }
    }

    setAdjustingSide(null);
    setAdjustingBlob(null);
    toast.success(`Applied manual adjustments to ${side} specimen`);
  };

  const handleRefreshValuation = async () => {
    if (!activeSpecimen) return;
    setIsRefreshingValuation(true);
    try {
      toast.info('Fetching live valuation across PMG, Numista & eBay...');
      const valuation = await resolveBanknoteValuation({
        countryOfOrigin: activeSpecimen.countryOfOrigin,
        denomination: activeSpecimen.denomination,
        issueYear: activeSpecimen.issueYear,
        pickNumber: activeSpecimen.pickNumber,
        conditionGrade: activeSpecimen.conditionGrade,
        isReplacementNote: activeSpecimen.isReplacementNote,
        fancySerialType: activeSpecimen.fancySerialType,
      });

      const updated: Banknote = {
        ...activeSpecimen,
        collectorMarketValue: valuation.collectorMarketValue,
        numistaPmgValue: `${valuation.pmgValue || '—'} / ${valuation.numistaValue || '—'}`,
        ...((valuation as any).pmgValue ? { pmgValue: (valuation as any).pmgValue } : {}),
        ...((valuation as any).numistaValue ? { numistaValue: (valuation as any).numistaValue } : {}),
        ...((valuation as any).ebayLastSold ? { ebayLastSold: (valuation as any).ebayLastSold } : {}),
        ...((valuation as any).ebaySoldUrl ? { ebaySoldUrl: (valuation as any).ebaySoldUrl } : {}),
      };

      setActiveSpecimen(updated);
      onSpecimenUpdated?.(updated);

      if (activeSpecimen.id) {
        try {
          const local = await getSpecimen(activeSpecimen.id);
          if (local) {
            const ex = (local.extractedData || {}) as any;
            await updateSpecimen({
              ...local,
              extractedData: {
                ...ex,
                valuation,
                collectorMarketValue: valuation.collectorMarketValue,
                pmgValue: valuation.pmgValue,
                numistaValue: valuation.numistaValue,
                ebayLastSold: valuation.ebayLastSold,
              }
            });
            window.dispatchEvent(new CustomEvent('banknote-specimen-updated', { detail: { id: activeSpecimen.id } }));
          }
          // Sync to central cloud PostgreSQL (Neon)
          fetch('/api/banknotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
        } catch (e) {
          console.warn('Failed to save valuation into IDB:', e);
        }
      }

      toast.success(`Valuation updated: ${valuation.collectorMarketValue}`);
    } catch (err) {
      console.error('Valuation refresh error:', err);
      toast.error('Failed to refresh market valuation');
    } finally {
      setIsRefreshingValuation(false);
    }
  };

  const handleDeleteSpecimen = async () => {
    if (!activeSpecimen) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${activeSpecimen.countryOfOrigin} ${activeSpecimen.denomination}?`
    );
    if (!confirmDelete) return;

    try {
      if (activeSpecimen.id) {
        await deleteSpecimen(activeSpecimen.id).catch(() => {});
        await fetch(`/api/banknotes/${activeSpecimen.id}`, { method: 'DELETE' }).catch(() => {});
      }
      toast.success('Specimen deleted');
      if (activeSpecimen.id) {
        window.dispatchEvent(new CustomEvent('banknote-specimen-updated', { detail: { id: activeSpecimen.id, deleted: true } }));
        onSpecimenDeleted?.(activeSpecimen.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete specimen error:', err);
      toast.error('Could not delete specimen');
    }
  };

  const noteId = activeSpecimen.id || '';

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl bg-[#0b132b] text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl space-y-3.5 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl select-none" role="img" aria-label={activeSpecimen.countryOfOrigin}>
                {getCountryFlag(activeSpecimen.countryOfOrigin)}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {activeSpecimen.countryOfOrigin} {activeSpecimen.denomination} ({activeSpecimen.issueYear || 'ND'})
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Pick #{activeSpecimen.pickNumber || 'P-Pending'} | Serial: {activeSpecimen.fullSerialNumber || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {noteId && (
                <Link
                  href={`/banknotes/${encodeURIComponent(noteId)}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer group"
                  title="Open Dedicated Full Page View with All Fields"
                >
                  <span>All Fields View</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Blue Action Button */}
          <button
            type="button"
            onClick={handleAutoFixBoth}
            disabled={isFixing}
            className="w-full py-2.5 px-4 bg-[#3b49f4] hover:bg-[#2c3be0] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>🪄</span>
            <span>{isFixing ? 'Auto-Fixing Images...' : 'Auto-Fix Both Images (Crop & Straighten)'}</span>
          </button>

          {/* Front & Back Scan Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Front Scan Box */}
            <div className="rounded-2xl overflow-hidden border border-slate-800/90 bg-[#0f172a]/60">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#0f172a] text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  FRONT SPECIMEN SCAN
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetOriginal('front')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 rounded-md transition-colors cursor-pointer"
                    title="Restore original unedited photo"
                  >
                    ↺ Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFixSide('front')}
                    disabled={isFixing}
                    className="px-2 py-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 rounded-md border border-emerald-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    🪄 Fix Image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartAdjust('front')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ✂️ Adjust
                  </button>
                </div>
              </div>
              <div className="h-44 sm:h-48 w-full bg-slate-950/80 p-2 flex items-center justify-center">
                <img
                  src={activeSpecimen.frontImageUrl || 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=800&auto=format&fit=crop&q=80'}
                  alt="Front Scan"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Back Scan Box */}
            <div className="rounded-2xl overflow-hidden border border-slate-800/90 bg-[#0f172a]/60">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#0f172a] text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  BACK SPECIMEN SCAN
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetOriginal('back')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 rounded-md transition-colors cursor-pointer"
                    title="Restore original unedited photo"
                  >
                    ↺ Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFixSide('back')}
                    disabled={isFixing}
                    className="px-2 py-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 rounded-md border border-emerald-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    🪄 Fix Image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartAdjust('back')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ✂️ Adjust
                  </button>
                </div>
              </div>
              <div className="h-44 sm:h-48 w-full bg-slate-950/80 p-2 flex items-center justify-center">
                <img
                  src={activeSpecimen.backImageUrl || 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=800&auto=format&fit=crop&q=80'}
                  alt="Back Scan"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* 5+1 Multi-Source Valuation Matrix & Real-time Reconciler */}
          <MultiSourceValuationCard
            banknoteId={activeSpecimen.id}
            banknoteData={{
              countryOfOrigin: activeSpecimen.countryOfOrigin,
              denomination: activeSpecimen.denomination,
              currency: activeSpecimen.currency,
              pickNumber: activeSpecimen.pickNumber,
              issueYear: activeSpecimen.issueYear,
              conditionGrade: activeSpecimen.conditionGrade,
              isReplacementNote: activeSpecimen.isReplacementNote,
              fancySerialType: activeSpecimen.fancySerialType,
              collectorMarketValue: activeSpecimen.collectorMarketValue,
              numistaPmgValue: activeSpecimen.numistaPmgValue,
              purchasePrice: activeSpecimen.purchasePrice,
            }}
            onValuationUpdated={(newVal) => {
              setActiveSpecimen((prev: any) => ({
                ...prev,
                collectorMarketValue: newVal.collectorMarketValue,
                numistaPmgValue: `${newVal.pmgValue || '—'} / ${newVal.numistaValue || '—'}`,
                pmgValue: newVal.pmgValue,
                heritageValue: newVal.heritageValue,
                stacksBowersValue: newVal.stacksBowersValue,
                ebayValue: newVal.ebayValue || newVal.ebayLastSold,
                numistaValue: newVal.numistaValue,
                banknoteArchivesValue: newVal.banknoteArchivesValue,
                ebayLastSold: newVal.ebayLastSold,
                ebaySoldUrl: newVal.ebaySoldUrl,
              }));
              if (onSpecimenUpdated) {
                onSpecimenUpdated({
                  ...activeSpecimen,
                  collectorMarketValue: newVal.collectorMarketValue,
                });
              }
            }}
          />

          {/* Historical Valuation Trend & Date-Stamped Logs */}
          <HistoricalValuationTrendChart
            banknoteId={activeSpecimen.id || ''}
            purchasePrice={activeSpecimen.purchasePrice}
            acquisitionDate={activeSpecimen.acquisitionDate}
            currentValue={activeSpecimen.collectorMarketValue}
          />

          {/* 4-Column Metric Strip (Condition, Quantity, Estimated Value, Special Tag) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONDITION</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{activeSpecimen.conditionGrade || 'UNC'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QUANTITY</span>
              <span className="text-sm font-bold text-white mt-0.5 block">1 notes</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMATED VALUE</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">{activeSpecimen.collectorMarketValue || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SPECIAL TAG</span>
              <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                {activeSpecimen.isReplacementNote 
                  ? '★ Replacement Note' 
                  : activeSpecimen.fancySerialType && activeSpecimen.fancySerialType !== 'None'
                    ? `Fancy: ${activeSpecimen.fancySerialType}`
                    : 'Standard Specimen'}
              </span>
            </div>
          </div>

          {/* Specimen Notes */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
            <span className="font-bold text-white block">Specimen Notes:</span>
            <p className="text-slate-300 leading-relaxed text-xs">
              {activeSpecimen.notes || 'Original crisp paper with vibrant colors and sharp margins.'}
            </p>
          </div>

          {/* Bottom Bar: Delete Specimen (left) and All Fields View + Close (right) */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleDeleteSpecimen}
              className="px-4 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/60 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Specimen</span>
            </button>

            <div className="flex items-center gap-2.5">
              {noteId && (
                <Link
                  href={`/banknotes/${encodeURIComponent(noteId)}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md group"
                  title="Open Dedicated Full Page View with All Fields"
                >
                  <span>All Fields View</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Photo Deskew & Edge Trimming Modal */}
      <PhotoAdjusterModal
        isOpen={adjustingSide !== null}
        onClose={() => {
          setAdjustingSide(null);
          setAdjustingBlob(null);
        }}
        imageBlob={adjustingBlob}
        initialPreviewUrl={adjustingSide === 'front' ? activeSpecimen?.frontImageUrl || null : activeSpecimen?.backImageUrl || null}
        sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
        onApply={handleApplyAdjustment}
      />
    </>
  );
}
