'use client';

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">📊 Analytics & Insights</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Overview */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Portfolio Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Value</span>
              <span className="text-2xl font-bold text-green-400">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Average Value</span>
              <span className="text-xl font-bold text-blue-400">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Highest Specimen</span>
              <span className="text-xl font-bold text-purple-400">$0</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Charts and detailed analytics coming soon
          </p>
        </div>

        {/* Collection Stats */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Collection Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Specimens</span>
              <span className="text-2xl font-bold text-blue-400">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Countries Represented</span>
              <span className="text-2xl font-bold text-purple-400">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Rarest Specimen</span>
              <span className="text-lg font-bold text-amber-400">—</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Features */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">📈 Coming Soon</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✓ Collection value trends over time</li>
          <li>✓ Rarity distribution charts</li>
          <li>✓ Country breakdown analysis</li>
          <li>✓ ROI tracking by acquisition date</li>
          <li>✓ Serial number pattern analysis</li>
          <li>✓ Grading distribution</li>
        </ul>
      </div>
    </div>
  );
}
