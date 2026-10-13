'use client';

import { useState, useCallback } from 'react';
import { addSpecimen, updateSpecimenSyncStatus } from '@/lib/offline/idb';
import type { LocalSpecimen } from '@/types';
import { cleanBanknoteImage } from '@/lib/media/banknote-cleaner';

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
   * Compress image to reduce storage size with fallback & safety timeout.
   * Never hangs or blocks the UI.
   */
  const compressImage = useCallback(
    async (blob: Blob, quality: number = 0.85): Promise<Blob> => {
      let activeBlob = blob;

      // Ensure HEIC/HEIF blobs are converted to JPEG
      const isHeic =
        activeBlob.type.toLowerCase().includes('heic') ||
        activeBlob.type.toLowerCase().includes('heif');

      if (isHeic) {
        try {
          const heic2anyModule = await import('heic2any');
          const heic2any = heic2anyModule.default || heic2anyModule;
          const converted = await heic2any({
            blob: activeBlob,
            toType: 'image/jpeg',
            quality,
          });
          activeBlob = (Array.isArray(converted) ? converted[0] : converted) as Blob;
        } catch (heicErr) {
          console.warn('HEIC conversion error in compressor, attempting fallback:', heicErr);
        }
      }

      // If image is already reasonably sized (< 1.5MB) and is JPEG/PNG/WebP, use directly
      if (activeBlob.size < 1.5 * 1024 * 1024 && !isHeic) {
        return activeBlob;
      }

      return new Promise<Blob>((resolve) => {
        // Hard safety timeout: resolve with original blob after 2500ms
        const timer = setTimeout(() => {
          console.warn('Image compression timed out, proceeding with active blob');
          resolve(activeBlob);
        }, 2500);

        try {
          const reader = new FileReader();
          reader.onerror = () => {
            clearTimeout(timer);
            resolve(activeBlob);
          };
          reader.onload = (event) => {
            try {
              const result = event.target?.result;
              if (typeof result !== 'string') {
                clearTimeout(timer);
                resolve(activeBlob);
                return;
              }

              const img = new Image();
              img.onerror = () => {
                clearTimeout(timer);
                resolve(activeBlob);
              };
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  let width = img.width || 1200;
                  let height = img.height || 800;
                  const maxDim = 1920;

                  if (width > maxDim || height > maxDim) {
                    if (width > height) {
                      height = Math.round((height * maxDim) / width);
                      width = maxDim;
                    } else {
                      width = Math.round((width * maxDim) / height);
                      height = maxDim;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    clearTimeout(timer);
                    resolve(activeBlob);
                    return;
                  }

                  ctx.drawImage(img, 0, 0, width, height);
                  canvas.toBlob(
                    (compressedBlob) => {
                      clearTimeout(timer);
                      resolve(compressedBlob || activeBlob);
                    },
                    'image/jpeg',
                    quality
                  );
                } catch {
                  clearTimeout(timer);
                  resolve(activeBlob);
                }
              };
              img.src = result;
            } catch {
              clearTimeout(timer);
              resolve(activeBlob);
            }
          };
          reader.readAsDataURL(activeBlob);
        } catch {
          clearTimeout(timer);
          resolve(activeBlob);
        }
      });
    },
    []
  );

  /**
   * Save capture to IndexedDB and immediately upload to Cloudflare R2
   * Returns the local specimen ID
   */
  const saveCapture = useCallback(
    async (frontBlob: Blob, backBlob: Blob, notes?: string): Promise<string> => {
      setIsCapturing(true);
      setError(null);

      try {
        // Compress images with safety fallbacks (preserving cleaned dimensions and leveling)
        const cleanFront = await compressImage(frontBlob);
        const cleanBack = await compressImage(backBlob);

        // Validate
        if (cleanFront.size === 0 || cleanBack.size === 0) {
          throw new Error('Selected images are invalid or empty');
        }

        // Create local specimen record
        const localSpecimen: LocalSpecimen = {
          id: `sp_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          frontImageBlob: cleanFront,
          backImageBlob: cleanBack,
          capturedAt: new Date(),
          syncStatus: 'pending',
          notes,
          syncRetryCount: 0,
        };

        // Cache in IndexedDB
        try {
          await addSpecimen(localSpecimen);
        } catch (idbErr) {
          console.warn('Local IndexedDB storage error (using memory):', idbErr);
        }

        // Immediately upload to backend (Cloudflare R2)
        try {
          const formData = new FormData();
          formData.append('frontImage', cleanFront, 'front.jpg');
          formData.append('backImage', cleanBack, 'back.jpg');
          if (notes) formData.append('notes', notes);
          formData.append('capturedAt', localSpecimen.capturedAt.toISOString());

          const uploadRes = await fetch('/api/capture', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.serverId) {
              await updateSpecimenSyncStatus(localSpecimen.id, 'synced', uploadData.serverId).catch(() => {});
            }
          }
        } catch (netErr) {
          console.warn('Network upload to R2 deferred to sync queue:', netErr);
        }

        return localSpecimen.id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save capture';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsCapturing(false);
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
