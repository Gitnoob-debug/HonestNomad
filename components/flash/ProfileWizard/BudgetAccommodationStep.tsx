'use client';

import { BudgetConfig, AccommodationPreferences } from '@/types/flash';

interface BudgetAccommodationStepProps {
  budgetData: Partial<BudgetConfig>;
  accommodationData: Partial<AccommodationPreferences>;
  onBudgetChange: (data: Partial<BudgetConfig>) => void;
  onAccommodationChange: (data: Partial<AccommodationPreferences>) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20ac', name: 'Euro' },
  { code: 'GBP', symbol: '\u00a3', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '\u00a5', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

const BUDGET_PRESETS = [
  { min: 500, max: 1500, label: 'Budget', description: 'Smart spending' },
  { min: 1500, max: 3000, label: 'Moderate', description: 'Comfortable' },
  { min: 3000, max: 6000, label: 'Premium', description: 'Extra comfort' },
  { min: 6000, max: 15000, label: 'Luxury', description: 'No limits' },
];

// Simplified: 3 tiers instead of granular star ratings
const ACCOMMODATION_TIERS = [
  { value: 2, label: 'Budget', description: '2-3 star basics', emoji: '\ud83c\udfe8' },
  { value: 4, label: 'Comfort', description: '4 star quality', emoji: '\u2b50' },
  { value: 5, label: 'Luxury', description: '5 star premium', emoji: '\u2728' },
];

// Simplified: 6 most common amenities, simple toggle
const CORE_AMENITIES = [
  { value: 'pool', label: 'Pool', icon: '\ud83c\udfca' },
  { value: 'wifi', label: 'Free WiFi', icon: '\ud83d\udcf6' },
  { value: 'breakfast', label: 'Breakfast', icon: '\ud83c\udf73' },
  { value: 'gym', label: 'Gym', icon: '\ud83d\udcaa' },
  { value: 'parking', label: 'Parking', icon: '\ud83c\udd7f\ufe0f' },
  { value: 'pet_friendly', label: 'Pet Friendly', icon: '\ud83d\udc15' },
];

export function BudgetAccommodationStep({
  budgetData,
  accommodationData,
  onBudgetChange,
  onAccommodationChange,
}: BudgetAccommodationStepProps) {
  const currency = budgetData.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  const handlePresetSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    onBudgetChange({
      perTripMin: preset.min,
      perTripMax: preset.max,
    });
  };

  const handleMinChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      onBudgetChange({ perTripMin: num });
    }
  };

  const handleMaxChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      onBudgetChange({ perTripMax: num });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isPresetSelected = (preset: typeof BUDGET_PRESETS[0]) => {
    return budgetData.perTripMin === preset.min && budgetData.perTripMax === preset.max;
  };

  const toggleAmenity = (amenity: string) => {
    const current = accommodationData.mustHaveAmenities || [];
    if (current.includes(amenity)) {
      onAccommodationChange({ mustHaveAmenities: current.filter(a => a !== amenity) });
    } else if (current.length < 3) {
      onAccommodationChange({ mustHaveAmenities: [...current, amenity] });
    }
  };

  return (
    <div className="space-y-8">
      {/* ========== BUDGET SECTION ========== */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Budget</h3>

        {/* Currency selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => onBudgetChange({ currency: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget presets */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`
                p-3 rounded-xl border-2 text-left transition-all duration-200
                ${isPresetSelected(preset)
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <p className="font-semibold text-gray-900 text-sm">{preset.label}</p>
              <p className="text-xs text-primary-600 font-medium">
                {formatCurrency(preset.min)} - {formatCurrency(preset.max)}
              </p>
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Min</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={budgetData.perTripMin || ''}
                onChange={(e) => handleMinChange(e.target.value)}
                placeholder="1,000"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
          <span className="text-gray-400 pt-5">-</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Max</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={budgetData.perTripMax || ''}
                onChange={(e) => handleMaxChange(e.target.value)}
                placeholder="5,000"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* ========== ACCOMMODATION SECTION ========== */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accommodation</h3>

        {/* Accommodation tier */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What's your style?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {ACCOMMODATION_TIERS.map((tier) => (
              <button
                key={tier.value}
                onClick={() => onAccommodationChange({ minStars: tier.value })}
                className={`
                  p-4 rounded-xl border-2 text-center transition-all duration-200
                  ${accommodationData.minStars === tier.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <span className="text-2xl">{tier.emoji}</span>
                <p className="font-semibold text-gray-900 mt-2">{tier.label}</p>
                <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Core amenities - simple multi-select, max 3 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Must-haves? (pick up to 3)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CORE_AMENITIES.map((amenity) => {
              const isSelected = accommodationData.mustHaveAmenities?.includes(amenity.value);
              const isDisabled = !isSelected && (accommodationData.mustHaveAmenities?.length || 0) >= 3;
              return (
                <button
                  key={amenity.value}
                  onClick={() => toggleAmenity(amenity.value)}
                  disabled={isDisabled}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all duration-200
                    ${isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <span className="text-xl">{amenity.icon}</span>
                  <p className="text-xs font-medium text-gray-900 mt-1">{amenity.label}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">Optional - skip if flexible</p>
        </div>
      </div>

      {/* Summary */}
      {budgetData.perTripMax && budgetData.perTripMax > 0 && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            {formatCurrency(budgetData.perTripMin || 0)} - {formatCurrency(budgetData.perTripMax)} budget
            {accommodationData.minStars && (
              <> &middot; {ACCOMMODATION_TIERS.find(t => t.value === accommodationData.minStars)?.label} hotels</>
            )}
            {(accommodationData.mustHaveAmenities?.length || 0) > 0 && (
              <> &middot; {accommodationData.mustHaveAmenities?.map(a =>
                CORE_AMENITIES.find(c => c.value === a)?.label
              ).join(', ')}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
