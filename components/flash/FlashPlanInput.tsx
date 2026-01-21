'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { VibeSelector } from './VibeSelector';
import type { FlashGenerateParams } from '@/types/flash';

interface FlashPlanInputProps {
  onGenerate: (params: FlashGenerateParams) => void;
  isLoading?: boolean;
}

export function FlashPlanInput({ onGenerate, isLoading }: FlashPlanInputProps) {
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate min return date (day after departure)
  const minReturnDate = departureDate
    ? new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDate;

  const handleSubmit = () => {
    if (!departureDate || !returnDate) return;

    onGenerate({
      departureDate,
      returnDate,
      vibe: selectedVibes.length > 0 ? selectedVibes : undefined,
      region: selectedRegion || undefined,
    });
  };

  const isValid = departureDate && returnDate && new Date(returnDate) > new Date(departureDate);

  // Calculate trip duration
  const tripDuration = departureDate && returnDate
    ? Math.ceil((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
      {/* Dates */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">When do you want to travel?</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  // Reset return date if it's before new departure
                  if (returnDate && new Date(returnDate) <= new Date(e.target.value)) {
                    setReturnDate('');
                  }
                }}
                min={minDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={minReturnDate}
                disabled={!departureDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {tripDuration > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {tripDuration} night{tripDuration > 1 ? 's' : ''} trip
            </p>
          )}
        </div>

        {/* Optional: Vibes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What's your vibe? (optional)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Skip this for maximum variety, or pick a few to narrow down
          </p>
          <VibeSelector
            selectedVibes={selectedVibes}
            onVibesChange={setSelectedVibes}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </div>

        {/* Generate button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          loading={isLoading}
          className="w-full py-4 text-lg"
        >
          {isLoading ? 'Finding Your Perfect Trips...' : 'Generate Flash Trips'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          We'll find 8 diverse trip options tailored to your profile
        </p>
      </div>
    </div>
  );
}
