'use client';

import { BudgetConfig } from '@/types/flash';

interface BudgetStepProps {
  data: Partial<BudgetConfig>;
  onChange: (data: Partial<BudgetConfig>) => void;
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
  { min: 500, max: 1500, label: 'Budget', description: 'Smart spending, great experiences' },
  { min: 1500, max: 3000, label: 'Moderate', description: 'Comfortable travel' },
  { min: 3000, max: 6000, label: 'Premium', description: 'Extra comfort & convenience' },
  { min: 6000, max: 15000, label: 'Luxury', description: 'No compromises' },
];

const FLEXIBILITY_OPTIONS = [
  { value: 'strict', label: 'Strict', description: 'Stay within budget', icon: '🎯' },
  { value: 'flexible', label: 'Flexible', description: '±20% is OK', icon: '↔️' },
  { value: 'splurge_ok', label: 'Splurge OK', description: 'Worth it for great deals', icon: '✨' },
] as const;

export function BudgetStep({ data, onChange }: BudgetStepProps) {
  const currency = data.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  const handlePresetSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    onChange({
      perTripMin: preset.min,
      perTripMax: preset.max,
    });
  };

  const handleMinChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      onChange({ perTripMin: num });
    }
  };

  const handleMaxChange = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      onChange({ perTripMax: num });
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
    return data.perTripMin === preset.min && data.perTripMax === preset.max;
  };

  return (
    <div className="space-y-8">
      {/* Currency selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your preferred currency
        </label>
        <select
          value={currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Budget presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Per-trip budget range
        </label>
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isPresetSelected(preset)
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <p className="font-semibold text-gray-900">{preset.label}</p>
              <p className="text-sm text-primary-600 font-medium mt-1">
                {formatCurrency(preset.min)} - {formatCurrency(preset.max)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Or set a custom range
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={data.perTripMin || ''}
                onChange={(e) => handleMinChange(e.target.value)}
                placeholder="1,000"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <span className="text-gray-400 pt-5">to</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={data.perTripMax || ''}
                onChange={(e) => handleMaxChange(e.target.value)}
                placeholder="5,000"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Flexibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Budget flexibility
        </label>
        <div className="grid grid-cols-3 gap-3">
          {FLEXIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ flexibility: option.value })}
              className={`
                p-3 rounded-xl border-2 text-center transition-all duration-200
                ${data.flexibility === option.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-xl">{option.icon}</span>
              <p className="font-medium text-gray-900 text-sm mt-1">{option.label}</p>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.perTripMax && data.perTripMax > 0 && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            Looking for trips between {formatCurrency(data.perTripMin || 0)} and {formatCurrency(data.perTripMax)}
            {data.flexibility === 'flexible' && ' (flexible)'}
            {data.flexibility === 'splurge_ok' && ' (willing to splurge)'}
          </p>
        </div>
      )}
    </div>
  );
}
