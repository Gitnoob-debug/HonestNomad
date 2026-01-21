'use client';

import { TravelerConfig, ChildTraveler } from '@/types/flash';

interface TravelersStepProps {
  data: Partial<TravelerConfig>;
  onChange: (data: Partial<TravelerConfig>) => void;
}

const TRAVELER_TYPES = [
  { value: 'solo', label: 'Solo', description: 'Just me', icon: '🧳' },
  { value: 'couple', label: 'Couple', description: 'Traveling with partner', icon: '💑' },
  { value: 'family', label: 'Family', description: 'With kids', icon: '👨‍👩‍👧‍👦' },
  { value: 'group', label: 'Group', description: 'Friends or relatives', icon: '👥' },
] as const;

export function TravelersStep({ data, onChange }: TravelersStepProps) {
  const handleTypeChange = (type: TravelerConfig['type']) => {
    const updates: Partial<TravelerConfig> = { type };

    // Set default adults based on type
    if (type === 'solo') {
      updates.adults = 1;
      updates.children = [];
      updates.infants = 0;
    } else if (type === 'couple') {
      updates.adults = 2;
      updates.children = [];
      updates.infants = 0;
    } else if (type === 'family') {
      updates.adults = 2;
    } else if (type === 'group') {
      updates.adults = Math.max(data.adults || 2, 2);
    }

    onChange(updates);
  };

  const handleAdultsChange = (adults: number) => {
    onChange({ adults: Math.max(1, Math.min(10, adults)) });
  };

  const handleChildrenChange = (children: ChildTraveler[]) => {
    onChange({ children });
  };

  const addChild = () => {
    const children = [...(data.children || []), { age: 5 }];
    handleChildrenChange(children);
  };

  const removeChild = (index: number) => {
    const children = (data.children || []).filter((_, i) => i !== index);
    handleChildrenChange(children);
  };

  const updateChildAge = (index: number, age: number) => {
    const children = (data.children || []).map((child, i) =>
      i === index ? { age: Math.max(0, Math.min(17, age)) } : child
    );
    handleChildrenChange(children);
  };

  const handleInfantsChange = (infants: number) => {
    onChange({ infants: Math.max(0, Math.min(4, infants)) });
  };

  return (
    <div className="space-y-8">
      {/* Traveler type selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Who are you traveling with?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TRAVELER_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeChange(type.value)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all duration-200
                ${data.type === type.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <span className="text-2xl">{type.icon}</span>
              <p className="font-medium text-gray-900 mt-2">{type.label}</p>
              <p className="text-sm text-gray-500">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Number of adults */}
      {data.type && data.type !== 'solo' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of adults
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleAdultsChange((data.adults || 2) - 1)}
              disabled={data.adults === 1 || (data.type === 'couple' && data.adults === 2)}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center
                text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="text-xl font-semibold w-8 text-center">{data.adults || 2}</span>
            <button
              onClick={() => handleAdultsChange((data.adults || 2) + 1)}
              disabled={data.adults === 10}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center
                text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Children (for family type) */}
      {data.type === 'family' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Children (ages 2-17)
            </label>
            <button
              onClick={addChild}
              disabled={(data.children?.length || 0) >= 6}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add child
            </button>
          </div>

          {(data.children?.length || 0) === 0 ? (
            <p className="text-sm text-gray-500 italic">No children added yet</p>
          ) : (
            <div className="space-y-3">
              {data.children?.map((child, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Child {index + 1}:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateChildAge(index, child.age - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        text-gray-600 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-medium">{child.age} yrs</span>
                    <button
                      onClick={() => updateChildAge(index, child.age + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeChild(index)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Infants */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Infants (under 2)
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleInfantsChange((data.infants || 0) - 1)}
                disabled={(data.infants || 0) === 0}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center
                  text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span className="text-xl font-semibold w-8 text-center">{data.infants || 0}</span>
              <button
                onClick={() => handleInfantsChange((data.infants || 0) + 1)}
                disabled={(data.infants || 0) === 4}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center
                  text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {data.type && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            {data.type === 'solo' && '1 adult traveler'}
            {data.type === 'couple' && '2 adult travelers'}
            {data.type === 'family' && (
              <>
                {data.adults} adult{(data.adults || 0) > 1 ? 's' : ''}
                {(data.children?.length || 0) > 0 && `, ${data.children?.length} child${(data.children?.length || 0) > 1 ? 'ren' : ''}`}
                {(data.infants || 0) > 0 && `, ${data.infants} infant${(data.infants || 0) > 1 ? 's' : ''}`}
              </>
            )}
            {data.type === 'group' && `${data.adults} adult travelers`}
          </p>
        </div>
      )}
    </div>
  );
}
