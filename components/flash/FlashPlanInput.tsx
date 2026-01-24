'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { FlashGenerateParams, DateFlexibility } from '@/types/flash';

interface FlashPlanInputProps {
  onGenerate: (params: FlashGenerateParams) => void;
  isLoading?: boolean;
}

// 5 preset vibes + custom
const VIBE_PRESETS = [
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'city', label: 'City Break', emoji: '🌆' },
  { value: 'culture', label: 'Culture', emoji: '🏛️' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'romance', label: 'Romance', emoji: '💕' },
];

// 5 preset regions + custom
const REGION_PRESETS = [
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'asia', label: 'Asia', emoji: '🌏' },
  { value: 'caribbean', label: 'Caribbean', emoji: '🌴' },
  { value: 'americas', label: 'Americas', emoji: '🌎' },
  { value: 'anywhere', label: 'Anywhere', emoji: '🌍' },
];

export function FlashPlanInput({ onGenerate, isLoading }: FlashPlanInputProps) {
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [dateFlexibility, setDateFlexibility] = useState<DateFlexibility>('exact');

  const [selectedVibe, setSelectedVibe] = useState<string>('');
  const [customVibe, setCustomVibe] = useState('');
  const [showVibeCustom, setShowVibeCustom] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState<string>('anywhere');
  const [customRegion, setCustomRegion] = useState('');
  const [showRegionCustom, setShowRegionCustom] = useState(false);

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate min return date (day after departure)
  const minReturnDate = departureDate
    ? new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDate;

  const handleVibeSelect = (vibe: string) => {
    if (vibe === 'custom') {
      setShowVibeCustom(true);
      setSelectedVibe('');
    } else {
      setShowVibeCustom(false);
      setCustomVibe('');
      setSelectedVibe(selectedVibe === vibe ? '' : vibe);
    }
  };

  const handleRegionSelect = (region: string) => {
    if (region === 'custom') {
      setShowRegionCustom(true);
      setSelectedRegion('');
    } else {
      setShowRegionCustom(false);
      setCustomRegion('');
      setSelectedRegion(region);
    }
  };

  const handleSubmit = () => {
    if (!departureDate || !returnDate) return;

    const vibe = showVibeCustom && customVibe ? customVibe : selectedVibe;
    const region = showRegionCustom && customRegion ? customRegion : selectedRegion;

    onGenerate({
      departureDate,
      returnDate,
      dateFlexibility: dateFlexibility !== 'exact' ? dateFlexibility : undefined,
      vibe: vibe ? [vibe] : undefined,
      region: region && region !== 'anywhere' ? region : undefined,
    });
  };

  const isValid = departureDate && returnDate && new Date(returnDate) > new Date(departureDate);

  // Calculate trip duration
  const tripDuration = departureDate && returnDate
    ? Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
      <div className="space-y-8">

        {/* ========== DATES SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">When?</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depart
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  if (returnDate && new Date(returnDate) <= new Date(e.target.value)) {
                    setReturnDate('');
                  }
                }}
                min={minDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={minReturnDate}
                disabled={!departureDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {tripDuration > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              {tripDuration} night{tripDuration > 1 ? 's' : ''}
            </p>
          )}

          {/* Date flexibility */}
          <div className="flex gap-2">
            <button
              onClick={() => setDateFlexibility('exact')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                dateFlexibility === 'exact'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Exact dates
            </button>
            <button
              onClick={() => setDateFlexibility('flex1')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                dateFlexibility === 'flex1'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              ± 1 day
            </button>
            <button
              onClick={() => setDateFlexibility('flex3')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                dateFlexibility === 'flex3'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              ± 3 days
            </button>
          </div>
        </div>

        {/* ========== VIBE SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What vibe?</h3>
          <div className="grid grid-cols-3 gap-2">
            {VIBE_PRESETS.map((vibe) => (
              <button
                key={vibe.value}
                onClick={() => handleVibeSelect(vibe.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedVibe === vibe.value && !showVibeCustom
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{vibe.emoji}</span>
                <p className="text-xs font-medium text-gray-900 mt-1">{vibe.label}</p>
              </button>
            ))}
            <button
              onClick={() => handleVibeSelect('custom')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                showVibeCustom
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 border-dashed'
              }`}
            >
              <span className="text-xl">✏️</span>
              <p className="text-xs font-medium text-gray-900 mt-1">Custom</p>
            </button>
          </div>

          {showVibeCustom && (
            <div className="mt-3">
              <input
                type="text"
                value={customVibe}
                onChange={(e) => setCustomVibe(e.target.value)}
                placeholder="e.g., Wine tasting, Hiking, Nightlife..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          )}

          {!selectedVibe && !showVibeCustom && (
            <p className="mt-2 text-xs text-gray-500">Optional - skip for variety</p>
          )}
        </div>

        {/* ========== DESTINATION SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Where?</h3>
          <div className="grid grid-cols-3 gap-2">
            {REGION_PRESETS.map((region) => (
              <button
                key={region.value}
                onClick={() => handleRegionSelect(region.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedRegion === region.value && !showRegionCustom
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{region.emoji}</span>
                <p className="text-xs font-medium text-gray-900 mt-1">{region.label}</p>
              </button>
            ))}
            <button
              onClick={() => handleRegionSelect('custom')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                showRegionCustom
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 border-dashed'
              }`}
            >
              <span className="text-xl">✏️</span>
              <p className="text-xs font-medium text-gray-900 mt-1">Custom</p>
            </button>
          </div>

          {showRegionCustom && (
            <div className="mt-3">
              <input
                type="text"
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                placeholder="e.g., Italy, Southeast Asia, Scandinavia..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* ========== GENERATE BUTTON ========== */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          loading={isLoading}
          className="w-full py-4 text-lg"
        >
          {isLoading ? 'Finding trips...' : 'Find Trips'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          8 options matched to your profile
        </p>
      </div>
    </div>
  );
}
