'use client';

import { useEffect, useState } from 'react';

interface StatsPanelProps {
  pendingCount: number;
  syncedCount: number;
}

export default function StatsPanel({ pendingCount, syncedCount }: StatsPanelProps) {
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setTotalCount(pendingCount + syncedCount);
  }, [pendingCount, syncedCount]);

  const stats = [
    {
      label: 'Total Specimens',
      value: totalCount,
      icon: '📚',
      bgGradient: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Synced',
      value: syncedCount,
      icon: '☁️',
      bgGradient: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'Pending Sync',
      value: pendingCount,
      icon: '⏳',
      bgGradient: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'Collection Value',
      value: '$0',
      icon: '💎',
      bgGradient: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl border ${stat.borderColor} rounded-xl p-6 transition-all duration-300 hover:bg-opacity-20 hover:shadow-lg hover:shadow-blue-500/20`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div className="text-4xl opacity-50">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
