'use client';

import { useMemo } from 'react';
import type { LocalSpecimen } from '@/types';

interface BanknoteCardProps {
  specimen: LocalSpecimen;
  onClick: () => void;
}

export default function BanknoteCard({ specimen, onClick }: BanknoteCardProps) {
  const displayImage = useMemo(() => {
    if (specimen.frontImageBlob) {
      return URL.createObjectURL(specimen.frontImageBlob);
    }
    return null;
  }, [specimen.frontImageBlob]);

  const relativeTime = useMemo(() => {
    const now = Date.now();
    const diff = now - specimen.capturedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(specimen.capturedAt).toLocaleDateString();
  }, [specimen.capturedAt]);

  const syncStatus = specimen.syncStatus === 'synced' ? '☁️' : '📍';

  return (
    <button
      onClick={onClick}
      className="group w-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden hover:border-white/40 hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 text-left"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-40 bg-black/40">
        {displayImage ? (
          <img
            src={displayImage}
            alt={specimen.extraction?.denomination || 'Banknote'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            📷
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-black/50 backdrop-blur text-white border border-white/30">
            {syncStatus}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-bold text-white text-lg group-hover:text-blue-200 transition-colors">
            {specimen.extraction?.countryOfOrigin || 'Unknown'}
          </h3>
          <p className="text-sm text-gray-300">
            {specimen.extraction?.denomination || 'Unknown Denomination'}
          </p>
        </div>

        {/* Details Grid */}
        {specimen.extraction && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Condition</p>
              <p className="font-semibold text-green-300">
                {specimen.extraction.conditionGrade || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Pick #</p>
              <p className="font-semibold text-purple-300">
                {specimen.extraction.pickNumber || '—'}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-gray-400">{relativeTime}</span>
          <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
            View →
          </span>
        </div>
      </div>
    </button>
  );
}
