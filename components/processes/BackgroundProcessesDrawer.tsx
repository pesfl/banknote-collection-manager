'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  X, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useBackgroundProcesses } from '@/hooks/useBackgroundProcesses';
import { getCountryFlag } from '@/lib/ai/background-queue';

interface BackgroundProcessesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackgroundProcessesDrawer({
  isOpen,
  onClose,
}: BackgroundProcessesDrawerProps) {
  const {
    status,
    allSpecimens,
    pendingSpecimens,
    extractingSpecimens,
    failedSpecimens,
    completedSpecimens,
    pauseQueue,
    resumeQueue,
    retryFailed,
    clearLogs,
  } = useBackgroundProcesses();

  const [activeTab, setActiveTab] = useState<'queue' | 'logs'>('queue');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'failed' | 'completed'>('all');
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer for active job
  useEffect(() => {
    if (!status.activeJob?.startedAt) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - status.activeJob!.startedAt) / 1000)));
    }, 500);
    return () => clearInterval(timer);
  }, [status.activeJob]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSpecimens = allSpecimens.filter((s) => {
    if (filter === 'active') return s.extractionStatus === 'extracting' || status.activeJob?.specimenId === s.id;
    if (filter === 'pending') return s.extractionStatus === 'pending' || status.queue.includes(s.id);
    if (filter === 'failed') return s.extractionStatus === 'failed';
    if (filter === 'completed') return s.extractionStatus === 'completed';
    return true;
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl h-full bg-white dark:bg-[#0b132b] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              status.isProcessing
                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 animate-pulse'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Background Processes
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  status.isPaused
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : status.isProcessing
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {status.isProcessing && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  {status.isPaused ? 'Paused' : status.isProcessing ? 'Processing' : 'Idle'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI visual recognition queue, valuation API, and sync engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/processes"
              onClick={onClose}
              title="Open full-page processes dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Controls & Live Hero Card */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white space-y-4">
          {/* Active Job Card */}
          {status.activeJob ? (
            <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/40 relative overflow-hidden space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2 text-blue-300 uppercase tracking-wide text-[10px]">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  Active Job In-Progress ({elapsed}s)
                </span>
                <span className="font-mono text-[11px] text-slate-300">
                  ID: {status.activeJob.specimenId.slice(0, 16)}...
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">
                  {status.activeJob.stepDescription}
                </h4>
                {status.activeJob.country && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    {getCountryFlag(status.activeJob.country)} {status.activeJob.country} {status.activeJob.denomination || ''}
                  </p>
                )}
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-linear-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Engine Status
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {status.isPaused
                    ? 'Worker is paused'
                    : pendingSpecimens.length > 0
                    ? `${pendingSpecimens.length} note(s) queued for execution`
                    : 'Queue empty — All specimens up to date'}
                </span>
              </div>
            </div>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">In-Progress</span>
              <span className="text-sm font-bold font-mono text-blue-400">
                {status.isProcessing ? 1 : 0}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Queued</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {status.queueLength}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Completed</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {completedSpecimens.length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Failed</span>
              <span className="text-sm font-bold font-mono text-rose-400">
                {failedSpecimens.length}
              </span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 pt-1">
            {status.isPaused ? (
              <button
                type="button"
                onClick={resumeQueue}
                className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume Processing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseQueue}
                className="flex-1 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Queue</span>
              </button>
            )}

            {failedSpecimens.length > 0 && (
              <button
                type="button"
                onClick={retryFailed}
                className="py-1.5 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry Failed ({failedSpecimens.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'queue'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Specimens Queue ({allSpecimens.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Live Event Log ({status.recentLogs.length})</span>
            </button>
          </div>

          {activeTab === 'logs' && status.recentLogs.length > 0 && (
            <button
              onClick={clearLogs}
              title="Clear event log"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'queue' ? (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'active', 'pending', 'failed', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-medium capitalize text-[11px] transition-colors cursor-pointer shrink-0 ${
                      filter === f
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Specimens List */}
              {filteredSpecimens.length > 0 ? (
                <div className="space-y-2">
                  {filteredSpecimens.map((item) => {
                    const ex = (item.extractedData || {}) as any;
                    const isCurrent = status.activeJob?.specimenId === item.id;
                    const country = ex.countryOfOrigin || ex.country || 'Pending note';
                    const flag = getCountryFlag(country);
                    const denom = ex.denomination || 'Unknown face value';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                            : item.extractionStatus === 'failed'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{flag}</span>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {country} {denom}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                {item.id} • {new Date(item.capturedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 text-right">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                                Extracting...
                              </span>
                            ) : item.extractionStatus === 'completed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                {ex.collectorMarketValue || 'Valued'}
                              </span>
                            ) : item.extractionStatus === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="h-3 w-3" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Clock className="h-3 w-3" />
                                Queued
                              </span>
                            )}
                          </div>
                        </div>

                        {item.extractionError && (
                          <p className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                            Error: {item.extractionError}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No specimens match the &ldquo;{filter}&rdquo; filter.
                </div>
              )}
            </div>
          ) : (
            /* Live Terminal Event Stream */
            <div className="font-mono text-xs rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-300 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-500 text-[10px]">
                <span>STREAM: LIVE CONSOLE LOGS</span>
                <span>{status.recentLogs.length} events logged</span>
              </div>

              {status.recentLogs.length > 0 ? (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {status.recentLogs.map((log) => {
                    const time = new Date(log.timestamp).toLocaleTimeString();
                    return (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 shrink-0">[{time}]</span>
                        <span className={`shrink-0 font-bold ${
                          log.level === 'success'
                            ? 'text-emerald-400'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : log.level === 'error'
                            ? 'text-rose-400'
                            : 'text-blue-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-slate-200 break-words">
                          {log.message}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-600 text-xs">
                  No background events recorded in this session yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
