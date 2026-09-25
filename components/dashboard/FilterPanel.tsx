'use client';

interface FilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterCountry: string;
  onFilterCountryChange: (country: string) => void;
  sortBy: 'recent' | 'country' | 'value';
  onSortChange: (sort: 'recent' | 'country' | 'value') => void;
}

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  filterCountry,
  onFilterCountryChange,
  sortBy,
  onSortChange,
}: FilterPanelProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 space-y-6 h-fit sticky top-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🔍 Search
        </label>
        <input
          type="text"
          placeholder="Search by denomination, country..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
        />
      </div>

      {/* Filter by Country */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🌍 Country
        </label>
        <select
          value={filterCountry}
          onChange={e => onFilterCountryChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
        >
          <option value="">All Countries</option>
          <option value="United States">United States</option>
          <option value="India">India</option>
          <option value="Japan">Japan</option>
          <option value="Germany">Germany</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="Canada">Canada</option>
          <option value="Australia">Australia</option>
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📊 Sort By
        </label>
        <div className="space-y-2">
          {[
            { value: 'recent', label: 'Most Recent' },
            { value: 'country', label: 'Country (A-Z)' },
            { value: 'value', label: 'Estimated Value' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value as 'recent' | 'country' | 'value')}
              className={`w-full px-4 py-2 rounded-lg transition-all text-left text-sm font-medium ${
                sortBy === option.value
                  ? 'bg-blue-500/30 border border-blue-500/50 text-blue-200'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          onSearchChange('');
          onFilterCountryChange('');
          onSortChange('recent');
        }}
        className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors text-sm font-medium"
      >
        Clear All
      </button>
    </div>
  );
}
