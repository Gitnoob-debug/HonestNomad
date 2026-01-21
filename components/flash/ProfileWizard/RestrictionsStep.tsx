'use client';

import { useState } from 'react';
import { RestrictionConfig, DIETARY_OPTIONS, ACCESSIBILITY_OPTIONS } from '@/types/flash';

interface RestrictionsStepProps {
  data: Partial<RestrictionConfig>;
  onChange: (data: Partial<RestrictionConfig>) => void;
}

export function RestrictionsStep({ data, onChange }: RestrictionsStepProps) {
  const [allergyInput, setAllergyInput] = useState('');
  const [medicalInput, setMedicalInput] = useState('');

  const toggleDietary = (option: string) => {
    const current = data.dietary || [];
    if (current.includes(option)) {
      onChange({ dietary: current.filter(d => d !== option) });
    } else {
      onChange({ dietary: [...current, option] });
    }
  };

  const toggleAccessibility = (option: string) => {
    const current = data.accessibility || [];
    if (current.includes(option)) {
      onChange({ accessibility: current.filter(a => a !== option) });
    } else {
      onChange({ accessibility: [...current, option] });
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      const current = data.allergies || [];
      if (!current.includes(allergyInput.trim())) {
        onChange({ allergies: [...current, allergyInput.trim()] });
      }
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    onChange({ allergies: (data.allergies || []).filter(a => a !== allergy) });
  };

  const addMedical = () => {
    if (medicalInput.trim()) {
      const current = data.medical || [];
      if (!current.includes(medicalInput.trim())) {
        onChange({ medical: [...current, medicalInput.trim()] });
      }
      setMedicalInput('');
    }
  };

  const removeMedical = (item: string) => {
    onChange({ medical: (data.medical || []).filter(m => m !== item) });
  };

  const formatDietaryLabel = (option: string) => {
    return option.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Tell us about any dietary restrictions, allergies, or accessibility needs.
        This is optional but helps us find the perfect trip for you.
      </p>

      {/* Dietary restrictions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Dietary restrictions
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => toggleDietary(option)}
              className={`
                px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200
                ${data.dietary?.includes(option)
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {formatDietaryLabel(option)}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Allergies
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
            placeholder="Type an allergy and press Enter"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addAllergy}
            disabled={!allergyInput.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {(data.allergies?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.allergies?.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
              >
                {allergy}
                <button
                  onClick={() => removeAllergy(allergy)}
                  className="ml-1 hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Accessibility needs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Accessibility needs
        </label>
        <div className="space-y-2">
          {ACCESSIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${data.accessibility?.includes(option.value)
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={data.accessibility?.includes(option.value) || false}
                onChange={() => toggleAccessibility(option.value)}
                className="sr-only"
              />
              <span
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center mr-3
                  ${data.accessibility?.includes(option.value)
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300'
                  }
                `}
              >
                {data.accessibility?.includes(option.value) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium text-gray-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Medical considerations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Medical considerations (optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          E.g., "Need refrigerated medication", "Avoid high altitudes"
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={medicalInput}
            onChange={(e) => setMedicalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMedical()}
            placeholder="Add medical consideration"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={addMedical}
            disabled={!medicalInput.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        {(data.medical?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.medical?.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {item}
                <button
                  onClick={() => removeMedical(item)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* No restrictions note */}
      {!data.dietary?.length && !data.allergies?.length && !data.accessibility?.length && !data.medical?.length && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            No restrictions selected. You can skip this step if you don't have any special requirements.
          </p>
        </div>
      )}
    </div>
  );
}
