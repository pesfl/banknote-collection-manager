'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { subscribeToExtractionNotifications } from '@/lib/ai/background-queue';
import type { ExtractionNotification } from '@/types';
import Link from 'next/link';

export function ExtractionNotificationList() {
  const [notifications, setNotifications] = useState<ExtractionNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToExtractionNotifications((notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 4)]); // Keep up to 5 in stack

      // Auto dismiss after 7.5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 7500);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-3 sm:top-5 right-3 sm:right-5 left-3 sm:left-auto z-50 w-auto sm:w-[420px] pointer-events-none flex flex-col gap-2.5"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.9, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, y: -16, filter: 'blur(4px)', transition: { duration: 0.2 } }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            className="pointer-events-auto w-full"
          >
            <div className="relative group overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0b132b]/95 backdrop-blur-xl border border-blue-500/30 dark:border-blue-400/25 p-3.5 shadow-2xl shadow-blue-950/20 hover:border-blue-500/60 dark:hover:border-blue-400/50 transition-all duration-200">
              {/* Subtle accent glow */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${
                  notif.status === 'completed'
                    ? 'from-blue-600 via-indigo-500 to-emerald-400'
                    : 'from-amber-500 to-rose-500'
                }`}
              />

              <div className="flex items-start gap-3 mt-0.5">
                {/* Thumbnail or Flag Icon */}
                <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shadow-xs">
                  {notif.thumbnailUrl ? (
                    <img
                      src={notif.thumbnailUrl}
                      alt={notif.country}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl leading-none">{notif.countryFlag || '💵'}</span>
                  )}
                  <span className="absolute bottom-0 right-0 bg-white/90 dark:bg-slate-900/90 text-xs px-1 rounded-tl-md">
                    {notif.countryFlag}
                  </span>
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        notif.status === 'completed'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 animate-spin" />
                      <span>{notif.status === 'completed' ? 'AI Extracted' : 'Offline Saved'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Just now
                    </span>
                  </div>

                  {/* Title: Denomination & Country */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                    {notif.denomination} • {notif.country}
                  </h4>

                  {/* Metadata line: Pick, Serial, Grade */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex-wrap">
                    {notif.pickNumber && (
                      <span className="bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded font-medium text-slate-700 dark:text-slate-300">
                        Pick {notif.pickNumber}
                      </span>
                    )}
                    {notif.conditionGrade && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                        {notif.conditionGrade}
                      </span>
                    )}
                    {notif.valuation && (
                      <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-1.5 py-0.2 rounded font-black">
                        {notif.valuation}
                      </span>
                    )}
                    {notif.serialNumber && (
                      <span className="truncate max-w-[120px]">
                        SN: {notif.serialNumber}
                      </span>
                    )}
                  </div>

                  {/* Quick Action Link */}
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      href="/banknotes"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>View in Banknotes</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <Link
                      href="/inventory"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <span>Inventory</span>
                    </Link>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(notif.id, e)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
