'use client';

import type { LocalSpecimen } from '@/types';
import SyncStatusBadge from './SyncStatusBadge';

interface InventoryCardProps {
  specimen: LocalSpecimen;
  onClick?: () => void;
}

export default function InventoryCard({ specimen, onClick }: InventoryCardProps) {
  const thumbnailUrl = specimen.frontImageBlob
    ? URL.createObjectURL(specimen.frontImageBlob)
    : null;

  const country = specimen.extraction?.countryOfOrigin || 'Unknown';
  const denomination = specimen.extraction?.denomination || '—';
  const capturedDate = new Date(specimen.capturedAt);
  const timeAgo = getTimeAgo(capturedDate);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      {/* Thumbnail */}
      <div className="bg-gray-100 dark:bg-gray-700 aspect-square overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${country} ${denomination}`}
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(thumbnailUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-3xl">📷</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* Country & Denomination */}
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {country}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {denomination}
          </p>
        </div>

        {/* Date & Sync Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</span>
          <SyncStatusBadge status={specimen.syncStatus} />
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
