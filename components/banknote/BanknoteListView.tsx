'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Layers,
  X
} from 'lucide-react';
import type { Banknote } from '@/types';
import BanknoteListItem from './BanknoteListItem';
import { toast } from 'sonner';
import PhotoAdjusterModal from '@/components/mobile/PhotoAdjusterModal';
import { cleanBanknoteImage, ensureImageBlob } from '@/lib/media/banknote-cleaner';
import { getSpecimen, updateSpecimen } from '@/lib/offline/idb';

interface BanknoteListViewProps {
  banknotes?: Banknote[];
  isLoading?: boolean;
  onSort?: (sort: 'recent' | 'country' | 'value') => void;
  onFilter?: (filter: string) => void;
  onSpecimenUpdated?: (updated: Banknote) => void;
}

export default function BanknoteListView({
  banknotes = [],
  isLoading = false,
  onSort,
  onFilter,
  onSpecimenUpdated,
}: BanknoteListViewProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'country' | 'value'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [activeSpecimen, setActiveSpecimen] = useState<Banknote | null>(null);

  const [isFixing, setIsFixing] = useState(false);
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);
  const [adjustingBlob, setAdjustingBlob] = useState<Blob | null>(null);
  const [originalImages, setOriginalImages] = useState<{ [id: string]: { front?: string; back?: string } }>({});

  const handleSort = (sort: 'recent' | 'country' | 'value') => {
    setSortBy(sort);
    onSort?.(sort);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(banknotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "banknote_collection_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Collection exported as JSON');
  };

  const handleStartAdjust = async (side: 'front' | 'back') => {
    if (!activeSpecimen) return;
    const url = side === 'front' ? activeSpecimen.frontImageUrl : activeSpecimen.backImageUrl;
    if (!url) {
      toast.error(`No ${side} image available to adjust`);
      return;
    }
    try {
      toast.info(`Preparing ${side} image editor...`);
      const blob = await ensureImageBlob(url);
      setAdjustingBlob(blob);
      setAdjustingSide(side);
    } catch (err) {
      console.error('Error loading image for adjuster:', err);
      toast.error(`Could not load ${side} image for editing`);
    }
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    if (!activeSpecimen) return;
    const url = side === 'front' ? activeSpecimen.frontImageUrl : activeSpecimen.backImageUrl;
    if (!url) {
      toast.error(`No ${side} image available`);
      return;
    }
    setIsFixing(true);
    try {
      toast.info(`Straightening and cropping ${side} photo...`);
      const blob = await ensureImageBlob(url);
      const cleanRes = await cleanBanknoteImage(blob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
        cropMarginPercent: 0,
        enhanceClarity: false,
      });

      if (cleanRes && cleanRes.cleanedBlob) {
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
          [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: cleanRes.dataUrl,
          ...(side === 'front' ? { displayImageUrl: cleanRes.dataUrl } : {}),
        };
        setActiveSpecimen(updated);
        onSpecimenUpdated?.(updated);

        if (activeSpecimen.id) {
          try {
            const local = await getSpecimen(activeSpecimen.id);
            if (local) {
              await updateSpecimen({
                ...local,
                [side === 'front' ? 'frontImageBlob' : 'backImageBlob']: cleanRes.cleanedBlob,
              });
            }
          } catch (e) {
            console.warn('IDB update skipped:', e);
          }
        }

        toast.success(`✨ ${side === 'front' ? 'Front' : 'Back'} image straightened & cropped!`);
      }
    } catch (err) {
      console.error('Auto fix error:', err);
      toast.error(`Could not fix ${side} image`);
    } finally {
      setIsFixing(false);
    }
  };

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

    try {
      const updated: Banknote = {
        ...activeSpecimen,
        [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: origUrl,
        ...(side === 'front' ? { displayImageUrl: origUrl } : {}),
      };
      setActiveSpecimen(updated);
      onSpecimenUpdated?.(updated);

      if (activeSpecimen.id) {
        try {
          const local = await getSpecimen(activeSpecimen.id);
          if (local) {
            const origBlob = await ensureImageBlob(origUrl);
            await updateSpecimen({
              ...local,
              [side === 'front' ? 'frontImageBlob' : 'backImageBlob']: origBlob,
            });
          }
        } catch (e) {
          console.warn('IDB revert skipped:', e);
        }
      }

      toast.success(`Reset ${side} photo to original`);
    } catch {
      toast.error(`Could not reset ${side} photo`);
    }
  };

  const handleApplyAdjustment = async (cleanedBlob: Blob, cleanedPreview: string) => {
    if (!activeSpecimen || !adjustingSide) return;
    try {
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
        [adjustingSide === 'front' ? 'frontImageUrl' : 'backImageUrl']: cleanedPreview,
        ...(adjustingSide === 'front' ? { displayImageUrl: cleanedPreview } : {}),
      };
      setActiveSpecimen(updated);
      onSpecimenUpdated?.(updated);

      if (activeSpecimen.id) {
        try {
          const local = await getSpecimen(activeSpecimen.id);
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

      toast.success(`✨ ${adjustingSide === 'front' ? 'Front' : 'Back'} photo updated and saved!`);
    } catch {
      toast.error('Failed to save adjusted photo');
    }
  };

  const filteredBanknotes = banknotes.filter(b => {
    const matchesSearch = 
      b.countryOfOrigin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.denomination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.fullSerialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'ALL' || b.countryOfOrigin === selectedCountry;
    const matchesGrade = selectedGrade === 'ALL' || b.conditionGrade === selectedGrade;

    return matchesSearch && matchesCountry && matchesGrade;
  });

  const uniqueCountries = Array.from(new Set(banknotes.map(b => b.countryOfOrigin).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(banknotes.map(b => b.conditionGrade).filter(Boolean)));

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR (Clean Royal/Navy Blue Bar with Title & Action Pills)       */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#00246b] dark:bg-[#001744] text-white rounded-2xl px-4 sm:px-6 py-3.5 shadow-md flex flex-wrap items-center justify-between gap-4 border border-blue-900/60">
        
        {/* Left: Bank Building Icon + Title */}
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-blue-200" />
          <h1 className="text-base sm:text-lg font-extrabold tracking-wide uppercase">
            BANKNOTE INVENTORY
          </h1>
        </div>

        {/* Right: Action Buttons (Add Note, Search, Filter, Export) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* + Add Note (Bright Blue Pill) */}
          <Link
            href="/capture"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Note</span>
          </Link>

          {/* Search Button / Toggle (Dark Navy Pill) */}
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showSearchInput 
                ? 'bg-[#003896] border-blue-400 text-white' 
                : 'bg-[#001b52] hover:bg-[#002d80] text-blue-100 border-blue-900/80'
            }`}
          >
            <Search className="h-3.5 w-3.5 text-blue-300" />
            <span>Search</span>
          </button>

          {/* Filter Button / Toggle (Dark Navy Pill) */}
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              showFilterDropdown || selectedCountry !== 'ALL' || selectedGrade !== 'ALL'
                ? 'bg-[#003896] border-blue-400 text-white' 
                : 'bg-[#001b52] hover:bg-[#002d80] text-blue-100 border-blue-900/80'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-blue-300" />
            <span>Filter</span>
            {(selectedCountry !== 'ALL' || selectedGrade !== 'ALL') && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Export Button (Dark Navy Pill) */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#001b52] hover:bg-[#002d80] text-blue-100 text-xs font-semibold border border-blue-900/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-300" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDABLE SEARCH & FILTER BAR                                            */}
      {/* ========================================================================= */}
      {(showSearchInput || showFilterDropdown) && (
        <div className="p-4 bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2">
          {showSearchInput && (
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Country, Pick #, Denomination, Serial, Notes..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {showFilterDropdown && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">All Countries</option>
                {uniqueCountries.map(c => (
                  <option key={c} value={c as string}>{c}</option>
                ))}
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">All Grades</option>
                {uniqueGrades.map(g => (
                  <option key={g} value={g as string}>{g}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111c3d] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
              >
                <option value="recent">Sort: Most Recent</option>
                <option value="value">Sort: Highest Value</option>
                <option value="country">Sort: Country (A-Z)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPECIMEN LIST ROWS                                                        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredBanknotes.length > 0 ? (
          filteredBanknotes.map((banknote) => (
            <BanknoteListItem
              key={banknote.id || banknote.fullSerialNumber}
              banknote={banknote}
              imageUrl={banknote.frontImageUrl}
              onOpenViewer={(b) => setActiveSpecimen(b)}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-[#0b132b] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Specimens Match Your Criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Try adjusting your search query or reset your country and grade filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCountry('ALL'); setSelectedGrade('ALL'); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0066ff] text-white hover:bg-blue-600"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* HIGH-RES SPECIMEN INSPECTOR MODAL                                         */}
      {/* ========================================================================= */}
      {activeSpecimen && (
        <div 
          onClick={() => setActiveSpecimen(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-[#0b132b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeSpecimen.countryOfOrigin} {activeSpecimen.denomination} ({activeSpecimen.issueYear})
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Pick {activeSpecimen.pickNumber} | Serial: {activeSpecimen.fullSerialNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveSpecimen(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Auto-Fix Both Button */}
            <button
              type="button"
              onClick={handleAutoFixBoth}
              disabled={isFixing}
              className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className={isFixing ? 'animate-spin' : ''}>🪄</span>
              <span>{isFixing ? 'Auto-Fixing Images...' : 'Auto-Fix Both Images (Crop & Straighten)'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border-2 border-[#00c2cb] bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Front Specimen Scan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResetOriginal('front')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Restore original unedited photo"
                    >
                      <span>↺ Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFixSide('front')}
                      disabled={isFixing}
                      className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>🪄 Fix Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAdjust('front')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>✂️ Adjust</span>
                    </button>
                  </div>
                </div>
                <img
                  src={activeSpecimen.frontImageUrl || 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=800&auto=format&fit=crop&q=80'}
                  alt="Front Scan"
                  className="w-full h-56 object-contain bg-slate-950/60 p-2"
                />
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-[#00c2cb] bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Back Specimen Scan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResetOriginal('back')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Restore original unedited photo"
                    >
                      <span>↺ Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFixSide('back')}
                      disabled={isFixing}
                      className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>🪄 Fix Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAdjust('back')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>✂️ Adjust</span>
                    </button>
                  </div>
                </div>
                <img
                  src={activeSpecimen.backImageUrl || 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=800&auto=format&fit=crop&q=80'}
                  alt="Back Scan"
                  className="w-full h-56 object-contain bg-slate-950/60 p-2"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111c3d] text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">Visual Notes & Condition:</span>
              <p className="text-slate-600 dark:text-slate-300">
                {activeSpecimen.notes || 'Original crisp paper with vibrant colors and sharp margins.'}
              </p>
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
            initialPreviewUrl={adjustingSide === 'front' ? activeSpecimen.frontImageUrl || null : activeSpecimen.backImageUrl || null}
            sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
            onApply={handleApplyAdjustment}
          />
        </div>
      )}
    </div>
  );
}
