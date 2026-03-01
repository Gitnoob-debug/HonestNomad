'use client';

import { useState, useCallback } from 'react';

interface SearchControlsProps {
  checkin: string;
  checkout: string;
  adults: number;
  children: number[];
  onUpdate: (params: { checkin: string; checkout: string; adults: number; children: number[] }) => void;
  isLoading: boolean;
}

export function SearchControls({
  checkin,
  checkout,
  adults,
  children,
  onUpdate,
  isLoading,
}: SearchControlsProps) {
  const [localCheckin, setLocalCheckin] = useState(checkin);
  const [localCheckout, setLocalCheckout] = useState(checkout);
  const [localAdults, setLocalAdults] = useState(adults);
  const [localChildren, setLocalChildren] = useState(children);

  // Track if user has modified any values
  const hasChanges =
    localCheckin !== checkin ||
    localCheckout !== checkout ||
    localAdults !== adults ||
    localChildren.length !== children.length;

  // Min date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleCheckinChange = useCallback((value: string) => {
    setLocalCheckin(value);
    // Auto-adjust checkout if it's before or equal to checkin
    if (value >= localCheckout) {
      const newCheckout = new Date(value);
      newCheckout.setDate(newCheckout.getDate() + 1);
      setLocalCheckout(newCheckout.toISOString().split('T')[0]);
    }
  }, [localCheckout]);

  const handleUpdate = useCallback(() => {
    onUpdate({
      checkin: localCheckin,
      checkout: localCheckout,
      adults: localAdults,
      children: localChildren,
    });
  }, [localCheckin, localCheckout, localAdults, localChildren, onUpdate]);

  // Calculate nights
  const nights = Math.max(1, Math.round(
    (new Date(localCheckout).getTime() - new Date(localCheckin).getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const totalGuests = localAdults + localChildren.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Date controls */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Check-in
            </label>
            <input
              type="date"
              value={localCheckin}
              min={minDate}
              onChange={(e) => handleCheckinChange(e.target.value)}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex flex-col items-center pt-4">
            <span className="text-gray-400 text-xs">{nights}n</span>
            <div className="w-4 h-px bg-gray-300" />
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Check-out
            </label>
            <input
              type="date"
              value={localCheckout}
              min={localCheckin || minDate}
              onChange={(e) => setLocalCheckout(e.target.value)}
              className="w-full text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-gray-200" />

        {/* Guest controls */}
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Guests
            </label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLocalAdults(Math.max(1, localAdults - 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm"
                disabled={localAdults <= 1}
              >
                -
              </button>
              <span className="text-sm font-medium text-gray-800 w-12 text-center">
                {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
              </span>
              <button
                onClick={() => setLocalAdults(Math.min(6, localAdults + 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm"
                disabled={localAdults >= 6}
              >
                +
              </button>
            </div>
          </div>

          {/* Update button — only show when changed */}
          {hasChanges && (
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 self-end"
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          )}
        </div>
      </div>

      {/* Date summary line */}
      <div className="mt-2 text-xs text-gray-500">
        {formatDate(localCheckin)} &rarr; {formatDate(localCheckout)} &middot; {nights} {nights === 1 ? 'night' : 'nights'} &middot; {localAdults} {localAdults === 1 ? 'adult' : 'adults'}
      </div>
    </div>
  );
}
