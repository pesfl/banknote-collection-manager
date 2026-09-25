'use client';

export default function ValuationPage() {
  return (
    <div className="p-6">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-4">💰 Valuation Matrix</h1>
        <p className="text-gray-300 mb-6">
          Multi-source valuation engine coming soon. Track prices from PMG, Heritage Auctions,
          Stack's Bowers, eBay, and more.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'PMG Price Guide', icon: '📊' },
            { name: 'Heritage Auctions', icon: '🔨' },
            { name: "Stack's Bowers", icon: '💎' },
            { name: 'eBay Sold Listings', icon: '🛒' },
            { name: 'Numista Catalog', icon: '📚' },
            { name: 'Banknote Archives', icon: '🗂️' },
          ].map(source => (
            <div
              key={source.name}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-4xl mb-2">{source.icon}</div>
              <p className="font-medium text-white">{source.name}</p>
              <p className="text-xs text-gray-400 mt-2">Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
