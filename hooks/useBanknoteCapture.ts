'use client';

import { useState, useCallback } from 'react';
import { addSpecimen, updateSpecimenSyncStatus } from '@/lib/offline/idb';
import type { LocalSpecimen } from '@/types';

interface UseBanknoteCaptureReturn {
  isCapturing: boolean;
  error: string | null;
  saveCapture: (frontBlob: Blob, backBlob: Blob, notes?: string) => Promise<string>;
  compressImage: (blob: Blob, quality?: number) => Promise<Blob>;
}

/**
 * Hook for capturing banknotes with mobile camera
 * Handles compression, validation, and IndexedDB storage
 */
export function useBanknoteCapture(): UseBanknoteCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Compress image to reduce storage size
   * JPEG quality 85% is acceptable for AI vision processing
   */
  const compressImage = useCallback(
    async (blob: Blob, quality: number = 0.85): Promise<Blob> => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = event => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(blob);
              return;
            }

            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
              compressedBlob => {
                resolve(compressedBlob || blob);
              },
              'image/jpeg',
              quality
            );
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(blob);
      });
    },
    []
  );

  /**
   * Save capture to IndexedDB
   * Returns the local specimen ID
   */
  const saveCapture = useCallback(
    async (frontBlob: Blob, backBlob: Blob, notes?: string): Promise<string> => {
      setIsCapturing(true);
      setError(null);

      try {
        // Compress images
        const compressedFront = await compressImage(frontBlob);
        const compressedBack = await compressImage(backBlob);

        // Validate
        if (compressedFront.size === 0 || compressedBack.size === 0) {
          throw new Error('Invalid images');
        }

        // Create local specimen
        const localSpecimen: LocalSpecimen = {
          id: `sp_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          frontImageBlob: compressedFront,
          backImageBlob: compressedBack,
          capturedAt: new Date(),
          syncStatus: 'pending',
          notes,
          syncRetryCount: 0,
        };

        // Save to IndexedDB
        await addSpecimen(localSpecimen);

        setIsCapturing(false);
        return localSpecimen.id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save capture';
        setError(errorMessage);
        setIsCapturing(false);
        throw new Error(errorMessage);
      }
    },
    [compressImage]
  );

  return {
    isCapturing,
    error,
    saveCapture,
    compressImage,
  };
}
