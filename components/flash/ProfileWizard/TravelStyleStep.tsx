'use client';

import { TravelStyleConfig } from '@/types/flash';

interface TravelStyleStepProps {
  data: Partial<TravelStyleConfig>;
  onChange: (data: Partial<TravelStyleConfig>) => void;
}

interface StyleSliderProps {
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  leftEmoji: string;
  rightEmoji: string;
}

function StyleSlider({ value, onChange, leftLabel, rightLabel, leftEmoji, rightEmoji }: StyleSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">{leftEmoji}</span>
          <span className="text-sm font-medium text-gray-700">{leftLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{rightLabel}</span>
          <span className="text-xl">{rightEmoji}</span>
        </div>
      </div>
      <div className="relative pt-1">
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary-600
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              className={`text-xs ${value === num ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}
            >
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed', description: 'Plenty of downtime', icon: '🧘' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced schedule', icon: '⚖️' },
  { value: 'packed', label: 'Packed', description: 'See everything!', icon: '🏃' },
] as const;

export function TravelStyleStep({ data, onChange }: TravelStyleStepProps) {
  const getStyleDescription = () => {
    const parts: string[] = [];

    const adventure = data.adventureRelaxation || 3;
    if (adventure <= 2) parts.push('relaxation-focused');
    else if (adventure >= 4) parts.push('adventure-seeking');
    else parts.push('balanced');

    const timing = data.earlyBirdNightOwl || 3;
    if (timing <= 2) parts.push('early riser');
    else if (timing >= 4) parts.push('night owl');

    const spontaneity = data.plannedSpontaneous || 3;
    if (spontaneity <= 2) parts.push('well-planned');
    else if (spontaneity >= 4) parts.push('spontaneous');

    return parts.join(', ');
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Help us understand your travel style so we can find trips that match your preferences.
      </p>

      {/* Adventure vs Relaxation */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <StyleSlider
          value={data.adventureRelaxation || 3}
          onChange={(value) => onChange({ adventureRelaxation: value })}
          leftLabel="Relaxation"
          rightLabel="Adventure"
          leftEmoji="🏖️"
          rightEmoji="🏔️"
        />
      </div>

      {/* Early Bird vs Night Owl */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <StyleSlider
          value={data.earlyBirdNightOwl || 3}
          onChange={(value) => onChange({ earlyBirdNightOwl: value })}
          leftLabel="Early Bird"
          rightLabel="Night Owl"
          leftEmoji="🌅"
          rightEmoji="🌙"
        />
      </div>

      {/* Planned vs Spontaneous */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <StyleSlider
          value={data.plannedSpontaneous || 3}
          onChange={(value) => onChange({ plannedSpontaneous: value })}
          leftLabel="Well-Planned"
          rightLabel="Spontaneous"
          leftEmoji="📋"
          rightEmoji="🎲"
        />
      </div>

      {/* Pace */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred travel pace
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PACE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ pace: option.value })}
              className={`
                p-4 rounded-xl border-2 text-center transition-all duration-200
                ${data.pace === option.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-2xl">{option.icon}</span>
              <p className="font-medium text-gray-900 text-sm mt-2">{option.label}</p>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.adventureRelaxation && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            Your style: {getStyleDescription()}
            {data.pace && ` traveler with a ${data.pace} pace`}
          </p>
        </div>
      )}
    </div>
  );
}
