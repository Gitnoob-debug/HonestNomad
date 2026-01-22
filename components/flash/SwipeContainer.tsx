'use client';

import { useState } from 'react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { SwipeCard } from './SwipeCard';
import { TripDetailModal } from './TripDetailModal';
import type { FlashTripPackage } from '@/types/flash';

interface SwipeContainerProps {
  trips: FlashTripPackage[];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onRegenerate?: () => void;
}

export function SwipeContainer({
  trips,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onGoBack,
  canGoBack = false,
  onRegenerate,
}: SwipeContainerProps) {
  const [expandedTrip, setExpandedTrip] = useState<FlashTripPackage | null>(null);

  const { ref, swipeState, getTransformStyle } = useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,
  });

  const currentTrip = trips[currentIndex];
  const nextTrip = trips[currentIndex + 1];
  const hasMoreTrips = currentIndex < trips.length - 1;
  const isExhausted = currentIndex >= trips.length;

  if (isExhausted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No more trips to show
        </h3>
        <p className="text-gray-600 mb-6">
          You've seen all the options. Want to try different dates or vibes?
        </p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Generate New Trips
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Card stack */}
        <div className="relative w-full max-w-md h-[520px] sm:h-[560px]">
          {/* Background card (next trip preview) */}
          {hasMoreTrips && nextTrip && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[95%] opacity-50 scale-95 blur-[1px]">
                <SwipeCard trip={nextTrip} />
              </div>
            </div>
          )}

          {/* Current card */}
          {currentTrip && (
            <div
              ref={ref}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                ...getTransformStyle(),
                transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              <SwipeCard
                trip={currentTrip}
                onExpand={() => setExpandedTrip(currentTrip)}
                swipeDirection={swipeState.direction === 'left' || swipeState.direction === 'right' ? swipeState.direction : null}
                swipeProgress={swipeState.progress}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {/* Go back button */}
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 transition-colors ${
              canGoBack
                ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                : 'border-gray-100 opacity-40 cursor-not-allowed'
            }`}
            title="Go back to previous trip"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          {/* Reject button */}
          <button
            onClick={onSwipeLeft}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Info button */}
          <button
            onClick={() => currentTrip && setExpandedTrip(currentTrip)}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Accept button */}
          <button
            onClick={onSwipeRight}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Counter */}
        <p className="mt-4 text-sm text-gray-500">
          {currentIndex + 1} of {trips.length} trips
        </p>

        {/* Keyboard hint */}
        <p className="mt-2 text-xs text-gray-400 hidden sm:block">
          Use arrow keys: ← to skip, → to book
        </p>
      </div>

      {/* Detail modal */}
      <TripDetailModal
        trip={expandedTrip}
        onClose={() => setExpandedTrip(null)}
        onBook={() => {
          setExpandedTrip(null);
          onSwipeRight();
        }}
      />
    </>
  );
}
