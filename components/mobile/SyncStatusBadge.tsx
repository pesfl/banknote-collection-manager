'use client';

type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  showLabel?: boolean;
}

const statusConfig: Record<
  SyncStatus,
  { label: string; icon: string; bgColor: string; textColor: string }
> = {
  pending: {
    label: 'Local',
    icon: '📍',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-400',
  },
  syncing: {
    label: 'Syncing',
    icon: '⏳',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-400',
  },
  synced: {
    label: 'Synced',
    icon: '☁️',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-400',
  },
  failed: {
    label: 'Error',
    icon: '⚠️',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-400',
  },
};

export default function SyncStatusBadge({
  status,
  showLabel = false,
}: SyncStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
