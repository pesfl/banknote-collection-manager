'use client';

import { useState } from 'react';
import type { Banknote } from '@/types';

interface BanknoteListItemProps {
  banknote: Banknote;
  imageUrl?: string;
}

export default function BanknoteListItem({ banknote, imageUrl }: BanknoteListItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex gap-6">
        {/* Left: Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${banknote.countryOfOrigin} ${banknote.denomination}`}
              className="w-56 h-32 object-cover rounded-lg border-2 border-blue-500"
            />
          ) : (
            <div className="w-56 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-blue-500 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Center: Details */}
        <div className="flex-1">
          {/* Country & Denomination */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h3 className="text-xl font-bold">{banknote.countryOfOrigin || 'Unknown'}</h3>
                <p className="text-lg opacity-90">{banknote.denomination || 'Unknown Denomination'}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* Year */}
            {banknote.issueYear && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">📅</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">YEAR</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{banknote.issueYear}</p>
                </div>
              </div>
            )}

            {/* Pick Number */}
            {banknote.pickNumber && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">#️⃣</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">PICK NUMBER</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{banknote.pickNumber}</p>
                </div>
              </div>
            )}

            {/* Serial Number */}
            {banknote.fullSerialNumber && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔢</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">SERIAL NUMBER</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{banknote.fullSerialNumber}</p>
                </div>
              </div>
            )}

            {/* Prefix */}
            {banknote.serialPrefix && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">🔤</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">PREFIX</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{banknote.serialPrefix}</p>
                </div>
              </div>
            )}

            {/* Series */}
            {banknote.seriesDate && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">📆</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">SERIES</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{banknote.seriesDate}</p>
                </div>
              </div>
            )}

            {/* Signatures */}
            {(banknote.signature1Name || banknote.signature2Name) && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">✍️</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">SIGNATURES</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">
                    {banknote.signature1Name} | {banknote.signature2Name}
                  </p>
                </div>
              </div>
            )}

            {/* Watermark */}
            {banknote.watermarks && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">💧</span>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">WATERMARK</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">{banknote.watermarks}</p>
                </div>
              </div>
            )}

            {/* Replacement */}
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">⭐</span>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">REPLACEMENT</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {banknote.isReplacementNote ? 'Yes' : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {banknote.notes && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">NOTES & FEATURES</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{banknote.notes}</p>
                </div>
              )}
              {banknote.defectsAndAnomalies && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">DEFECTS & ANOMALIES</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{banknote.defectsAndAnomalies}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Valuation & Info */}
        <div className="flex-shrink-0 w-64">
          {/* Grade Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-4 text-center">
            <p className="text-xs opacity-75 mb-2">GRADE</p>
            <p className="text-3xl font-bold">{banknote.conditionGrade || 'Unknown'}</p>
            {banknote.conditionGrade && (
              <p className="text-xs opacity-75 mt-1">
                {banknote.conditionGrade === 'UNC' && 'Uncirculated'}
                {banknote.conditionGrade === 'AU' && 'Almost Uncirculated'}
                {banknote.conditionGrade === 'XF' && 'Extra Fine'}
                {banknote.conditionGrade === 'VF' && 'Very Fine'}
                {banknote.conditionGrade === 'F' && 'Fine'}
                {banknote.conditionGrade === 'VG' && 'Very Good'}
                {banknote.conditionGrade === 'G' && 'Good'}
              </p>
            )}
          </div>

          {/* Values Section */}
          <div className="space-y-3">
            {/* PMG Value */}
            {banknote.numistaPmgValue && (
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                <p className="text-xs opacity-75 mb-1">PMG VALUE</p>
                <p className="text-2xl font-bold">{banknote.numistaPmgValue}</p>
              </div>
            )}

            {/* Numista Value */}
            {banknote.collectorMarketValue && (
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4">
                <p className="text-xs opacity-75 mb-1">COLLECTOR MARKET VALUE</p>
                <p className="text-2xl font-bold">{banknote.collectorMarketValue}</p>
              </div>
            )}

            {/* Source & Info */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-4">
              <p className="text-xs opacity-75 mb-2">SOURCE & INFO</p>
              <div className="text-xs space-y-1">
                <p>📊 PMG / NumisMaster</p>
                <p>✓ Verified</p>
                {banknote.acquisitionDate && (
                  <p>📅 {new Date(banknote.acquisitionDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        {expanded ? '▼ Hide Details' : '▶ Show Details'}
      </button>
    </div>
  );
}
