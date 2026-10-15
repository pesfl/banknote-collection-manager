'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Layers, 
  Sparkles, 
  Trash2, 
  Cloud, 
  Wifi, 
  Cpu, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useBackgroundProcesses } from '@/hooks/useBackgroundProcesses';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getCountryFlag } from '@/lib/ai/background-queue';

export default function BackgroundProcessesPage() {
  const {
    status,
    allSpecimens,
    pendingSpecimens,
    failedSpecimens,
    completedSpecimens,
    pauseQueue,
    resumeQueue,
    retryFailed,
    clearLogs,
    refreshSpecimens,
  } = useBackgroundProcesses();

  const { networkStatus, isSyncing, syncNow } = useOfflineSync();
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'failed' | 'completed'>('all');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');
  const [elapsed, setElapsed] = useState(0);

  // Active elapsed timer
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

  const filteredSpecimens = allSpecimens.filter((s) => {
    if (filter === 'active') return s.extractionStatus === 'extracting' || status.activeJob?.specimenId === s.id;
    if (filter === 'pending') return s.extractionStatus === 'pending' || status.queue.includes(s.id);
    if (filter === 'failed') return s.extractionStatus === 'failed';
    if (filter === 'completed') return s.extractionStatus === 'completed';
    return true;
  });

  const filteredLogs = status.recentLogs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.level === logFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              status.isProcessing
                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 animate-pulse'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Background Process Monitor
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time queue tracking for Gemini Vision recognition, valuation engines, and Cloudflare R2 sync.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {status.isPaused ? (
            <button
              type="button"
              onClick={resumeQueue}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume Worker</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseQueue}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause Queue</span>
            </button>
          )}

          {failedSpecimens.length > 0 && (
            <button
              type="button"
              onClick={retryFailed}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry All Failed ({failedSpecimens.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl bg-white dark:bg-[#0c1633] p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Engine State</span>
            <Cpu className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
            {status.isPaused ? (
              <span className="text-amber-500">PAUSED</span>
            ) : status.isProcessing ? (
              <span className="text-emerald-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE
              </span>
            ) : (
              <span className="text-slate-400">IDLE</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Gemini 3.5 Flash Multimodal
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0c1633] p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>In Queue</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500">
            {status.queueLength}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Awaiting processing
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0c1633] p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {completedSpecimens.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Successfully identified & valued
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0c1633] p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Failed / Errors</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500">
            {failedSpecimens.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Need attention or retry
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0c1633] p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Cloud & Sync</span>
            <Cloud className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-400 flex items-center gap-1.5">
            {networkStatus.isOnline ? 'Online' : 'Offline'}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isSyncing ? 'Syncing to Cloudflare R2...' : 'IndexedDB local storage active'}
          </span>
        </div>
      </div>

      {/* Active Job Spotlight Card */}
      {status.activeJob && (
        <div className="rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white border border-blue-500/40 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-blue-400" />
              Active Job Spotlight — Elapsed: {elapsed} seconds
            </span>
            <span className="text-xs font-mono text-slate-300">
              Specimen ID: {status.activeJob.specimenId}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">
              {status.activeJob.stepDescription}
            </h3>
            {status.activeJob.country && (
              <p className="text-sm text-slate-300 mt-1">
                {getCountryFlag(status.activeJob.country)} {status.activeJob.country} {status.activeJob.denomination || ''}
              </p>
            )}
          </div>

          {/* Animated 5-step Pipeline indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>1. Image Cleaning</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${status.activeJob.step === 'extracting' ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>2. Gemini 3.5 Flash</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${status.activeJob.step === 'evaluating' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
              <span>3. Numista & eBay</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span>4. Consensus Save</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Layout: Left Queue Table / Right Event Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specimen Queue Table */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#0c1633] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Specimen Processing Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status across all captured banknotes in local IndexedDB.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'active', 'pending', 'completed', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-[11px] font-semibold transition-colors cursor-pointer ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Queue List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredSpecimens.length > 0 ? (
              filteredSpecimens.map((item) => {
                const ex = (item.extractedData || {}) as any;
                const isCurrent = status.activeJob?.specimenId === item.id;
                const country = ex.countryOfOrigin || ex.country || 'Pending note';
                const flag = getCountryFlag(country);
                const denom = ex.denomination || 'Unknown value';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20'
                        : item.extractionStatus === 'failed'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{flag}</span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {country} {denom} {ex.issueYear ? `(${ex.issueYear})` : ''}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            {item.id} • Pick: {ex.pickNumber || 'Pending'} • Grade: {ex.conditionGrade || 'UNC'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                            Analyzing...
                          </span>
                        ) : item.extractionStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                            <CheckCircle2 className="h-3 w-3" />
                            {ex.collectorMarketValue || 'Valued'}
                          </span>
                        ) : item.extractionStatus === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="h-3 w-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <Clock className="h-3 w-3" />
                            Queued
                          </span>
                        )}
                      </div>
                    </div>

                    {item.extractionError && (
                      <p className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                        Error: {item.extractionError}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                No specimens match the &ldquo;{filter}&rdquo; filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Event Console Log */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-950 p-5 sm:p-6 border border-slate-800 shadow-2xs space-y-4 text-slate-300 font-mono text-xs flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-sans">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Live Event Console
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="px-2 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-slate-300 outline-none"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="success">Success Only</option>
                <option value="info">Info Only</option>
              </select>

              {status.recentLogs.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  title="Clear event logs"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Console Log Rows */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[550px]">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                return (
                  <div key={log.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                    <span className="text-slate-600 shrink-0">[{time}]</span>
                    <span className={`shrink-0 font-bold text-[10px] px-1.5 py-0.2 rounded ${
                      log.level === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.level === 'warn'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : log.level === 'error'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-slate-200 break-words flex-1">
                      {log.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center text-slate-600 text-xs">
                No events recorded matching filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
