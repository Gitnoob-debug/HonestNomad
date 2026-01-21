'use client';

import { InterestConfig, INTEREST_OPTIONS } from '@/types/flash';

interface InterestsStepProps {
  data: Partial<InterestConfig>;
  onChange: (data: Partial<InterestConfig>) => void;
}

export function InterestsStep({ data, onChange }: InterestsStepProps) {
  const primaryInterests = data.primary || [];
  const secondaryInterests = data.secondary || [];

  const toggleInterest = (interest: string) => {
    // Check current state
    const isPrimary = primaryInterests.includes(interest);
    const isSecondary = secondaryInterests.includes(interest);

    if (!isPrimary && !isSecondary) {
      // Not selected -> add to primary (if space) or secondary
      if (primaryInterests.length < 3) {
        onChange({ primary: [...primaryInterests, interest] });
      } else {
        onChange({ secondary: [...secondaryInterests, interest] });
      }
    } else if (isPrimary) {
      // Primary -> move to secondary
      onChange({
        primary: primaryInterests.filter(i => i !== interest),
        secondary: [...secondaryInterests, interest],
      });
    } else {
      // Secondary -> remove
      onChange({
        secondary: secondaryInterests.filter(i => i !== interest),
      });
    }
  };

  const getInterestState = (interest: string): 'primary' | 'secondary' | 'none' => {
    if (primaryInterests.includes(interest)) return 'primary';
    if (secondaryInterests.includes(interest)) return 'secondary';
    return 'none';
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Select your top interests. We'll use these to find destinations and activities you'll love.
        </p>
        <p className="text-xs text-gray-500">
          Tap once for "top priority" (max 3), tap again for "nice to have", tap again to remove
        </p>
      </div>

      {/* Interest grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INTEREST_OPTIONS.map((interest) => {
          const state = getInterestState(interest.value);
          return (
            <button
              key={interest.value}
              onClick={() => toggleInterest(interest.value)}
              className={`
                p-4 rounded-xl border-2 text-center transition-all duration-200
                ${state === 'primary'
                  ? 'border-primary-600 bg-primary-100 ring-2 ring-primary-200'
                  : state === 'secondary'
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-2xl">{interest.icon}</span>
              <p className="text-sm font-medium text-gray-900 mt-2">{interest.label}</p>
              {state !== 'none' && (
                <div className={`
                  mt-1 text-xs px-2 py-0.5 rounded-full inline-block
                  ${state === 'primary' ? 'bg-primary-600 text-white' : 'bg-primary-200 text-primary-700'}
                `}>
                  {state === 'primary' ? '★ Top' : 'Nice to have'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      <div className="space-y-3">
        {primaryInterests.length > 0 && (
          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-xs font-medium text-primary-700 uppercase tracking-wide mb-2">
              Top Priorities ({primaryInterests.length}/3)
            </p>
            <div className="flex flex-wrap gap-2">
              {primaryInterests.map((interest) => {
                const opt = INTEREST_OPTIONS.find(i => i.value === interest);
                return (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-full text-sm"
                  >
                    {opt?.icon} {opt?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {secondaryInterests.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Nice to Have
            </p>
            <div className="flex flex-wrap gap-2">
              {secondaryInterests.map((interest) => {
                const opt = INTEREST_OPTIONS.find(i => i.value === interest);
                return (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                  >
                    {opt?.icon} {opt?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {primaryInterests.length === 0 && (
        <p className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">
          Please select at least one top priority interest to continue.
        </p>
      )}
    </div>
  );
}
