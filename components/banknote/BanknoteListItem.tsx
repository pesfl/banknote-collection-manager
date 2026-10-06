'use client';

import type { Banknote } from '@/types';

interface BanknoteListItemProps {
  banknote: Banknote;
  imageUrl?: string;
}

export default function BanknoteListItem({ banknote, imageUrl }: BanknoteListItemProps) {
  const gradeColor = (grade?: string) => {
    switch (grade) {
      case 'UNC':
        return 'bg-blue-600';
      case 'AU':
        return 'bg-blue-500';
      case 'XF':
        return 'bg-purple-600';
      case 'VF':
        return 'bg-amber-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
      <div className="grid grid-cols-12 gap-3">
        {/* Left: Image (compact, 2 col) */}
        <div className="col-span-2">
          <div className="w-full aspect-square rounded border border-slate-600 bg-slate-900 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${banknote.countryOfOrigin} ${banknote.denomination}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">📷</span>
            )}
          </div>
        </div>

        {/* Center: Compact Details Grid (7 col) */}
        <div className="col-span-7">
          <div className="grid grid-cols-4 gap-2">
            {/* Country */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">🌍 COUNTRY</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.countryOfOrigin || '—'}</div>
            </div>

            {/* Denomination */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">💵 DENOMINATION</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.denomination || '—'}</div>
            </div>

            {/* Year */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">📅 YEAR</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.issueYear || '—'}</div>
            </div>

            {/* Pick Number */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">🔍 PICK#</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.pickNumber || '—'}</div>
            </div>

            {/* Serial Number */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">🔢 SERIAL</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.fullSerialNumber || '—'}</div>
            </div>

            {/* Prefix */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">🏷️ PREFIX</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.serialPrefix || '—'}</div>
            </div>

            {/* Series */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">📋 SERIES</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.seriesDate || '—'}</div>
            </div>

            {/* Signatures */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">✍️ SIGNATURES</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.signature1Name || '—'}</div>
            </div>

            {/* Special Features */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">✨ FEATURES</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.securityFeatures ? 'Yes' : 'No'}</div>
            </div>

            {/* Condition */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">🎯 CONDITION</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.conditionGrade || '—'}</div>
            </div>

            {/* Watermark */}
            <div className="bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">💧 WATERMARK</div>
              <div className="text-xs text-white mt-0.5 truncate font-medium">{banknote.watermarks || '—'}</div>
            </div>

            {/* Notes - Full width */}
            <div className="col-span-4 bg-slate-700 rounded p-1.5">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">📝 NOTES</div>
              <div className="text-xs text-white mt-0.5 line-clamp-2 font-medium">{banknote.notes || '—'}</div>
            </div>
          </div>
        </div>

        {/* Right: Grade and Values (3 col) */}
        <div className="col-span-3 space-y-2">
          {/* Grade Box */}
          <div className={`${gradeColor(banknote.conditionGrade)} rounded-lg p-2.5 text-center text-white`}>
            <div className="text-xs opacity-75 font-semibold">Grade</div>
            <div className="text-2xl font-bold leading-none">{banknote.conditionGrade || '?'}</div>
          </div>

          {/* Values Section */}
          <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-2 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">VALUES (USD)</div>

            {/* PMG Value */}
            {banknote.numistaPmgValue ? (
              <div className="bg-blue-900/60 border border-blue-700 rounded p-1.5">
                <div className="text-xs text-slate-300 font-semibold">PMG VALUE</div>
                <div className="text-sm font-bold text-blue-300">{banknote.numistaPmgValue}</div>
              </div>
            ) : (
              <div className="bg-slate-600/50 rounded p-1.5">
                <div className="text-xs text-slate-400 font-semibold">PMG VALUE</div>
                <div className="text-xs text-slate-500">Unknown</div>
              </div>
            )}

            {/* Numista Value */}
            {banknote.collectorMarketValue ? (
              <div className="bg-green-900/60 border border-green-700 rounded p-1.5">
                <div className="text-xs text-slate-300 font-semibold">NUMISTA VALUE</div>
                <div className="text-sm font-bold text-green-300">{banknote.collectorMarketValue}</div>
              </div>
            ) : (
              <div className="bg-slate-600/50 rounded p-1.5">
                <div className="text-xs text-slate-400 font-semibold">NUMISTA VALUE</div>
                <div className="text-xs text-slate-500">Unknown</div>
              </div>
            )}

            {/* Collector Market Value */}
            <div className="bg-amber-900/60 border border-amber-700 rounded p-1.5">
              <div className="text-xs text-slate-300 font-semibold">COLLECTOR'S MARKET</div>
              <div className="text-sm font-bold text-amber-300">
                {banknote.acquisitionDate
                  ? new Date(banknote.acquisitionDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
