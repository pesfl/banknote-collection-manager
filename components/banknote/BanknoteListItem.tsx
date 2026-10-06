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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="grid grid-cols-12 gap-3">
        {/* Left: Image (compact, 2 col) */}
        <div className="col-span-2">
          <div className="w-full aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${banknote.countryOfOrigin} ${banknote.denomination}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-slate-400">📷</span>
            )}
          </div>
        </div>

        {/* Center: Compact Details Grid (7 col) */}
        <div className="col-span-7">
          <div className="grid grid-cols-4 gap-2">
            {/* Country */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">🌍 COUNTRY</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.countryOfOrigin || '—'}</div>
            </div>

            {/* Denomination */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">💵 VALUE</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.denomination || '—'}</div>
            </div>

            {/* Year */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">📅 YEAR</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.issueYear || '—'}</div>
            </div>

            {/* Pick Number */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">🔍 PICK#</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.pickNumber || '—'}</div>
            </div>

            {/* Serial Number */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">🔢 SERIAL</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.fullSerialNumber || '—'}</div>
            </div>

            {/* Prefix */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">🏷️ PREFIX</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.serialPrefix || '—'}</div>
            </div>

            {/* Series */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">📋 SERIES</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.seriesDate || '—'}</div>
            </div>

            {/* Signatures */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">✍️ SIGNATURES</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.signature1Name || '—'}</div>
            </div>

            {/* Special Features */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">✨ FEATURES</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.securityFeatures ? 'Yes' : 'No'}</div>
            </div>

            {/* Condition */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">🎯 CONDITION</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.conditionGrade || '—'}</div>
            </div>

            {/* Watermark */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">💧 WATERMARK</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 truncate font-medium">{banknote.watermarks || '—'}</div>
            </div>

            {/* Notes - Full width */}
            <div className="col-span-4 bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700/50">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">📝 NOTES</div>
              <div className="text-xs text-slate-900 dark:text-slate-100 mt-0.5 line-clamp-2 font-medium">{banknote.notes || '—'}</div>
            </div>
          </div>
        </div>

        {/* Right: Grade and Values (3 col) */}
        <div className="col-span-3 space-y-2">
          {/* Grade Box */}
          <div className={`${gradeColor(banknote.conditionGrade)} rounded-lg p-2.5 text-center text-white shadow-sm`}>
            <div className="text-xs opacity-80 font-semibold">Grade</div>
            <div className="text-2xl font-extrabold leading-tight">{banknote.conditionGrade || '?'}</div>
          </div>

          {/* Values Section */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estimated Values</div>

            {/* PMG Value */}
            {banknote.numistaPmgValue ? (
              <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-lg p-1.5">
                <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold">PMG VALUE</div>
                <div className="text-sm font-bold text-blue-900 dark:text-blue-200">{banknote.numistaPmgValue}</div>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">PMG VALUE</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Unknown</div>
              </div>
            )}

            {/* Numista Value */}
            {banknote.collectorMarketValue ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-1.5">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">NUMISTA VALUE</div>
                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{banknote.collectorMarketValue}</div>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">NUMISTA VALUE</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Unknown</div>
              </div>
            )}

            {/* Collector Market Value */}
            <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-lg p-1.5">
              <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">COLLECTOR'S MARKET</div>
              <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
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
