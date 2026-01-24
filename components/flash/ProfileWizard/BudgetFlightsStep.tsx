'use client';

import { BudgetConfig, FlightPreferences } from '@/types/flash';

interface BudgetFlightsStepProps {
  budgetData: Partial<BudgetConfig>;
  flightData: Partial<FlightPreferences>;
  onBudgetChange: (data: Partial<BudgetConfig>) => void;
  onFlightChange: (data: Partial<FlightPreferences>) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

const BUDGET_PRESETS = [
  { min: 500, max: 1500, label: 'Budget', description: 'Smart spending' },
  { min: 1500, max: 3000, label: 'Moderate', description: 'Comfortable' },
  { min: 3000, max: 6000, label: 'Premium', description: 'Extra comfort' },
  { min: 6000, max: 15000, label: 'Luxury', description: 'No limits' },
];

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy', icon: '💺' },
  { value: 'premium_economy', label: 'Premium Economy', icon: '🎫' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'first', label: 'First Class', icon: '✨' },
] as const;

const MAX_STOPS_OPTIONS = [
  { value: 0, label: 'Direct only', description: 'No connections' },
  { value: 1, label: '1 stop max', description: 'Quick connections' },
  { value: 2, label: 'Any', description: 'More options' },
];

export function BudgetFlightsStep({
  budgetData,
  flightData,
  onBudgetChange,
  onFlightChange
}: BudgetFlightsStepProps) {
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

      {/* ========== FLIGHT PREFERENCES SECTION ========== */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Preferences</h3>

        {/* Cabin class */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred cabin class
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CABIN_CLASSES.map((cabin) => (
              <button
                key={cabin.value}
                onClick={() => onFlightChange({ cabinClass: cabin.value })}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all duration-200
                  ${flightData.cabinClass === cabin.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <span className="text-lg">{cabin.icon}</span>
                <p className="text-xs font-medium text-gray-900 mt-1">{cabin.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Max stops */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MAX_STOPS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onFlightChange({
                  maxStops: option.value,
                  directOnly: option.value === 0
                })}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all duration-200
                  ${flightData.maxStops === option.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Max layover time (only show if not direct only) */}
        {flightData.maxStops !== 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum layover time
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="8"
                value={flightData.maxLayoverHours || 3}
                onChange={(e) => onFlightChange({ maxLayoverHours: parseInt(e.target.value, 10) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary-600
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
                {flightData.maxLayoverHours || 3} hours
              </span>
            </div>
          </div>
        )}

        {/* Red-eye preference */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={flightData.redEyeOk || false}
              onChange={(e) => onFlightChange({ redEyeOk: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Red-eye flights OK</span>
              <p className="text-xs text-gray-500">Overnight flights that arrive early morning</p>
            </div>
          </label>
        </div>
      </div>

      {/* Summary */}
      {budgetData.perTripMax && budgetData.perTripMax > 0 && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            {formatCurrency(budgetData.perTripMin || 0)} - {formatCurrency(budgetData.perTripMax)} budget
            {flightData.cabinClass && ` • ${CABIN_CLASSES.find(c => c.value === flightData.cabinClass)?.label}`}
            {flightData.maxStops === 0 && ' • Direct flights'}
            {flightData.redEyeOk && ' • Red-eyes OK'}
          </p>
        </div>
      )}
    </div>
  );
}
