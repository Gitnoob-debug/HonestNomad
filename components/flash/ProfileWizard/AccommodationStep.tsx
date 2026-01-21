'use client';

import { AccommodationPreferences, AMENITY_OPTIONS } from '@/types/flash';

interface AccommodationStepProps {
  data: Partial<AccommodationPreferences>;
  onChange: (data: Partial<AccommodationPreferences>) => void;
}

const STAR_OPTIONS = [
  { stars: 3, label: '3-star', description: 'Clean & comfortable basics' },
  { stars: 4, label: '4-star', description: 'Quality & good amenities' },
  { stars: 5, label: '5-star', description: 'Luxury & premium service' },
];

const ROOM_PREFERENCES = [
  { value: 'king_bed', label: 'King Bed', icon: '🛏️' },
  { value: 'twin_beds', label: 'Twin Beds', icon: '🛏️🛏️' },
  { value: 'ocean_view', label: 'Ocean View', icon: '🌊' },
  { value: 'city_view', label: 'City View', icon: '🏙️' },
  { value: 'high_floor', label: 'High Floor', icon: '⬆️' },
  { value: 'quiet_room', label: 'Quiet Room', icon: '🤫' },
  { value: 'balcony', label: 'Balcony', icon: '🌅' },
  { value: 'suite', label: 'Suite', icon: '✨' },
];

export function AccommodationStep({ data, onChange }: AccommodationStepProps) {
  const toggleAmenity = (amenity: string, isMustHave: boolean) => {
    const currentMustHave = data.mustHaveAmenities || [];
    const currentNiceToHave = data.niceToHaveAmenities || [];

    if (isMustHave) {
      // Toggle in must-have list
      if (currentMustHave.includes(amenity)) {
        onChange({
          mustHaveAmenities: currentMustHave.filter(a => a !== amenity),
        });
      } else {
        // Remove from nice-to-have if present, add to must-have
        onChange({
          mustHaveAmenities: [...currentMustHave, amenity],
          niceToHaveAmenities: currentNiceToHave.filter(a => a !== amenity),
        });
      }
    } else {
      // Toggle in nice-to-have list
      if (currentNiceToHave.includes(amenity)) {
        onChange({
          niceToHaveAmenities: currentNiceToHave.filter(a => a !== amenity),
        });
      } else {
        // Remove from must-have if present, add to nice-to-have
        onChange({
          niceToHaveAmenities: [...currentNiceToHave, amenity],
          mustHaveAmenities: currentMustHave.filter(a => a !== amenity),
        });
      }
    }
  };

  const toggleRoomPreference = (pref: string) => {
    const current = data.roomPreferences || [];
    if (current.includes(pref)) {
      onChange({ roomPreferences: current.filter(p => p !== pref) });
    } else {
      onChange({ roomPreferences: [...current, pref] });
    }
  };

  const getAmenityState = (amenity: string): 'must' | 'nice' | 'none' => {
    if (data.mustHaveAmenities?.includes(amenity)) return 'must';
    if (data.niceToHaveAmenities?.includes(amenity)) return 'nice';
    return 'none';
  };

  return (
    <div className="space-y-8">
      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Minimum hotel stars
        </label>
        <div className="grid grid-cols-3 gap-3">
          {STAR_OPTIONS.map((option) => (
            <button
              key={option.stars}
              onClick={() => onChange({ minStars: option.stars })}
              className={`
                p-4 rounded-xl border-2 text-center transition-all duration-200
                ${data.minStars === option.stars
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex justify-center gap-0.5 mb-2">
                {Array.from({ length: option.stars }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="font-medium text-gray-900 text-sm">{option.label}</p>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hotel amenities
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Tap once for "nice to have", tap again for "must have"
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const state = getAmenityState(amenity.value);
            return (
              <button
                key={amenity.value}
                onClick={() => {
                  if (state === 'none') {
                    toggleAmenity(amenity.value, false); // Add to nice-to-have
                  } else if (state === 'nice') {
                    toggleAmenity(amenity.value, true); // Move to must-have
                  } else {
                    toggleAmenity(amenity.value, true); // Remove from must-have
                  }
                }}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all duration-200
                  ${state === 'must'
                    ? 'border-primary-600 bg-primary-100'
                    : state === 'nice'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <span className="text-xl">{amenity.icon}</span>
                <p className="text-xs font-medium text-gray-900 mt-1">{amenity.label}</p>
                {state !== 'none' && (
                  <p className={`text-xs mt-0.5 ${state === 'must' ? 'text-primary-700 font-semibold' : 'text-primary-500'}`}>
                    {state === 'must' ? 'Must have' : 'Nice to have'}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Room preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Room preferences (optional)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ROOM_PREFERENCES.map((pref) => (
            <button
              key={pref.value}
              onClick={() => toggleRoomPreference(pref.value)}
              className={`
                p-3 rounded-lg border-2 text-center transition-all duration-200
                ${data.roomPreferences?.includes(pref.value)
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-lg">{pref.icon}</span>
              <p className="text-xs font-medium text-gray-900 mt-1">{pref.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.minStars && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            Looking for {data.minStars}+ star hotels
            {(data.mustHaveAmenities?.length || 0) > 0 && (
              <> with {data.mustHaveAmenities?.join(', ')}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
