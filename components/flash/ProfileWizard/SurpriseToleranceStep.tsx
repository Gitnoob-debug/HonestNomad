'use client';

interface SurpriseToleranceStepProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

const SURPRISE_LEVELS = [
  {
    level: 1,
    label: 'Predictable',
    description: 'I prefer familiar destinations and know exactly what to expect',
    emoji: '🎯',
    examples: 'Paris, Rome, London',
  },
  {
    level: 2,
    label: 'Mostly Safe',
    description: 'Popular destinations with maybe a hidden gem nearby',
    emoji: '🗺️',
    examples: 'Lisbon, Barcelona, Amsterdam',
  },
  {
    level: 3,
    label: 'Balanced',
    description: 'Mix of well-known spots and off-the-beaten-path adventures',
    emoji: '⚖️',
    examples: 'Porto, Slovenia, Croatia',
  },
  {
    level: 4,
    label: 'Adventurous',
    description: 'Love discovering less touristy places with unique experiences',
    emoji: '🧭',
    examples: 'Georgia, Montenegro, Oman',
  },
  {
    level: 5,
    label: 'Surprise Me!',
    description: 'Take me anywhere! I trust the algorithm to find magic',
    emoji: '✨',
    examples: 'You won\'t know until you swipe!',
  },
];

export function SurpriseToleranceStep({ value, onChange }: SurpriseToleranceStepProps) {
  const selectedLevel = SURPRISE_LEVELS.find(l => l.level === value);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        How adventurous are you with destination choices? This affects how varied and unexpected
        our suggestions will be.
      </p>

      {/* Level selector */}
      <div className="space-y-3">
        {SURPRISE_LEVELS.map((level) => (
          <button
            key={level.level}
            onClick={() => onChange(level.level)}
            className={`
              w-full p-4 rounded-xl border-2 text-left transition-all duration-200
              ${value === level.level
                ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-100'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{level.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{level.label}</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < level.level ? 'bg-primary-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Examples: {level.examples}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected summary */}
      {selectedLevel && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            {selectedLevel.emoji} {selectedLevel.label}: {selectedLevel.description}
          </p>
        </div>
      )}

      {/* Fun note */}
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Don't worry — you'll always swipe on complete trip details.
          <br />
          <span className="text-gray-500">No surprises when it comes to flights, hotels, and prices!</span>
        </p>
      </div>
    </div>
  );
}
