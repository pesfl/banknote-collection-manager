'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CaptureFlow from '@/components/mobile/CaptureFlow';
import { Camera, ListFilter, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CapturePage() {
  const handleCaptureComplete = (specimenId: string) => {
    toast.success(`Specimen ${specimenId.slice(0, 8)}... saved locally`, {
      description: 'Image cached to IndexedDB and queued for Gemini Vision sync.',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Dual-Image Specimen Ingestion</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-friction capture: Front Photo → Flip → Back Photo → Instant AI queue.
          </p>
        </div>

        <Link
          href="/banknotes"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ListFilter className="h-3.5 w-3.5 text-slate-400" />
          <span>View Inventory</span>
        </Link>
      </div>

      {/* Main Capture Module */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xs">
        <CaptureFlow onComplete={handleCaptureComplete} />
      </div>
    </div>
  );
}
