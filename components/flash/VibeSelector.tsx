'use client';

import { VIBE_OPTIONS, REGION_OPTIONS } from '@/types/flash';

interface VibeSelectorProps {
  selectedVibes: string[];
  onVibesChange: (vibes: string[]) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

export function VibeSelector({
  selectedVibes,
  onVibesChange,
  selectedRegion,
  onRegionChange,
}: VibeSelectorProps) {
  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      onVibesChange(selectedVibes.filter(v => v !== vibe));
    } else if (selectedVibes.length < 3) {
      onVibesChange([...selectedVibes, vibe]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Vibe chips */}
      <div className="flex flex-wrap gap-2">
        {VIBE_OPTIONS.map((vibe) => (
          <button
            key={vibe.value}
            onClick={() => toggleVibe(vibe.value)}
            disabled={selectedVibes.length >= 3 && !selectedVibes.includes(vibe.value)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 border-2
              ${selectedVibes.includes(vibe.value)
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span>{vibe.emoji}</span>
            <span>{vibe.label}</span>
          </button>
        ))}
      </div>

      {/* Region dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred region (optional)
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Anywhere in the world</option>
          {REGION_OPTIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {/* Selection summary */}
      {(selectedVibes.length > 0 || selectedRegion) && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Looking for
            {selectedVibes.length > 0 && (
              <span className="font-medium text-gray-900">
                {' '}{selectedVibes.map(v => VIBE_OPTIONS.find(o => o.value === v)?.label).join(', ')}
              </span>
            )}
            {selectedVibes.length > 0 && selectedRegion && ' trips in'}
            {selectedRegion && (
              <span className="font-medium text-gray-900">
                {' '}{REGION_OPTIONS.find(r => r.value === selectedRegion)?.label}
              </span>
            )}
            {!selectedVibes.length && !selectedRegion && ' trips anywhere'}
          </p>
        </div>
      )}
    </div>
  );
}
