'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Banknote } from '@/types';

interface BanknoteListItemProps {
  banknote: Banknote;
  imageUrl?: string;
}

export default function BanknoteListItem({ banknote, imageUrl }: BanknoteListItemProps) {
  const [expanded, setExpanded] = useState(false);

  const gradeColor = (grade?: string) => {
    switch (grade) {
      case 'UNC':
        return 'bg-emerald-500';
      case 'AU':
        return 'bg-blue-500';
      case 'XF':
        return 'bg-purple-500';
      case 'VF':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-slate-900 border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{banknote.countryOfOrigin || 'Unknown'}</h3>
            <p className="text-lg text-slate-300 mt-1">{banknote.denomination || 'Unknown'}</p>
          </div>
          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-500/20 border-blue-500/50 text-blue-300">
            ★ {banknote.conditionGrade || 'N/A'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-xs h-48 rounded-lg border-2 border-blue-500/30 bg-slate-800 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${banknote.countryOfOrigin} ${banknote.denomination}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">📷</span>
              )}
            </div>
          </div>

          {/* Center: Details */}
          <div className="lg:col-span-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {banknote.issueYear && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-sm font-semibold text-blue-400">YEAR</span>
                  <span className="text-sm text-slate-300">{banknote.issueYear}</span>
                </div>
              )}

              {banknote.pickNumber && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-sm font-semibold text-blue-400">#</span>
                  <span className="text-sm text-slate-300">{banknote.pickNumber}</span>
                </div>
              )}

              {banknote.fullSerialNumber && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-xs font-semibold text-blue-400">SERIAL</span>
                  <span className="text-xs text-slate-300 truncate">{banknote.fullSerialNumber}</span>
                </div>
              )}

              {banknote.serialPrefix && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-sm font-semibold text-blue-400">PREFIX</span>
                  <span className="text-sm text-slate-300">{banknote.serialPrefix}</span>
                </div>
              )}

              {banknote.seriesDate && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-xs font-semibold text-blue-400">SERIES</span>
                  <span className="text-xs text-slate-300">{banknote.seriesDate}</span>
                </div>
              )}

              {banknote.signature1Name && (
                <div className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800">
                  <span className="text-xs font-semibold text-blue-400">SIG</span>
                  <span className="text-xs text-slate-300 truncate">{banknote.signature1Name}</span>
                </div>
              )}
            </div>

            {banknote.watermarks && (
              <div className="px-3 py-2 rounded bg-slate-800">
                <span className="text-xs font-semibold text-blue-400">WATERMARK</span>
                <p className="text-sm text-slate-300 mt-1">{banknote.watermarks}</p>
              </div>
            )}
          </div>

          {/* Right: Valuation */}
          <div className="lg:col-span-1 space-y-3">
            {/* Grade Card */}
            <div className={`${gradeColor(banknote.conditionGrade)} rounded-lg p-6 text-white text-center`}>
              <div className="text-xs opacity-75 mb-2 font-semibold">GRADE</div>
              <div className="text-4xl font-bold">{banknote.conditionGrade || 'UNC'}</div>
              <div className="text-xs opacity-75 mt-2">
                {banknote.conditionGrade === 'UNC' && 'Uncirculated'}
                {banknote.conditionGrade === 'AU' && 'Almost Uncirculated'}
                {banknote.conditionGrade === 'XF' && 'Extra Fine'}
                {banknote.conditionGrade === 'VF' && 'Very Fine'}
                {!['UNC', 'AU', 'XF', 'VF'].includes(banknote.conditionGrade || '') && 'Specimen Grade'}
              </div>
            </div>

            {/* PMG Value */}
            {banknote.numistaPmgValue && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-white">
                <div className="text-xs opacity-75 mb-2 font-semibold">PMG VALUE</div>
                <div className="text-2xl font-bold text-emerald-400">{banknote.numistaPmgValue}</div>
              </div>
            )}

            {/* Market Value */}
            {banknote.collectorMarketValue && (
              <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 text-white">
                <div className="text-xs opacity-75 mb-2 font-semibold">COLLECTOR MARKET VALUE</div>
                <div className="text-2xl font-bold text-amber-400">{banknote.collectorMarketValue}</div>
              </div>
            )}

            {/* Source */}
            <div className="bg-teal-500/20 border border-teal-500/50 rounded-lg p-4 text-white text-sm space-y-1">
              <div className="text-xs opacity-75 font-semibold mb-2">SOURCE & INFO</div>
              <div>📊 PMG / NumisMaster</div>
              <div>✓ Verified</div>
              {banknote.acquisitionDate && (
                <div>📅 {new Date(banknote.acquisitionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {(banknote.notes || banknote.defectsAndAnomalies) && (
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {expanded ? '▼ Hide Details' : '▶ Show Details'}
            </button>

            {expanded && (
              <div className="mt-4 space-y-4">
                {banknote.notes && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold mb-2">NOTES & FEATURES</p>
                    <p className="text-sm text-slate-300">{banknote.notes}</p>
                  </div>
                )}
                {banknote.defectsAndAnomalies && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold mb-2">DEFECTS & ANOMALIES</p>
                    <p className="text-sm text-slate-300">{banknote.defectsAndAnomalies}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
