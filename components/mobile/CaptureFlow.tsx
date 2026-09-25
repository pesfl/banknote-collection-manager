'use client';

import { useState } from 'react';
import { useBanknoteCapture } from '@/hooks/useBanknoteCapture';
import { useAIExtraction } from '@/hooks/useAIExtraction';
import ImagePreview from './ImagePreview';
import CameraInput from './CameraInput';
import NotesInput from './NotesInput';
import ExtractionResults from './ExtractionResults';

type CaptureStep = 'front' | 'back' | 'review' | 'extracting' | 'complete';

interface CaptureFlowProps {
  onComplete?: (specimenId: string) => void;
}

export default function CaptureFlow({ onComplete }: CaptureFlowProps) {
  const [step, setStep] = useState<CaptureStep>('front');
  const [frontImage, setFrontImage] = useState<Blob | null>(null);
  const [backImage, setBackImage] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const { isCapturing, error, saveCapture } = useBanknoteCapture();
  const { isExtracting, extractionData, error: extractionError, extractBanknote } =
    useAIExtraction();

  const handleFrontCapture = (blob: Blob, preview: string) => {
    setFrontImage(blob);
    setFrontPreview(preview);
    setStep('back');
  };

  const handleBackCapture = (blob: Blob, preview: string) => {
    setBackImage(blob);
    setBackPreview(preview);
    setStep('review');
  };

  const handleRetakeFront = () => {
    setFrontImage(null);
    setFrontPreview(null);
    setStep('front');
  };

  const handleRetakeBack = () => {
    setBackImage(null);
    setBackPreview(null);
    setStep('back');
  };

  const handleSave = async () => {
    if (!frontImage || !backImage) {
      alert('Both images are required');
      return;
    }

    try {
      // Save specimen locally first
      const specimenId = await saveCapture(frontImage, backImage, notes || undefined);

      // Start AI extraction in background
      setStep('extracting');
      extractBanknote(frontImage, backImage).catch(err => {
        console.error('AI extraction error:', err);
        // Continue even if extraction fails
      });

      // Show completion
      setStep('complete');
      onComplete?.(specimenId);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview(null);
        setBackPreview(null);
        setNotes('');
        setStep('front');
      }, 3000);
    } catch (err) {
      console.error('Save failed:', err);
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
          {/* Image Preview */}
          <div className="space-y-3">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 px-3 pt-3 pb-1">
                Front
              </p>
              {frontPreview && (
                <img
                  src={frontPreview}
                  alt="Front"
                  className="w-full h-40 object-cover"
                />
              )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 px-3 pt-3 pb-1">
                Back
              </p>
              {backPreview && (
                <img
                  src={backPreview}
                  alt="Back"
                  className="w-full h-40 object-cover"
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
    </div>
  );
}
