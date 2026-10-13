'use client';

import { useState } from 'react';
import { useBanknoteCapture } from '@/hooks/useBanknoteCapture';
import { useAIExtraction } from '@/hooks/useAIExtraction';
import ImagePreview from './ImagePreview';
import CameraInput from './CameraInput';
import NotesInput from './NotesInput';
import ExtractionResults from './ExtractionResults';
import PhotoAdjusterModal from './PhotoAdjusterModal';
import { toast } from 'sonner';
import { getSpecimen, updateSpecimen } from '@/lib/offline/idb';
import { cleanBanknoteImage } from '@/lib/media/banknote-cleaner';

type CaptureStep = 'front' | 'back' | 'review' | 'extracting' | 'complete';

interface CaptureFlowProps {
  onComplete?: (specimenId: string) => void;
}

export default function CaptureFlow({ onComplete }: CaptureFlowProps) {
  const [step, setStep] = useState<CaptureStep>('front');
  const [frontImage, setFrontImage] = useState<Blob | null>(null);
  const [backImage, setBackImage] = useState<Blob | null>(null);
  const [rawFrontImage, setRawFrontImage] = useState<Blob | null>(null);
  const [rawBackImage, setRawBackImage] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [rawFrontPreview, setRawFrontPreview] = useState<string | null>(null);
  const [rawBackPreview, setRawBackPreview] = useState<string | null>(null);
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);

  const { isCapturing, error, saveCapture } = useBanknoteCapture();
  const { isExtracting, extractionData, error: extractionError, extractBanknote } =
    useAIExtraction();

  const [isCleaning, setIsCleaning] = useState(false);

  const handleFrontCapture = async (blob: Blob, preview: string) => {
    setRawFrontImage(blob);
    setRawFrontPreview(preview);
    setFrontImage(blob);
    setFrontPreview(preview);
    setStep('back');

    // Automatically straighten skew & crop edges from rawBlob
    try {
      setIsCleaning(true);
      const cleanRes = await cleanBanknoteImage(blob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
      });
      if (cleanRes && cleanRes.cleanedBlob) {
        setFrontImage(cleanRes.cleanedBlob);
        setFrontPreview(cleanRes.dataUrl);
      }
    } catch (err) {
      console.warn('Auto clean front error:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleBackCapture = async (blob: Blob, preview: string) => {
    setRawBackImage(blob);
    setRawBackPreview(preview);
    setBackImage(blob);
    setBackPreview(preview);
    setStep('review');

    // Automatically straighten skew & crop edges from rawBlob
    try {
      setIsCleaning(true);
      const cleanRes = await cleanBanknoteImage(blob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
      });
      if (cleanRes && cleanRes.cleanedBlob) {
        setBackImage(cleanRes.cleanedBlob);
        setBackPreview(cleanRes.dataUrl);
      }
    } catch (err) {
      console.warn('Auto clean back error:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    // ALWAYS use the raw capture so we never re-crop an already-cropped image
    const rawBlob = side === 'front' ? (rawFrontImage || frontImage) : (rawBackImage || backImage);
    if (!rawBlob) return;
    setIsCleaning(true);
    try {
      toast.info(`Straightening ${side} photo...`);
      const res = await cleanBanknoteImage(rawBlob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
      });
      if (res && res.cleanedBlob) {
        if (side === 'front') {
          setFrontImage(res.cleanedBlob);
          setFrontPreview(res.dataUrl);
        } else {
          setBackImage(res.cleanedBlob);
          setBackPreview(res.dataUrl);
        }
        toast.success(`✨ ${side === 'front' ? 'Front' : 'Back'} photo leveled safely!`);
      }
    } catch {
      toast.error(`Could not fix ${side} photo automatically`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleAutoFixBoth = async () => {
    const rawFront = rawFrontImage || frontImage;
    const rawBack = rawBackImage || backImage;
    if (!rawFront || !rawBack) return;
    setIsCleaning(true);
    try {
      toast.info('Leveling both photos safely...');
      const [cleanFront, cleanBack] = await Promise.all([
        cleanBanknoteImage(rawFront, {
          autoStraighten: true,
          autoCropEdges: true,
          autoRotateLandscape: false,
        }),
        cleanBanknoteImage(rawBack, {
          autoStraighten: true,
          autoCropEdges: true,
          autoRotateLandscape: false,
        }),
      ]);
      setFrontImage(cleanFront.cleanedBlob);
      setFrontPreview(cleanFront.dataUrl);
      setBackImage(cleanBack.cleanedBlob);
      setBackPreview(cleanBack.dataUrl);
      toast.success('✨ Both photos leveled and framed safely!');
    } catch {
      toast.error('Could not fix photos automatically');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleResetOriginal = (side: 'front' | 'back') => {
    if (side === 'front' && rawFrontImage && rawFrontPreview) {
      setFrontImage(rawFrontImage);
      setFrontPreview(rawFrontPreview);
      toast.info('Restored full original front photo');
    } else if (side === 'back' && rawBackImage && rawBackPreview) {
      setBackImage(rawBackImage);
      setBackPreview(rawBackPreview);
      toast.info('Restored full original back photo');
    }
  };

  const handleRetakeFront = () => {
    setRawFrontImage(null);
    setRawFrontPreview(null);
    setFrontImage(null);
    setFrontPreview(null);
    setStep('front');
  };

  const handleRetakeBack = () => {
    setRawBackImage(null);
    setRawBackPreview(null);
    setBackImage(null);
    setBackPreview(null);
    setStep('back');
  };

  const handleSave = async () => {
    if (!frontImage || !backImage) {
      toast.error('Both front and back images are required');
      return;
    }

    try {
      // Save specimen locally and push to Cloudflare R2
      const specimenId = await saveCapture(frontImage, backImage, notes || undefined);

      toast.success('Specimen saved and uploaded to storage!');

      // Run AI extraction if available
      setStep('extracting');
      try {
        const extraction = await extractBanknote(frontImage, backImage);
        if (extraction) {
          toast.success('AI banknote identification completed!');
          try {
            const existing = await getSpecimen(specimenId);
            if (existing) {
              await updateSpecimen({
                ...existing,
                extractedData: {
                  ...extraction,
                  country: extraction.countryOfOrigin || existing.extractedData?.country,
                  countryOfOrigin: extraction.countryOfOrigin,
                  denomination: extraction.denomination,
                  pickNumber: extraction.pickNumber || undefined,
                  fullSerialNumber: extraction.fullSerialNumber || undefined,
                  issueYear: extraction.issueYear || undefined,
                  seriesDate: extraction.seriesDate || undefined,
                  conditionGrade: extraction.conditionGrade || undefined,
                  machineEstimatedGrade: extraction.machineEstimatedGrade || undefined,
                  currency: extraction.currency || undefined,
                  fancySerialType: extraction.fancySerialType || undefined,
                  isReplacementNote: extraction.isReplacementNote,
                  signature1Name: extraction.signature1Name || undefined,
                  signature1Title: extraction.signature1Title || undefined,
                  signature2Name: extraction.signature2Name || undefined,
                  signature2Title: extraction.signature2Title || undefined,
                  watermarks: extraction.watermarks || undefined,
                  securityFeatures: extraction.securityFeatures || undefined,
                  notes: extraction.notes || undefined,
                  defectsAndAnomalies: extraction.defectsAndAnomalies || undefined,
                },
              });

              // If serverId is present, also update database record
              if (existing.serverId) {
                await fetch(`/api/banknotes/${existing.serverId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(extraction),
                }).catch(() => {});
              }
            }
          } catch (idbUpdateErr) {
            console.warn('Could not update specimen with AI extraction in IDB:', idbUpdateErr);
          }
        }
      } catch (aiErr) {
        console.warn('AI extraction skipped:', aiErr);
      }

      // Show completion
      setStep('complete');
      onComplete?.(specimenId);

      // Only auto-reset if no AI extraction results are being displayed to the user
      if (!extractionData) {
        setTimeout(() => {
          setFrontImage(null);
          setBackImage(null);
          setFrontPreview(null);
          setBackPreview(null);
          setNotes('');
          setStep('front');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err?.message || 'Failed to save specimen. Please check image files and try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="pt-4 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {step === 'front' && 'Capture Front'}
          {step === 'back' && 'Capture Back'}
          {step === 'review' && 'Review'}
          {step === 'extracting' && '🤖 Analyzing...'}
          {step === 'complete' && '✓ Saved!'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {step === 'front' && 'Take a clear photo of the front of the banknote'}
          {step === 'back' && 'Take a clear photo of the back of the banknote'}
          {step === 'review' && 'Review your photos before saving'}
          {step === 'extracting' && 'AI is identifying your banknote...'}
          {step === 'complete' && 'Your specimen has been saved locally'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Front Capture Step */}
      {step === 'front' && (
        <div className="space-y-4">
          <CameraInput
            onCapture={handleFrontCapture}
            disabled={isCapturing}
            label="Front Photo"
          />
        </div>
      )}

      {/* Back Capture Step */}
      {step === 'back' && (
        <div className="space-y-4">
          {/* Show Front Preview */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 px-3 pt-3 pb-1">
              Front (captured)
            </p>
            {frontPreview && (
              <img
                src={frontPreview}
                alt="Front"
                className="w-full h-40 object-cover"
              />
            )}
          </div>

          {/* Back Camera Input */}
          <CameraInput
            onCapture={handleBackCapture}
            disabled={isCapturing}
            label="Back Photo"
          />
        </div>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Edge Cleaning Status Badge */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Cleaned Specimen Photos
            </span>
            {isCleaning ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 animate-pulse">
                🪄 Optimizing edges & leveling...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                ✨ Auto-Cropped & Leveled
              </span>
            )}
          </div>

          {/* Quick Auto-Fix Both Button */}
          <button
            type="button"
            onClick={handleAutoFixBoth}
            disabled={isCleaning}
            className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <span className={isCleaning ? 'animate-spin' : ''}>🪄</span>
            <span>{isCleaning ? 'Auto-Fixing Images...' : 'Auto-Fix Both Images (Crop & Straighten)'}</span>
          </button>

          {/* Image Previews with Edit/Straighten buttons */}
          <div className="space-y-3">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Front</p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetOriginal('front')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Restore full uncropped original photo"
                  >
                    <span>↺ Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFixSide('front')}
                    disabled={isCleaning}
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
              {frontPreview && (
                <img
                  src={frontPreview}
                  alt="Front"
                  className="w-full h-44 object-contain bg-slate-950/20"
                />
              )}
            </div>

            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Back</p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetOriginal('back')}
                    className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Restore full uncropped original photo"
                  >
                    <span>↺ Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoFixSide('back')}
                    disabled={isCleaning}
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
              {backPreview && (
                <img
                  src={backPreview}
                  alt="Back"
                  className="w-full h-44 object-contain bg-slate-950/20"
                />
              )}
            </div>
          </div>

          {/* Notes Input */}
          <NotesInput value={notes} onChange={setNotes} />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRetakeFront}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Retake Front
            </button>
            <button
              onClick={handleRetakeBack}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Retake Back
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isCapturing}
            className="w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
          >
            {isCapturing ? 'Saving...' : 'Save Specimen'}
          </button>
        </div>
      )}

      {/* Extracting Step */}
      {step === 'extracting' && (
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin text-4xl">🤖</div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-2">
              Analyzing with AI...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Extracting banknote details (country, denomination, serial, condition, etc.)
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="space-y-4 pb-4">
          <div className="text-center py-4">
            <div className="text-5xl mb-2">✓</div>
            <p className="font-semibold text-gray-900 dark:text-white">Saved!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Saved to local storage. Will sync when you're online.
            </p>
          </div>

          {/* Show Extraction Results if Available */}
          {extractionData && (
            <div>
              <ExtractionResults
                data={extractionData}
                onClose={() => {
                  setFrontImage(null);
                  setBackImage(null);
                  setFrontPreview(null);
                  setBackPreview(null);
                  setNotes('');
                  setStep('front');
                }}
              />
            </div>
          )}

          {/* Extraction Error */}
          {extractionError && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ⚠️ AI identification skipped: {extractionError}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Your specimen is still saved. You can identify it manually later.
              </p>
            </div>
          )}

          {/* Capture Another Button */}
          {!extractionData && !extractionError && (
            <button
              onClick={() => {
                setFrontImage(null);
                setBackImage(null);
                setFrontPreview(null);
                setBackPreview(null);
                setNotes('');
                setStep('front');
              }}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Capture Another
            </button>
          )}
        </div>
      )}

      {/* Interactive Photo Deskew & Edge Trimming Modal */}
      <PhotoAdjusterModal
        isOpen={adjustingSide !== null}
        onClose={() => setAdjustingSide(null)}
        imageBlob={adjustingSide === 'front' ? (rawFrontImage || frontImage) : (rawBackImage || backImage)}
        initialPreviewUrl={adjustingSide === 'front' ? (rawFrontPreview || frontPreview) : (rawBackPreview || backPreview)}
        sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
        onApply={(cleanedBlob, cleanedPreview) => {
          if (adjustingSide === 'front') {
            setFrontImage(cleanedBlob);
            setFrontPreview(cleanedPreview);
          } else {
            setBackImage(cleanedBlob);
            setBackPreview(cleanedPreview);
          }
          toast.success('Cleaned photo updated');
        }}
      />
    </div>
  );
}
