'use client';

import { useState, useEffect, useRef } from 'react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { ImmersiveSwipeCard } from './ImmersiveSwipeCard';
import { TripDetailModal } from './TripDetailModal';
import type { FlashTripPackage } from '@/types/flash';

interface ImmersiveSwipeContainerProps {
  trips: FlashTripPackage[];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onRegenerate?: () => void;
}

export function ImmersiveSwipeContainer({
  trips,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onGoBack,
  canGoBack = false,
  onRegenerate,
}: ImmersiveSwipeContainerProps) {
  const [expandedTrip, setExpandedTrip] = useState<FlashTripPackage | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const { ref, swipeState, getTransformStyle } = useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,
  });

  const currentTrip = trips[currentIndex];
  const nextTrip = trips[currentIndex + 1];
  const hasMoreTrips = currentIndex < trips.length - 1;
  const isExhausted = currentIndex >= trips.length;

  // Preload next few images
  useEffect(() => {
    const preloadCount = 3;
    for (let i = 1; i <= preloadCount; i++) {
      const tripToPreload = trips[currentIndex + i];
      if (tripToPreload) {
        // Preload primary image
        const img = new Image();
        img.src = tripToPreload.imageUrl;
        // Preload first carousel image if available
        const firstImage = tripToPreload.images?.[0];
        if (firstImage) {
          const img2 = new Image();
          img2.src = typeof firstImage === 'string' ? firstImage : firstImage.url;
        }
      }
    }
  }, [currentIndex, trips]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    resetControlsTimeout();

    const handleInteraction = () => resetControlsTimeout();
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('mousemove', handleInteraction);

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [currentIndex]);

  // Haptic feedback helper
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 };
      navigator.vibrate(patterns[style]);
    }
  };

  const handleSwipeLeft = () => {
    triggerHaptic('light');
    onSwipeLeft();
  };

  const handleSwipeRight = () => {
    triggerHaptic('medium');
    onSwipeRight();
  };

  if (isExhausted) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">
          That's all for now!
        </h3>
        <p className="text-gray-400 mb-8 max-w-sm">
          You've explored all the destinations. Ready to discover more?
        </p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors text-lg"
          >
            Find More Trips
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Card stack - full-screen on mobile, centered "storybook" style on desktop */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Desktop: centered container with max-width */}
        <div className="h-full w-full flex items-center justify-center p-0 sm:p-6 lg:p-12">
          <div className="relative w-full h-full sm:max-w-2xl sm:h-[85vh] sm:max-h-[900px] sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl sm:shadow-black/50">
            {/* Background card (next trip preview) - subtle */}
            {hasMoreTrips && nextTrip && (
              <div className="absolute inset-0 scale-[0.92] opacity-40">
                <ImmersiveSwipeCard trip={nextTrip} isActive={false} />
              </div>
            )}

            {/* Current card */}
            {currentTrip && (
              <div
                ref={ref}
                className="absolute inset-0"
                style={{
                  ...getTransformStyle(),
                  transition: swipeState.isSwiping ? 'none' : 'transform 0.3s ease-out',
                }}
              >
                <ImmersiveSwipeCard
                  trip={currentTrip}
                  onTap={() => setExpandedTrip(currentTrip)}
                  swipeDirection={swipeState.direction === 'left' || swipeState.direction === 'right' ? swipeState.direction : null}
                  swipeProgress={swipeState.progress}
                  isActive={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating controls - appear on tap/interaction */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Gradient background for controls - only on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none sm:hidden" />

        <div className="relative px-6 pb-8 pt-16 sm:pb-6 sm:pt-4">
          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Go back button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onGoBack?.();
              }}
              disabled={!canGoBack}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                canGoBack
                  ? 'bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 active:scale-95'
                  : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
              }`}
              title="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            {/* Reject button */}
            <button
              onClick={handleSwipeLeft}
              className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-red-400/50 hover:bg-red-500/30 hover:border-red-400 transition-all active:scale-95"
            >
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Info/Expand button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                currentTrip && setExpandedTrip(currentTrip);
              }}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Accept/Like button */}
            <button
              onClick={handleSwipeRight}
              className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-green-400/50 hover:bg-green-500/30 hover:border-green-400 transition-all active:scale-95"
            >
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Counter */}
          <p className="mt-4 text-sm text-white/60 text-center">
            {currentIndex + 1} of {trips.length}
          </p>
        </div>
      </div>

      {/* Top navigation bar - also auto-hides */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none sm:hidden" />

        <div className="relative flex items-center justify-between px-4 py-4 pt-safe">
          {/* Back to search */}
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors p-2 -ml-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Title */}
          <h1 className="text-white font-semibold">Discover</h1>

          {/* New search */}
          <button
            onClick={onRegenerate}
            className="text-white/80 hover:text-white transition-colors p-2 -mr-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
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
