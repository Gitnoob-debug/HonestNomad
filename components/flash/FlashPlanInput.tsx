'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { FlashGenerateParams, DateFlexibility, BudgetMode } from '@/types/flash';

interface FlashPlanInputProps {
  onGenerate: (params: FlashGenerateParams) => void;
  isLoading?: boolean;
}

// 5 preset vibes + custom with cleaner icons
const VIBE_PRESETS = [
  {
    value: 'beach',
    label: 'Beach',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    )
  },
  {
    value: 'city',
    label: 'City Break',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    )
  },
  {
    value: 'culture',
    label: 'Culture',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    )
  },
  {
    value: 'adventure',
    label: 'Adventure',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l8.735 8.735m0 0a.374.374 0 11.53.53m-.53-.53l.53.53m0 0L21 21M14.652 9.348a3.75 3.75 0 010 5.304m2.121-7.425a6.75 6.75 0 010 9.546m2.121-11.667c3.808 3.807 3.808 9.98 0 13.788m-9.546-4.242a3.733 3.733 0 01-1.06-2.122m-1.061 4.243a6.75 6.75 0 01-1.625-6.929m-.496 9.05c-3.068-3.067-3.664-7.67-1.79-11.334M12 12h.008v.008H12V12z" />
      </svg>
    )
  },
  {
    value: 'romance',
    label: 'Romance',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    )
  },
];

// 5 preset regions + custom with cleaner icons
const REGION_PRESETS = [
  {
    value: 'europe',
    label: 'Europe',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3C8 3 4 7 4 12s4 9 8 9" strokeLinecap="round" />
        <path d="M12 3c4 0 8 4 8 9s-4 9-8 9" strokeLinecap="round" />
        <path d="M3.5 9h17M3.5 15h17" strokeLinecap="round" />
      </svg>
    )
  },
  {
    value: 'asia',
    label: 'Asia',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8l4 4-4 4M12 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    value: 'caribbean',
    label: 'Caribbean',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  },
  {
    value: 'americas',
    label: 'Americas',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" strokeLinecap="round" />
      </svg>
    )
  },
  {
    value: 'anywhere',
    label: 'Anywhere',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    )
  },
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

  const [budgetOption, setBudgetOption] = useState<BudgetMode>('regular');
  const [customBudget, setCustomBudget] = useState('');

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
      budgetMode: budgetOption,
      customBudget: budgetOption === 'custom' ? customBudget : undefined,
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
          <div className="grid grid-cols-3 gap-3">
            {VIBE_PRESETS.map((vibe) => (
              <button
                key={vibe.value}
                onClick={() => handleVibeSelect(vibe.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                  selectedVibe === vibe.value && !showVibeCustom
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                {vibe.icon}
                <span className="text-xs font-medium">{vibe.label}</span>
              </button>
            ))}
            <button
              onClick={() => handleVibeSelect('custom')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                showVibeCustom
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 border-dashed text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-xs font-medium">Custom</span>
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
          <div className="grid grid-cols-3 gap-3">
            {REGION_PRESETS.map((region) => (
              <button
                key={region.value}
                onClick={() => handleRegionSelect(region.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                  selectedRegion === region.value && !showRegionCustom
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                {region.icon}
                <span className="text-xs font-medium">{region.label}</span>
              </button>
            ))}
            <button
              onClick={() => handleRegionSelect('custom')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                showRegionCustom
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 border-dashed text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-xs font-medium">Custom</span>
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

        {/* ========== BUDGET SECTION ========== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My trip budget</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setBudgetOption('regular')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                budgetOption === 'regular'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              <span className="text-xs font-medium">My regular budget</span>
              <span className="text-[10px] text-gray-500">Use profile settings</span>
            </button>
            <button
              onClick={() => setBudgetOption('bargain')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                budgetOption === 'bargain'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              <span className="text-xs font-medium">Bargain hunting</span>
              <span className="text-[10px] text-gray-500">Find me deals</span>
            </button>
            <button
              onClick={() => setBudgetOption('custom')}
              className={`p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-2 ${
                budgetOption === 'custom'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 border-dashed text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-xs font-medium">Custom</span>
              <span className="text-[10px] text-gray-500">Set my own</span>
            </button>
          </div>

          {budgetOption === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                placeholder="e.g., $2000, up to $5000, no limit..."
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
          16 curated destinations matched to your profile
        </p>
      </div>
    </div>
  );
}
