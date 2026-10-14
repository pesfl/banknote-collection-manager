'use client';

import React, { useEffect } from 'react';
import { startBackgroundExtractionWorker } from '@/lib/ai/background-queue';
import { ExtractionNotificationList } from '@/components/notifications/ExtractionNotificationList';

export function BackgroundExtractionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the global background extraction queue worker
    const cleanup = startBackgroundExtractionWorker();
    return () => {
      cleanup();
    };
  }, []);

  return (
    <>
      {children}
      {/* Magic UI style top-right animated extraction notifications */}
      <ExtractionNotificationList />
    </>
  );
}
