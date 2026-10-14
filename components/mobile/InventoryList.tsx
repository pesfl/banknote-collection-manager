'use client';

import { useEffect, useState } from 'react';
import { getRecentSpecimens, getSpecimenCountByStatus, deleteSpecimen, updateSpecimen } from '@/lib/offline/idb';
import { cleanBanknoteImage } from '@/lib/media/banknote-cleaner';
import PhotoAdjusterModal from './PhotoAdjusterModal';
import type { LocalSpecimen } from '@/types';
import InventoryCard from './InventoryCard';
import SyncPanel from './SyncPanel';
import { toast } from 'sonner';
import { Trash2, TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';

export default function InventoryList() {
  const [specimens, setSpecimens] = useState<LocalSpecimen[]>([]);
  const [counts, setCounts] = useState({ pending: 0, synced: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadSpecimens();

    // Refresh every 2 seconds to catch sync updates
    const interval = setInterval(loadSpecimens, 2000);

    const handleSpecimenUpdated = () => {
      loadSpecimens();
    };
    window.addEventListener('banknote-specimen-updated', handleSpecimenUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    };
  }, []);

  const loadSpecimens = async () => {
    try {
      const [recentSpecimens, specCounts] = await Promise.all([
        getRecentSpecimens(20),
        getSpecimenCountByStatus(),
      ]);
      setSpecimens(recentSpecimens);
      setCounts(specCounts);
    } catch (err) {
      console.error('Failed to load specimens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (specimenId: string) => {
    setSelectedId(selectedId === specimenId ? null : specimenId);
  };

  return (
    <div className="w-full">
      {/* Sync Panel */}
      <SyncPanel counts={counts} onSync={loadSpecimens} />

      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Captures
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {counts.synced + counts.pending + counts.failed} total
          {counts.pending > 0 && ` • ${counts.pending} pending sync`}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && specimens.length === 0 && (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="text-center">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No captures yet
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Start by capturing your first banknote specimen
            </p>
            <a
              href="/capture"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Capturing
            </a>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      {!isLoading && specimens.length > 0 && (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {specimens.map(specimen => (
              <div
                key={specimen.id}
                onClick={() => handleCardClick(specimen.id)}
              >
                <InventoryCard specimen={specimen} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specimen Details Modal (if selected) */}
      {selectedId && (
        <SpecimenDetailModal
          key={selectedId}
          specimenId={selectedId}
          onClose={() => setSelectedId(null)}
          specimens={specimens}
          onDelete={loadSpecimens}
        />
      )}
    </div>
  );
}

interface SpecimenDetailModalProps {
  specimenId: string;
  onClose: () => void;
  specimens: LocalSpecimen[];
  onDelete: () => void;
}

function SpecimenDetailModal({
  specimenId,
  onClose,
  specimens,
  onDelete,
}: SpecimenDetailModalProps) {
  const specimen = specimens.find(s => s.id === specimenId);

  if (!specimen) return null;

  const [activeFrontBlob, setActiveFrontBlob] = useState<Blob>(specimen.frontImageBlob);
  const [activeBackBlob, setActiveBackBlob] = useState<Blob>(specimen.backImageBlob);
  const [frontUrl, setFrontUrl] = useState<string>(() => URL.createObjectURL(specimen.frontImageBlob));
  const [backUrl, setBackUrl] = useState<string>(() => URL.createObjectURL(specimen.backImageBlob));

  const [isFixing, setIsFixing] = useState(false);
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);
  const [isRefreshingValuation, setIsRefreshingValuation] = useState(false);

  const handleRefreshValuation = async () => {
    if (!specimen) return;
    setIsRefreshingValuation(true);
    try {
      const ex = (specimen.extractedData || {}) as any;
      const res = await fetch(`/api/valuation/${specimen.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryOfOrigin: ex.countryOfOrigin || ex.country,
          denomination: ex.denomination,
          issueYear: ex.issueYear || ex.seriesDate,
          conditionGrade: ex.conditionGrade,
          serialNumeric: ex.serialNumeric || ex.fullSerialNumber,
          isReplacementNote: ex.isReplacementNote,
        })
      });
      if (res.ok) {
        const json = await res.json();
        const valData = json?.data || json;
        await updateSpecimen({
          ...specimen,
          extractedData: {
            ...ex,
            valuation: valData,
            collectorMarketValue: valData.collectorMarketValue,
            pmgValue: valData.pmgValue,
            numistaValue: valData.numistaValue,
            ebayLastSold: valData.ebayLastSold,
          }
        });
        toast.success(`Valuation updated: ${valData.collectorMarketValue}`);
        onDelete();
      } else {
        toast.error('Could not refresh valuation');
      }
    } catch {
      toast.error('Failed to contact valuation service');
    } finally {
      setIsRefreshingValuation(false);
    }
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    if (!specimen) return;
    const blobToClean = side === 'front' ? activeFrontBlob : activeBackBlob;
    setIsFixing(true);
    try {
      toast.info(`Straightening and cropping ${side} photo...`);
      const cleanRes = await cleanBanknoteImage(blobToClean, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
        cropMarginPercent: 0,
        enhanceClarity: false,
      });

      if (cleanRes && cleanRes.cleanedBlob) {
        if (side === 'front') {
          setActiveFrontBlob(cleanRes.cleanedBlob);
          setFrontUrl(cleanRes.dataUrl);
          await updateSpecimen({
            ...specimen,
            frontImageBlob: cleanRes.cleanedBlob,
            backImageBlob: activeBackBlob,
          });
        } else {
          setActiveBackBlob(cleanRes.cleanedBlob);
          setBackUrl(cleanRes.dataUrl);
          await updateSpecimen({
            ...specimen,
            frontImageBlob: activeFrontBlob,
            backImageBlob: cleanRes.cleanedBlob,
          });
        }
        toast.success(`✨ ${side === 'front' ? 'Front' : 'Back'} photo cleaned and saved!`);
        onDelete();
      }
    } catch {
      toast.error(`Could not fix ${side} image automatically`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixImages = async () => {
    if (!specimen) return;
    setIsFixing(true);
    try {
      toast.info('Straightening and cropping both note images...');
      const [cleanFront, cleanBack] = await Promise.all([
        cleanBanknoteImage(activeFrontBlob, {
          autoStraighten: true,
          autoCropEdges: true,
          autoRotateLandscape: false,
          cropMarginPercent: 0,
          enhanceClarity: false,
        }),
        cleanBanknoteImage(activeBackBlob, {
          autoStraighten: true,
          autoCropEdges: true,
          autoRotateLandscape: false,
          cropMarginPercent: 0,
          enhanceClarity: false,
        }),
      ]);

      setActiveFrontBlob(cleanFront.cleanedBlob);
      setActiveBackBlob(cleanBack.cleanedBlob);
      setFrontUrl(cleanFront.dataUrl);
      setBackUrl(cleanBack.dataUrl);

      await updateSpecimen({
        ...specimen,
        frontImageBlob: cleanFront.cleanedBlob,
        backImageBlob: cleanBack.cleanedBlob,
      });

      toast.success('✨ Both specimen images straightened and cropped!');
      onDelete(); // Refresh inventory list items
    } catch {
      toast.error('Could not fix specimen images');
    } finally {
      setIsFixing(false);
    }
  };

  const handleResetOriginal = async (side: 'front' | 'back') => {
    if (!specimen) return;
    try {
      if (side === 'front') {
        setActiveFrontBlob(specimen.frontImageBlob);
        setFrontUrl(URL.createObjectURL(specimen.frontImageBlob));
        await updateSpecimen({
          ...specimen,
          frontImageBlob: specimen.frontImageBlob,
          backImageBlob: activeBackBlob,
        });
      } else {
        setActiveBackBlob(specimen.backImageBlob);
        setBackUrl(URL.createObjectURL(specimen.backImageBlob));
        await updateSpecimen({
          ...specimen,
          frontImageBlob: activeFrontBlob,
          backImageBlob: specimen.backImageBlob,
        });
      }
      toast.success(`Reset ${side} photo to original`);
      onDelete();
    } catch {
      toast.error(`Could not reset ${side} photo`);
    }
  };

  const handleApplyAdjustment = async (cleanedBlob: Blob, cleanedPreview: string) => {
    if (!specimen || !adjustingSide) return;
    try {
      if (adjustingSide === 'front') {
        setActiveFrontBlob(cleanedBlob);
        setFrontUrl(cleanedPreview);
        await updateSpecimen({
          ...specimen,
          frontImageBlob: cleanedBlob,
          backImageBlob: activeBackBlob,
        });
      } else {
        setActiveBackBlob(cleanedBlob);
        setBackUrl(cleanedPreview);
        await updateSpecimen({
          ...specimen,
          frontImageBlob: activeFrontBlob,
          backImageBlob: cleanedBlob,
        });
      }
      toast.success(`✨ ${adjustingSide === 'front' ? 'Front' : 'Back'} photo updated and saved!`);
      onDelete();
    } catch {
      toast.error('Failed to save adjusted photo');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this specimen?')) return;
    try {
      await deleteSpecimen(specimen.id);
      await fetch(`/api/banknotes/${specimen.id}`, { method: 'DELETE' }).catch(() => {});
      toast.success('Specimen permanently deleted');
      onDelete();
      onClose();
    } catch (err) {
      toast.error('Failed to delete specimen');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl p-4 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pr-8">
          {(specimen.extractedData as any)?.countryOfOrigin || specimen.extractedData?.country || 'Unknown'} •{' '}
          {specimen.extractedData?.denomination || '—'}
        </h2>

        {/* Images & Edit Menu */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Specimen Photos
            </span>
            {isFixing ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                🪄 Optimizing edges...
              </span>
            ) : null}
          </div>

          {/* Quick Auto-Fix Both Button */}
          <button
            type="button"
            onClick={handleFixImages}
            disabled={isFixing}
            className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span className={isFixing ? 'animate-spin' : ''}>🪄</span>
            <span>{isFixing ? 'Auto-Fixing Images...' : 'Auto-Fix Both Images (Crop & Straighten)'}</span>
          </button>

          {/* Front Photo Card */}
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Front Specimen</p>
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
                  onClick={() => setAdjustingSide('front')}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>✂️ Adjust</span>
                </button>
              </div>
            </div>
            <img
              src={frontUrl}
              alt="Front"
              className="w-full h-44 sm:h-48 object-contain bg-slate-950/40 p-2"
            />
          </div>

          {/* Back Photo Card */}
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Back Specimen</p>
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
                  onClick={() => setAdjustingSide('back')}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>✂️ Adjust</span>
                </button>
              </div>
            </div>
            <img
              src={backUrl}
              alt="Back"
              className="w-full h-44 sm:h-48 object-contain bg-slate-950/40 p-2"
            />
          </div>
        </div>

        {/* Multi-Source Valuation Matrix */}
        {(() => {
          const ex = (specimen.extractedData || {}) as any;
          const valObj = ex.valuation || {};
          const pmgVal = ex.pmgValue || valObj.pmgValue || '—';
          const numistaVal = ex.numistaValue || valObj.numistaValue || '—';
          const ebayVal = ex.ebayLastSold || valObj.ebayLastSold || '—';
          const ebayUrl = ex.ebaySoldUrl || valObj.ebaySoldUrl;
          const marketVal = ex.collectorMarketValue || valObj.collectorMarketValue || (typeof ex.valuation === 'string' && ex.valuation !== '$150' ? ex.valuation : '—');

          return (
            <div className="mb-4 p-3.5 rounded-2xl bg-linear-to-br from-slate-900 to-[#0e172e] border border-emerald-500/30 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                      Valuation Breakdown
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Live Consensus
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">PMG, Numista & eBay sales</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshValuation}
                  disabled={isRefreshingValuation}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Re-query valuation engine"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingValuation ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingValuation ? 'Updating...' : 'Refresh'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">🏛️ PMG Catalog</span>
                  <span className="text-xs font-bold font-mono text-slate-200">{pmgVal}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">🪙 Numista</span>
                  <span className="text-xs font-bold font-mono text-cyan-300">{numistaVal}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">🛒 eBay Sold</span>
                    {ebayUrl && (
                      <a href={ebayUrl} target="_blank" rel="noreferrer" className="text-blue-400">
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-300">
                    {ebayVal && ebayVal !== '—' ? (
                      ebayVal
                    ) : ebayUrl ? (
                      <a href={ebayUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline font-sans text-[11px]">
                        Check Sold ↗
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 block font-semibold">💎 Market Consensus</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-400">{marketVal}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Details */}
        <div className="space-y-3 mb-6">
          <DetailRow
            label="Status"
            value={
              specimen.syncStatus === 'synced'
                ? '☁️ Synced'
                : specimen.syncStatus === 'pending'
                  ? '📍 Pending Sync'
                  : '⚠️ Sync Error'
            }
          />
          <DetailRow
            label="Captured"
            value={new Date(specimen.capturedAt).toLocaleString()}
          />
          {((specimen.extractedData as any)?.fullSerialNumber || (specimen.extractedData as any)?.serialNumeric) && (
            <DetailRow
              label="Serial #"
              value={(specimen.extractedData as any)?.fullSerialNumber || (specimen.extractedData as any)?.serialNumeric}
            />
          )}
          {((specimen.extractedData as any)?.issueYear || (specimen.extractedData as any)?.seriesDate) && (
            <DetailRow
              label="Issue Year"
              value={[(specimen.extractedData as any)?.issueYear, (specimen.extractedData as any)?.seriesDate].filter(Boolean).join(' / ')}
            />
          )}
          {(specimen.extractedData as any)?.conditionGrade && (
            <DetailRow
              label="Grade"
              value={(specimen.extractedData as any)?.conditionGrade}
            />
          )}
          {specimen.extractedData?.pickNumber && (
            <DetailRow
              label="Pick #"
              value={specimen.extractedData.pickNumber}
            />
          )}
          {(specimen.extractedData as any)?.fancySerialType && (specimen.extractedData as any)?.fancySerialType !== 'None' && (
            <DetailRow
              label="Fancy Serial"
              value={(specimen.extractedData as any)?.fancySerialType}
            />
          )}
          {((specimen.extractedData as any)?.signature1Name || (specimen.extractedData as any)?.signature2Name) && (
            <DetailRow
              label="Signatures"
              value={[(specimen.extractedData as any)?.signature1Name, (specimen.extractedData as any)?.signature2Name].filter(Boolean).join('; ')}
              isLong
            />
          )}
          {(specimen.extractedData as any)?.watermarks && (
            <DetailRow
              label="Watermarks"
              value={(specimen.extractedData as any)?.watermarks}
              isLong
            />
          )}
          {(specimen.extractedData as any)?.securityFeatures && (
            <DetailRow
              label="Security"
              value={(specimen.extractedData as any)?.securityFeatures}
              isLong
            />
          )}
          {(specimen.notes || (specimen.extractedData as any)?.notes) && (
            <DetailRow
              label="Notes"
              value={specimen.notes || (specimen.extractedData as any)?.notes}
              isLong
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold rounded-lg border border-rose-200 dark:border-rose-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Specimen</span>
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Interactive Photo Adjuster Modal */}
      <PhotoAdjusterModal
        isOpen={adjustingSide !== null}
        onClose={() => setAdjustingSide(null)}
        imageBlob={adjustingSide === 'front' ? activeFrontBlob : activeBackBlob}
        initialPreviewUrl={adjustingSide === 'front' ? frontUrl : backUrl}
        sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
        onApply={handleApplyAdjustment}
      />
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  isLong?: boolean;
}

function DetailRow({ label, value, isLong = false }: DetailRowProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p
        className={`text-sm text-gray-900 dark:text-white ${isLong ? 'whitespace-pre-wrap' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
