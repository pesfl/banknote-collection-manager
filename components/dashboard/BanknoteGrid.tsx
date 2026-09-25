'use client';

import { useEffect, useState } from 'react';
import { initDB, getAllSpecimens } from '@/lib/offline/idb';
import type { LocalSpecimen } from '@/types';
import BanknoteCard from './BanknoteCard';

interface BanknoteGridProps {
  searchQuery: string;
  filterCountry: string;
  sortBy: 'recent' | 'country' | 'value';
}

export default function BanknoteGrid({
  searchQuery,
  filterCountry,
  sortBy,
}: BanknoteGridProps) {
  const [specimens, setSpecimens] = useState<LocalSpecimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecimen, setSelectedSpecimen] = useState<LocalSpecimen | null>(null);

  useEffect(() => {
    const loadSpecimens = async () => {
      try {
        await initDB();
        const all = await getAllSpecimens();
        setSpecimens(all);
      } catch (err) {
        console.error('Failed to load specimens:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSpecimens();
  }, []);

  // Filter and sort
  let filtered = [...specimens];

  if (searchQuery) {
    filtered = filtered.filter(
      s =>
        s.extraction?.denomination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.extraction?.countryOfOrigin?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (filterCountry) {
    filtered = filtered.filter(s => s.extraction?.countryOfOrigin === filterCountry);
  }

  if (sortBy === 'country') {
    filtered.sort((a, b) =>
      (a.extraction?.countryOfOrigin || '').localeCompare(
        b.extraction?.countryOfOrigin || ''
      )
    );
  } else if (sortBy === 'value') {
    filtered.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));
  } else {
    filtered.sort((a, b) => b.capturedAt - a.capturedAt);
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-300">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-300">No banknotes found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery || filterCountry ? 'Try adjusting your filters' : 'Start by capturing your first banknote'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">
        Showing {filtered.length} specimen{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(specimen => (
          <BanknoteCard
            key={specimen.id}
            specimen={specimen}
            onClick={() => setSelectedSpecimen(specimen)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedSpecimen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSpecimen(null)}
        >
          <div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedSpecimen.extraction?.countryOfOrigin || 'Unknown'}
                  </h3>
                  <p className="text-gray-300">
                    {selectedSpecimen.extraction?.denomination || 'Unknown Denomination'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSpecimen(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Images */}
              {selectedSpecimen.frontImage && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Front</p>
                  <img
                    src={URL.createObjectURL(selectedSpecimen.frontImage)}
                    alt="Front"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedSpecimen.backImage && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Back</p>
                  <img
                    src={URL.createObjectURL(selectedSpecimen.backImage)}
                    alt="Back"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Details */}
              {selectedSpecimen.extraction && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-xs text-gray-400">Condition</p>
                    <p className="font-semibold text-white">
                      {selectedSpecimen.extraction.conditionGrade || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Serial #</p>
                    <p className="font-semibold text-white text-sm">
                      {selectedSpecimen.extraction.fullSerialNumber || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Pick #</p>
                    <p className="font-semibold text-white">
                      {selectedSpecimen.extraction.pickNumber || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Year</p>
                    <p className="font-semibold text-white">
                      {selectedSpecimen.extraction.issueYear || '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSpecimen.notes && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-xs text-gray-400 mb-2">Notes</p>
                  <p className="text-sm text-gray-200">{selectedSpecimen.notes}</p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedSpecimen(null)}
                className="w-full px-4 py-2 rounded-lg bg-blue-500/30 text-blue-200 hover:bg-blue-500/40 border border-blue-500/50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
