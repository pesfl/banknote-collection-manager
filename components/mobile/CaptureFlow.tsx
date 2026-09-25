'use client';

import { useState } from 'react';
import { useBanknoteCapture } from '@/hooks/useBanknoteCapture';
import ImagePreview from './ImagePreview';
import CameraInput from './CameraInput';
import NotesInput from './NotesInput';

type CaptureStep = 'front' | 'back' | 'review' | 'complete';

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
      const specimenId = await saveCapture(frontImage, backImage, notes || undefined);
      setStep('complete');
      onComplete?.(specimenId);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFrontImage(null);
        setBackImage(null);
        setFrontPreview(null);
        setBackPreview(null);
        setNotes('');
        setStep('front');
      }, 2000);
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
          {step === 'complete' && '✓ Saved!'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {step === 'front' && 'Take a clear photo of the front of the banknote'}
          {step === 'back' && 'Take a clear photo of the back of the banknote'}
          {step === 'review' && 'Review your photos before saving'}
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

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Saved to local storage. Will sync when you're online.
          </p>
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
        </div>
      )}
    </div>
  );
}
