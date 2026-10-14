'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBanknoteCapture } from '@/hooks/useBanknoteCapture';
import ImagePreview from './ImagePreview';
import CameraInput from './CameraInput';
import NotesInput from './NotesInput';
import PhotoAdjusterModal from './PhotoAdjusterModal';
import { toast } from 'sonner';
import { getSpecimen, updateSpecimen } from '@/lib/offline/idb';
import { cleanBanknoteImage } from '@/lib/media/banknote-cleaner';
import { enqueueSpecimenForExtraction } from '@/lib/ai/background-queue';
import { Sparkles, Check, ArrowRight, Camera, Repeat, Layers, Clock } from 'lucide-react';

type CaptureStep = 'front' | 'back' | 'review' | 'complete';

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

  // Continuous capture mode: automatically cycle to next note without waiting for AI
  const [continuousMode, setContinuousMode] = useState(true);
  const [capturedCount, setCapturedCount] = useState(0);
  const [lastCapturedId, setLastCapturedId] = useState<string | null>(null);

  const { isCapturing, error, saveCapture } = useBanknoteCapture();

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

  const handleSave = async (forceContinuous?: boolean) => {
    if (!frontImage || !backImage) {
      toast.error('Both front and back images are required');
      return;
    }

    const shouldContinuous = forceContinuous !== undefined ? forceContinuous : continuousMode;

    try {
      // Save specimen locally in IndexedDB and push to Cloudflare R2
      const specimenId = await saveCapture(frontImage, backImage, notes || undefined);

      // Immediately queue for background AI identification without blocking the UI
      enqueueSpecimenForExtraction(specimenId);

      setLastCapturedId(specimenId);
      setCapturedCount((prev) => prev + 1);
      onComplete?.(specimenId);

      if (shouldContinuous) {
        toast.success('📸 Specimen saved! AI running in background. Ready for next note.');
        // Instant reset back to Front camera for uninterrupted continuous scanning!
        setRawFrontImage(null);
        setRawFrontPreview(null);
        setRawBackImage(null);
        setRawBackPreview(null);
        setFrontImage(null);
        setFrontPreview(null);
        setBackImage(null);
        setBackPreview(null);
        setNotes('');
        setStep('front');
      } else {
        toast.success('📸 Specimen saved! AI identification running in background.');
        setStep('complete');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err?.message || 'Failed to save specimen. Please check image files and try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Header */}
      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'front' && 'Capture Front'}
              {step === 'back' && 'Capture Back'}
              {step === 'review' && 'Review Specimen'}
              {step === 'complete' && '✓ Specimen Queued'}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {step === 'front' && 'Snap the front side of your banknote'}
              {step === 'back' && 'Snap the back side of your banknote'}
              {step === 'review' && 'Inspect images and save to collection'}
              {step === 'complete' && 'Saved! AI is extracting details in the background'}
            </p>
          </div>

          {/* Continuous Capture Mode Pill */}
          <button
            type="button"
            onClick={() => {
              const next = !continuousMode;
              setContinuousMode(next);
              toast.info(next ? 'Continuous mode ON: fast capture without waiting for AI' : 'Continuous mode OFF');
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              continuousMode
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            }`}
            title="Continuous Mode automatically resets to Front photo after saving so you can capture dozens of notes in a row without waiting for AI"
          >
            <span className={`w-2 h-2 rounded-full ${continuousMode ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Continuous: {continuousMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {capturedCount > 0 && (
          <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs">
            <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{capturedCount} note{capturedCount > 1 ? 's' : ''} captured this session</span>
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              Background AI Active
            </span>
          </div>
        )}
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
          <div className="flex gap-2.5 pt-3">
            <button
              onClick={handleRetakeFront}
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              Retake Front
            </button>
            <button
              onClick={handleRetakeBack}
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              Retake Back
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleSave(true)}
              disabled={isCapturing}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{isCapturing ? 'Saving...' : 'Save & Capture Next (Continuous)'}</span>
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={isCapturing}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Save & Finish
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="space-y-4 pb-4">
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl shadow-sm">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Banknote Specimen Saved!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Your specimen is safely stored. AI identification is running in the background.
              </p>
            </div>

            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/50 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Background Extraction Active</span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400">
                You can freely navigate away. A Magic UI animated notification will appear in the top-right corner when AI details are extracted.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setFrontImage(null);
                setBackImage(null);
                setFrontPreview(null);
                setBackPreview(null);
                setNotes('');
                setStep('front');
              }}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Another Banknote</span>
            </button>

            <div className="flex gap-2">
              <Link
                href="/banknotes"
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-center text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Go to Banknotes
              </Link>
              <Link
                href="/inventory"
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-center text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Go to Inventory
              </Link>
            </div>
          </div>
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
