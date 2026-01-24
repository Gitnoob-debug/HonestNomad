'use client';

import { AccommodationPreferences } from '@/types/flash';

interface AccommodationStepProps {
  data: Partial<AccommodationPreferences>;
  onChange: (data: Partial<AccommodationPreferences>) => void;
}

// Simplified: 3 tiers instead of granular star ratings
const ACCOMMODATION_TIERS = [
  { value: 2, label: 'Budget', description: '2-3 star basics', emoji: '🏨' },
  { value: 4, label: 'Comfort', description: '4 star quality', emoji: '⭐' },
  { value: 5, label: 'Luxury', description: '5 star premium', emoji: '✨' },
];

// Simplified: 6 most common amenities, simple toggle
const CORE_AMENITIES = [
  { value: 'pool', label: 'Pool', icon: '🏊' },
  { value: 'wifi', label: 'Free WiFi', icon: '📶' },
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
];

export function AccommodationStep({ data, onChange }: AccommodationStepProps) {
  const toggleAmenity = (amenity: string) => {
    const current = data.mustHaveAmenities || [];
    if (current.includes(amenity)) {
      onChange({ mustHaveAmenities: current.filter(a => a !== amenity) });
    } else if (current.length < 3) {
      onChange({ mustHaveAmenities: [...current, amenity] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Accommodation tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What's your style?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ACCOMMODATION_TIERS.map((tier) => (
            <button
              key={tier.value}
              onClick={() => onChange({ minStars: tier.value })}
              className={`
                p-4 rounded-xl border-2 text-center transition-all duration-200
                ${data.minStars === tier.value
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
            const isSelected = data.mustHaveAmenities?.includes(amenity.value);
            const isDisabled = !isSelected && (data.mustHaveAmenities?.length || 0) >= 3;
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

      {/* Summary */}
      {data.minStars && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            {ACCOMMODATION_TIERS.find(t => t.value === data.minStars)?.label} hotels
            {(data.mustHaveAmenities?.length || 0) > 0 && (
              <> with {data.mustHaveAmenities?.map(a =>
                CORE_AMENITIES.find(c => c.value === a)?.label
              ).join(', ')}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
