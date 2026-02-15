'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import type { FlashGenerateParams, BudgetTier, TravelerType } from '@/types/flash';

interface FlashPlanInputProps {
  onGenerate: (params: FlashGenerateParams) => void;
  isLoading?: boolean;
}

// Vibes that map to POI path types
const VIBE_PRESETS = [
  { value: 'beach', label: 'Beach & Relax', emoji: '🏖️' },
  { value: 'city', label: 'Cool City Vibes', emoji: '🌆' },
  { value: 'food', label: 'Foodie Paradise', emoji: '🍷' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'culture', label: 'History & Culture', emoji: '🏛️' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🎉' },
];

// Region presets (inside More Options)
const REGION_PRESETS = [
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'asia', label: 'Asia', emoji: '🌏' },
  { value: 'caribbean', label: 'Caribbean', emoji: '🌴' },
  { value: 'americas', label: 'Americas', emoji: '🌎' },
  { value: 'anywhere', label: 'Anywhere', emoji: '🌍' },
];

// Traveler type options (inside More Options)
const TRAVELER_PRESETS: { value: TravelerType; label: string; emoji: string }[] = [
  { value: 'solo', label: 'Solo', emoji: '🧑' },
  { value: 'couple', label: 'Couple', emoji: '💑' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'friends', label: 'Friends', emoji: '👥' },
];

// Session storage key for traveler type
const TRAVELERS_STORAGE_KEY = 'flash_traveler_type';

export function FlashPlanInput({ onGenerate, isLoading }: FlashPlanInputProps) {
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  // --- Defaults that live behind "More options" ---
  const [travelerType, setTravelerType] = useState<TravelerType>('couple');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('deals');
  const [selectedRegion, setSelectedRegion] = useState<string>('anywhere');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Load traveler type from session storage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TRAVELERS_STORAGE_KEY);
      if (stored && ['solo', 'couple', 'family', 'friends'].includes(stored)) {
        setTravelerType(stored as TravelerType);
      }
    } catch {}
  }, []);

  // Save traveler type to session storage
  const handleTravelerChange = (type: TravelerType) => {
    setTravelerType(type);
    try {
      sessionStorage.setItem(TRAVELERS_STORAGE_KEY, type);
    } catch {}
  };

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate min return date (day after departure)
  const minReturnDate = departureDate
    ? new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDate;

  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : prev.length < 3 ? [...prev, vibe] : prev
    );
  };

  const handleSubmit = () => {
    if (!departureDate || !returnDate) return;

    // Save params to sessionStorage for the confirm page
    try {
      sessionStorage.setItem('flash_generate_params', JSON.stringify({
        departureDate,
        returnDate,
      }));
    } catch {}

    onGenerate({
      departureDate,
      returnDate,
      vibe: selectedVibes.length > 0 ? selectedVibes : undefined,
      region: selectedRegion !== 'anywhere' ? selectedRegion : undefined,
      budgetMode: budgetTier === 'budget' ? 'bargain' : budgetTier === 'extravagant' ? 'custom' : 'regular',
      customBudget: budgetTier === 'extravagant' ? 'no limit, luxury only' : undefined,
      travelers: travelerType,
    });
  };

  const isValid = departureDate && returnDate && new Date(returnDate) > new Date(departureDate);

  // Calculate trip duration
  const tripDuration = departureDate && returnDate
    ? Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Count active "More options" overrides for the badge
  const moreOptionsCount =
    (travelerType !== 'couple' ? 1 : 0) +
    (budgetTier !== 'deals' ? 1 : 0) +
    (selectedRegion !== 'anywhere' ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
      <div className="space-y-8">

        {/* ========== DATES SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">When?</h3>
          <div className="grid grid-cols-2 gap-4">
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
            <p className="text-sm text-gray-500 mt-2">
              {tripDuration} night{tripDuration > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* ========== VIBE SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">What vibe?</h3>
          <p className="text-xs text-gray-500 mb-4">Pick up to 3, or skip for a surprise mix</p>
          <div className="grid grid-cols-3 gap-3">
            {VIBE_PRESETS.map((vibe) => (
              <button
                key={vibe.value}
                onClick={() => handleVibeToggle(vibe.value)}
                className={`p-3 sm:p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedVibes.includes(vibe.value)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-2xl">{vibe.emoji}</span>
                <span className="text-xs font-medium leading-tight">{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========== MORE OPTIONS (COLLAPSIBLE) ========== */}
        <div>
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            More options
            {moreOptionsCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {moreOptionsCount} changed
              </span>
            )}
          </button>

          {showMoreOptions && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-6">
              {/* Travelers */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Who&apos;s going?</h4>
                <div className="flex gap-2">
                  {TRAVELER_PRESETS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleTravelerChange(t.value)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-center transition-all border-2 flex flex-col items-center gap-1 ${
                        travelerType === t.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Budget</h4>
                <div className="flex gap-2">
                  {[
                    { value: 'budget' as BudgetTier, label: 'Budget', emoji: '💰' },
                    { value: 'deals' as BudgetTier, label: 'Best Value', emoji: '🏷️' },
                    { value: 'extravagant' as BudgetTier, label: 'Luxury', emoji: '✨' },
                  ].map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setBudgetTier(b.value)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-center transition-all border-2 flex flex-col items-center gap-1 ${
                        budgetTier === b.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-lg">{b.emoji}</span>
                      <span className="text-xs font-medium">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Region</h4>
                <div className="flex flex-wrap gap-2">
                  {REGION_PRESETS.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => setSelectedRegion(region.value)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                        selectedRegion === region.value
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="mr-1">{region.emoji}</span>
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>
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
          {isLoading ? 'Finding trips...' : 'Find My Trips'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          16 curated destinations matched to your taste
        </p>
      </div>
    </div>
  );
}
