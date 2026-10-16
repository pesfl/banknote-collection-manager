'use client';

import React, { useState, useRef } from 'react';
import worldMapData from '@/lib/data/world-map-paths.json';
import { getCountryFlagByCode } from '@/lib/utils/country-matcher';
import { Info } from 'lucide-react';

export interface CountryStat {
  code: string;
  name: string;
  continent: string;
  flag: string;
  count: number;
  totalValue: number;
  uniquePicks: string[];
  denominations: string[];
}

interface InteractiveWorldHeatmapProps {
  countryStats: Record<string, CountryStat>;
  selectedCountryCode?: string | null;
  onSelectCountry?: (code: string, stat?: CountryStat) => void;
  metricMode?: 'COUNT' | 'VALUE';
}

export function InteractiveWorldHeatmap({
  countryStats,
  selectedCountryCode,
  onSelectCountry,
  metricMode = 'COUNT',
}: InteractiveWorldHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hovered country state for tooltip
  const [hoveredCountry, setHoveredCountry] = useState<{
    code: string;
    name: string;
    continent: string;
    stat?: CountryStat;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Color resolver based on note count or portfolio value
  const getCountryFill = (code: string, isSelected: boolean) => {
    if (isSelected) {
      return '#38bdf8'; // Sky 400 for selected
    }

    const stat = countryStats[code];
    if (!stat || (metricMode === 'COUNT' ? stat.count <= 0 : stat.totalValue <= 0)) {
      return undefined; // use default theme slate
    }

    if (metricMode === 'COUNT') {
      if (stat.count >= 10) return '#059669'; // Emerald 600
      if (stat.count >= 6) return '#10b981';  // Emerald 500
      if (stat.count >= 3) return '#34d399';  // Emerald 400
      return '#6ee7b7';                      // Emerald 300
    } else {
      if (stat.totalValue >= 500) return '#eab308'; // Gold / Amber
      if (stat.totalValue >= 200) return '#059669'; // Emerald 600
      if (stat.totalValue >= 50) return '#10b981';  // Emerald 500
      return '#34d399';                             // Emerald 400
    }
  };

  // Country hover
  const handleCountryHover = (
    e: React.MouseEvent,
    country: { code: string; name: string; continent: string }
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setHoveredCountry({
      code: country.code,
      name: country.name,
      continent: country.continent,
      stat: countryStats[country.code],
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    });
  };

  const handleCountryClick = (code: string) => {
    if (onSelectCountry) {
      onSelectCountry(code, countryStats[code]);
    }
  };

  return (
    <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-linear-to-b from-white via-slate-50/50 to-white dark:from-slate-900/90 dark:via-[#0c142c] dark:to-slate-900/90 overflow-hidden shadow-xs">
      {/* Stable Map Viewport Canvas */}
      <div 
        ref={containerRef}
        onMouseLeave={() => setHoveredCountry(null)}
        className="relative w-full aspect-[2.05/1] min-h-[340px] max-h-[640px] bg-slate-100/50 dark:bg-[#070d1e] overflow-hidden flex items-center justify-center select-none"
      >
        {/* SVG World Map tightly scaled to 0 0 700 340 without empty borders */}
        <svg
          viewBox="0 0 700 340"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full pointer-events-auto"
        >
          <g>
            {worldMapData.countries.map((country: any) => {
              const code = country.code;
              const stat = countryStats[code];
              const hasNotes = stat && stat.count > 0;
              const isSelected = selectedCountryCode === code;
              const dynamicFill = getCountryFill(code, isSelected);

              return (
                <path
                  key={country.id}
                  id={country.id}
                  d={country.d}
                  fill={dynamicFill}
                  stroke={isSelected ? '#0284c7' : hasNotes ? '#047857' : '#94a3b8'}
                  strokeWidth={isSelected ? '1.5' : hasNotes ? '0.85' : '0.4'}
                  className={`transition-colors duration-150 cursor-pointer ${
                    !dynamicFill
                      ? 'fill-slate-200/90 dark:fill-slate-800/90 hover:fill-slate-300 dark:hover:fill-slate-700'
                      : 'hover:brightness-110'
                  }`}
                  onMouseMove={(e) => handleCountryHover(e, country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => handleCountryClick(code)}
                />
              );
            })}
          </g>
        </svg>

        {/* Floating Tooltip */}
        {hoveredCountry && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs animate-in fade-in duration-100 transform -translate-x-1/2 -translate-y-full min-w-44"
            style={{
              left: `${hoveredCountry.screenX}px`,
              top: `${hoveredCountry.screenY - 12}px`,
            }}
          >
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-700/80 mb-1.5">
              <span className="text-lg">{getCountryFlagByCode(hoveredCountry.code)}</span>
              <div>
                <h4 className="font-bold text-slate-100 leading-tight">
                  {hoveredCountry.name}
                </h4>
                <span className="text-[10px] text-slate-400">{hoveredCountry.continent}</span>
              </div>
            </div>

            {hoveredCountry.stat && hoveredCountry.stat.count > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold font-mono">
                  <span>{hoveredCountry.stat.count} {hoveredCountry.stat.count === 1 ? 'Banknote' : 'Banknotes'}</span>
                  <span>${hoveredCountry.stat.totalValue.toFixed(2)}</span>
                </div>
                {hoveredCountry.stat.uniquePicks.length > 0 && (
                  <div className="text-[10px] text-slate-300">
                    Picks: <span className="font-mono text-cyan-300">{hoveredCountry.stat.uniquePicks.slice(0, 3).join(', ')}</span>
                  </div>
                )}
                <div className="text-[9px] text-emerald-400/90 pt-0.5">
                  ✓ Click to inspect specimens
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                No banknotes owned yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Legend Bar */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span>Click any country on the map to filter specimens below.</span>
        </div>

        {/* Color Key */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            {metricMode === 'COUNT' ? 'Volume Density:' : 'Portfolio Value ($):'}
          </span>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-sm bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" title="0 Notes" />
            <span className="text-[10px] text-slate-400">0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-sm bg-emerald-300" title="1-2 Notes" />
            <span className="text-[10px] text-slate-400">1–2</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-sm bg-emerald-400" title="3-5 Notes" />
            <span className="text-[10px] text-slate-400">3–5</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-sm bg-emerald-500" title="6-10 Notes" />
            <span className="text-[10px] text-slate-400">6–10</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-3.5 rounded-sm bg-emerald-600" title="10+ Notes" />
            <span className="text-[10px] text-slate-400">11+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
