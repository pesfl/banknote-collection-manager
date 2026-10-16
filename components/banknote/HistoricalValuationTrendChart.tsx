'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  PlusCircle, 
  History, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import type { ValuationLogRecord } from '@/types';

interface HistoricalValuationTrendChartProps {
  banknoteId: string;
  purchasePrice?: number | null;
  acquisitionDate?: string | Date | null;
  currentValue?: string | null;
  initialLogs?: ValuationLogRecord[];
  onLogAdded?: (log: ValuationLogRecord) => void;
}

export function HistoricalValuationTrendChart({
  banknoteId,
  purchasePrice,
  acquisitionDate,
  currentValue,
  initialLogs,
  onLogAdded,
}: HistoricalValuationTrendChartProps) {
  const [logs, setLogs] = useState<ValuationLogRecord[]>(initialLogs || []);
  const [isLoading, setIsLoading] = useState(!initialLogs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Form State for manual historical entry
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newValue, setNewValue] = useState('');
  const [newSource, setNewSource] = useState('Manual Portfolio Review');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch history if not provided
  useEffect(() => {
    if (!banknoteId) return;
    let isMounted = true;

    async function fetchHistory() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/valuation/history/${banknoteId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.history)) {
            setLogs(data.history);
          }
        }
      } catch (err) {
        console.warn('Failed to load valuation history:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [banknoteId]);

  // Parse numeric current value
  const numericCurrent = useMemo(() => {
    if (!currentValue) return null;
    const num = parseFloat(currentValue.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  }, [currentValue]);

  // Synthesize chart data points including acquisition cost basis and historical logs
  const chartPoints = useMemo(() => {
    const points: Array<{
      date: Date;
      dateLabel: string;
      value: number;
      valueLabel: string;
      source: string;
      notes?: string | null;
      isCostBasis?: boolean;
    }> = [];

    // 1. Add cost basis as first point if present
    if (purchasePrice && purchasePrice > 0) {
      const acqDate = acquisitionDate ? new Date(acquisitionDate) : new Date(Date.now() - 365 * 24 * 3600 * 1000);
      points.push({
        date: acqDate,
        dateLabel: acqDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        value: purchasePrice,
        valueLabel: `$${purchasePrice.toFixed(2)}`,
        source: 'Acquisition Cost Basis',
        isCostBasis: true,
      });
    }

    // 2. Add recorded valuation logs
    logs.forEach((log) => {
      const valStr = log.estimatedValue || log.ebayValue || log.numistaValue;
      if (!valStr) return;
      const num = parseFloat(valStr.replace(/[^0-9.]/g, ''));
      if (isNaN(num) || num <= 0) return;

      const d = new Date(log.createdAt);
      points.push({
        date: d,
        dateLabel: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        value: num,
        valueLabel: `$${num.toFixed(2)}`,
        source: log.source,
        notes: log.notes,
        isCostBasis: false,
      });
    });

    // 3. If no points yet, but current value exists, add today's snapshot
    if (points.length === 0 && numericCurrent && numericCurrent > 0) {
      const now = new Date();
      points.push({
        date: now,
        dateLabel: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        value: numericCurrent,
        valueLabel: `$${numericCurrent.toFixed(2)}`,
        source: 'Current Consensus Baseline',
        isCostBasis: false,
      });
    }

    // Sort chronologically
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [logs, purchasePrice, acquisitionDate, numericCurrent]);

  // Overall Gain / Loss Calculation
  const gainMetrics = useMemo(() => {
    if (!purchasePrice || purchasePrice <= 0 || !numericCurrent) return null;
    const diff = numericCurrent - purchasePrice;
    const pct = (diff / purchasePrice) * 100;
    return {
      diff: diff >= 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`,
      pct: `${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      isPositive: diff >= 0,
    };
  }, [purchasePrice, numericCurrent]);

  // Handle Manual Log Submission
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(newValue.replace(/[^0-9.]/g, ''));
    if (isNaN(valNum) || valNum <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/valuation/history/${banknoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedValue: `$${valNum.toFixed(2)}`,
          source: newSource,
          notes: newNotes,
          createdAt: new Date(newDate).toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setLogs(data.history);
        }
        if (onLogAdded && data.log) {
          onLogAdded(data.log);
        }
        setIsModalOpen(false);
        setNewValue('');
        setNewNotes('');
      }
    } catch (err) {
      console.warn('Failed to add historical valuation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Chart Geometry
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const { pathD, areaD, pointCoords, minVal, maxVal } = useMemo(() => {
    if (chartPoints.length < 2) {
      return { pathD: '', areaD: '', pointCoords: [], minVal: 0, maxVal: 0 };
    }

    const values = chartPoints.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const margin = (rawMax - rawMin) * 0.15 || rawMax * 0.1 || 1.0;
    const minVal = Math.max(0, Math.floor((rawMin - margin) * 10) / 10);
    const maxVal = Math.ceil((rawMax + margin) * 10) / 10;

    const valRange = maxVal - minVal || 1.0;
    const timeStart = chartPoints[0].date.getTime();
    const timeEnd = chartPoints[chartPoints.length - 1].date.getTime();
    const timeRange = timeEnd - timeStart || 1;

    const coords = chartPoints.map((p, idx) => {
      // Evenly distribute if all timestamps are identical
      const tFraction = timeRange > 0 ? (p.date.getTime() - timeStart) / timeRange : idx / (chartPoints.length - 1);
      const x = paddingX + tFraction * (svgWidth - paddingX * 2);
      const yFraction = (p.value - minVal) / valRange;
      const y = svgHeight - paddingY - yFraction * (svgHeight - paddingY * 2);
      return { ...p, x, y };
    });

    // Build SVG path
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const area = `${path} L ${coords[coords.length - 1].x} ${svgHeight - paddingY} L ${coords[0].x} ${svgHeight - paddingY} Z`;

    return { pathD: path, areaD: area, pointCoords: coords, minVal, maxVal };
  }, [chartPoints]);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Historical Valuation Trend</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {logs.length} Logged Events
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Appreciation trajectory over time relative to cost basis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gainMetrics && (
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
              gainMetrics.isPositive 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {gainMetrics.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{gainMetrics.diff} ({gainMetrics.pct})</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Point</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="p-4 sm:p-5">
        {chartPoints.length >= 2 ? (
          <div className="relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="4 4"
              />
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />

              {/* Y-axis Labels */}
              <text
                x={paddingX - 6}
                y={paddingY + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                ${maxVal.toFixed(0)}
              </text>
              <text
                x={paddingX - 6}
                y={svgHeight - paddingY}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                ${minVal.toFixed(0)}
              </text>

              {/* Area & Path Curve */}
              <path d={areaD} fill="url(#trendGradient)" />
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Point Circles */}
              {pointCoords.map((pt, idx) => (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === pt ? 6 : 4}
                    fill={pt.isCostBasis ? '#3b82f6' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute z-10 px-3 py-2 rounded-xl bg-slate-900 text-white shadow-xl text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full border border-slate-700 animate-in fade-in duration-100"
                style={{
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                  top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                  marginTop: '-12px',
                }}
              >
                <div className="font-bold text-emerald-400 font-mono text-sm">{hoveredPoint.valueLabel}</div>
                <div className="text-[10px] text-slate-300 font-medium">{hoveredPoint.dateLabel}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{hoveredPoint.source}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>Single valuation data point currently recorded ({chartPoints[0]?.valueLabel || '$0.00'}).</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Re-evaluating or clicking &quot;Add Point&quot; creates an interactive trend trajectory.
            </p>
          </div>
        )}

        {/* Chronological Valuation Log Table */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Chronological Valuation Audit Trail:
          </span>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {chartPoints.map((pt, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${pt.isCostBasis ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {pt.source}
                    </span>
                    <span className="text-[10px] text-slate-400">{pt.dateLabel}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold font-mono text-slate-900 dark:text-white block">
                    {pt.valueLabel}
                  </span>
                  {pt.notes && (
                    <span className="text-[10px] text-slate-500 italic block">{pt.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Historical Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-500" />
                <span>Log Historical Valuation Point</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Valuation / Price Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Valuation Amount (USD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $25.00"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Evidence Source
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Manual Portfolio Review">Manual Portfolio Review</option>
                  <option value="Heritage Auctions Realized Sale">Heritage Auctions Realized Sale</option>
                  <option value="Stack's Bowers Auction Floor">Stack&apos;s Bowers Auction Floor</option>
                  <option value="eBay Completed Transaction">eBay Completed Transaction</option>
                  <option value="Physical Coin Show Purchase">Physical Coin Show Purchase</option>
                  <option value="Certified PMG Insurance Appraisal">Certified PMG Insurance Appraisal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Notes / Provenance Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lot #412 hammer price before juice"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log Point'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
