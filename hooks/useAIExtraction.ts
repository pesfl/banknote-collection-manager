'use client';

import { useState, useCallback } from 'react';
import type { AIExtraction } from '@/types';

interface UseAIExtractionReturn {
  isExtracting: boolean;
  extractionData: AIExtraction | null;
  error: string | null;
  extractBanknote: (frontBlob: Blob, backBlob: Blob) => Promise<AIExtraction | null>;
  clearResults: () => void;
}

/**
 * Hook for AI banknote extraction using Gemini Vision API
 */
export function useAIExtraction(): UseAIExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionData, setExtractionData] = useState<AIExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractBanknote = useCallback(
    async (frontBlob: Blob, backBlob: Blob): Promise<AIExtraction | null> => {
      setIsExtracting(true);
      setError(null);
      setExtractionData(null);

      try {
        // Create form data
        const formData = new FormData();
        formData.append('frontImage', frontBlob, 'front.jpg');
        formData.append('backImage', backBlob, 'back.jpg');

        // Call extraction API
        const response = await fetch('/api/ai/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errMsg = errorData.error || 'Failed to extract banknote details';
          if (errMsg.includes('API key not configured')) {
            console.warn('[Gemini Vision] AI extraction skipped: GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env.local.');
            setError('AI extraction skipped: API key not configured');
            return null;
          }
          throw new Error(errMsg);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setExtractionData(result.data);
          return result.data;
        } else {
          throw new Error(result.error || 'Unknown extraction error');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Extraction failed';
        setError(errorMessage);
        console.warn('AI extraction:', errorMessage);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setExtractionData(null);
    setError(null);
  }, []);

  return {
    isExtracting,
    extractionData,
    error,
    extractBanknote,
    clearResults,
  };
}
