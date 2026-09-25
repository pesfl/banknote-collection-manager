'use client';

import { useEffect, useState } from 'react';
import { getRecentSpecimens, getSpecimenCountByStatus } from '@/lib/offline/idb';
import type { LocalSpecimen } from '@/types';
import InventoryCard from './InventoryCard';
import SyncPanel from './SyncPanel';

export default function InventoryList() {
  const [specimens, setSpecimens] = useState<LocalSpecimen[]>([]);
  const [counts, setCounts] = useState({ pending: 0, synced: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadSpecimens();

    // Refresh every 2 seconds to catch sync updates
    const interval = setInterval(loadSpecimens, 2000);
    return () => clearInterval(interval);
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
          specimenId={selectedId}
          onClose={() => setSelectedId(null)}
          specimens={specimens}
        />
      )}
    </div>
  );
}

interface SpecimenDetailModalProps {
  specimenId: string;
  onClose: () => void;
  specimens: LocalSpecimen[];
}

function SpecimenDetailModal({
  specimenId,
  onClose,
  specimens,
}: SpecimenDetailModalProps) {
  const specimen = specimens.find(s => s.id === specimenId);

  if (!specimen) return null;

  const frontUrl = URL.createObjectURL(specimen.frontImageBlob);
  const backUrl = URL.createObjectURL(specimen.backImageBlob);

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
          {specimen.extractedData?.country || 'Unknown'} •{' '}
          {specimen.extractedData?.denomination || '—'}
        </h2>

        {/* Images */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Front
            </p>
            <img
              src={frontUrl}
              alt="Front"
              className="w-full rounded-lg"
              onLoad={() => URL.revokeObjectURL(frontUrl)}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Back
            </p>
            <img
              src={backUrl}
              alt="Back"
              className="w-full rounded-lg"
              onLoad={() => URL.revokeObjectURL(backUrl)}
            />
          </div>
        </div>

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
          {specimen.notes && (
            <DetailRow label="Notes" value={specimen.notes} isLong />
          )}
          {specimen.extractedData?.pickNumber && (
            <DetailRow
              label="Pick #"
              value={specimen.extractedData.pickNumber}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
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
