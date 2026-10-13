'use client';

import React, { useState, useEffect } from 'react';
import { getStorageStats, clearAllSpecimens, clearAllSyncData } from '@/lib/offline/idb';
import { 
  Settings as SettingsIcon, 
  Database, 
  Trash2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Sparkles,
  Info,
  Server,
  Cloud,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [stats, setStats] = useState({ specimenCount: 0, syncQueueCount: 0, estimatedSize: '0 B' });
  const [isLoading, setIsLoading] = useState(true);
  const [r2Status, setR2Status] = useState<any>(null);
  const [isCheckingR2, setIsCheckingR2] = useState(false);

  useEffect(() => {
    loadStats();
    checkR2();
  }, []);

  const checkR2 = async () => {
    setIsCheckingR2(true);
    try {
      const res = await fetch('/api/storage/status');
      const data = await res.json();
      setR2Status(data);
    } catch (err) {
      setR2Status({ configured: false, status: 'error', message: 'Failed to query R2 status' });
    } finally {
      setIsCheckingR2(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await getStorageStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocalData = async () => {
    if (
      !confirm(
        'Are you sure? This will delete all local captures that have not been synced. Synced items remain safe in the master repository.'
      )
    ) {
      return;
    }

    try {
      await clearAllSpecimens();
      await clearAllSyncData();
      await loadStats();
      toast.success('Local IndexedDB storage cleared');
    } catch (err) {
      toast.error('Failed to clear local data');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            <span>Settings & System Diagnostics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage IndexedDB offline storage, network synchronization, and visual preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloudflare R2 Media Storage Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cloudflare R2 Media Storage
                  </h3>
                  {r2Status?.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : r2Status?.configured ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="h-3 w-3" /> Connection Issue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pending API Keys
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-speed, zero-egress fee specimen media vault on Cloudflare.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={checkR2}
                disabled={isCheckingR2}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isCheckingR2 ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
              <a
                href="https://dash.cloudflare.com/e97df7bfb09acbf14f6a44b36cc979f7/r2/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <span>Open Cloudflare R2</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">Account ID</span>
              <span className="text-slate-900 dark:text-white font-bold truncate block">{r2Status?.accountId || 'e97df7bfb09acbf14f6a44b36cc979f7'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">Target Bucket</span>
              <span className="text-slate-900 dark:text-white font-bold block">{r2Status?.bucket || 'banknotes-media'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider block">Streaming Proxy</span>
              <span className="text-slate-900 dark:text-white font-bold block">/api/media/[key]</span>
            </div>
          </div>

          {r2Status?.hint && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
              {r2Status.hint}
            </div>
          )}
        </div>

        {/* Appearance & Theming */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Visual Appearance
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between high-contrast dark mode and clean daylight themes.
          </p>
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theme Switcher</span>
            <AnimatedThemeToggler />
          </div>
        </div>

        {/* Local Storage Stats */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              IndexedDB Storage Cache
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Specimens captured locally remain available offline and sync automatically.
          </p>
          
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 font-sans">Cached Specimens:</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.specimenCount}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 font-sans">Pending Sync Queue:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{stats.syncQueueCount}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 font-sans">Estimated Storage Used:</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.estimatedSize}</span>
            </div>
          </div>
        </div>

        {/* Data Maintenance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Data Maintenance
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Purge local client caches if you need to reset un-synced test captures.
          </p>
          <button
            onClick={handleClearLocalData}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Local Client Cache</span>
          </button>
        </div>

        {/* Architecture & AI Engine Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Architecture
            </h3>
          </div>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Stack:</span>
              <strong className="text-slate-900 dark:text-white">Next.js 15 App Router</strong>
            </div>
            <div className="flex justify-between">
              <span>AI Vision Engine:</span>
              <strong className="text-slate-900 dark:text-white">Gemini 2.5 Flash</strong>
            </div>
            <div className="flex justify-between">
              <span>Valuation Pipeline:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">5+1 Multi-Source</strong>
            </div>
            <div className="flex justify-between">
              <span>Persistence:</span>
              <strong className="text-slate-900 dark:text-white">PostgreSQL & Prisma ORM</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
