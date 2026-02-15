'use client';

import { useState, useEffect, useRef } from 'react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { ImmersiveSwipeCard } from './ImmersiveSwipeCard';
import { TripDetailModal } from './TripDetailModal';
import type { FlashTripPackage } from '@/types/flash';

interface TripPriceState {
  loading: boolean;
  loaded: boolean;
  error?: string;
  realPrice?: number;
  overBudget?: boolean;
  budgetDiff?: number;
}

interface ImmersiveSwipeContainerProps {
  trips: FlashTripPackage[];
  currentIndex: number;
  tripPrices?: Record<string, TripPriceState>;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  onRegenerate?: () => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function ImmersiveSwipeContainer({
  trips,
  currentIndex,
  tripPrices,
  onSwipeLeft,
  onSwipeRight,
  onGoBack,
  canGoBack = false,
  onRegenerate,
  onLoadMore,
  isLoadingMore = false,
}: ImmersiveSwipeContainerProps) {
  const [expandedTrip, setExpandedTrip] = useState<FlashTripPackage | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showTutorial, setShowTutorial] = useState(currentIndex === 0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Dismiss tutorial on first interaction or after 3 seconds
  useEffect(() => {
    if (!showTutorial) return;

    const timer = setTimeout(() => setShowTutorial(false), 3000);
    const dismiss = () => setShowTutorial(false);
    window.addEventListener('touchstart', dismiss, { once: true });
    window.addEventListener('mousedown', dismiss, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', dismiss);
      window.removeEventListener('mousedown', dismiss);
    };
  }, [showTutorial]);

  // Hide tutorial when user advances past first card
  useEffect(() => {
    if (currentIndex > 0) setShowTutorial(false);
  }, [currentIndex]);

  const { ref, swipeState, getTransformStyle } = useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,
  });

  const currentTrip = trips[currentIndex];
  const nextTrip = trips[currentIndex + 1];
  const hasMoreTrips = currentIndex < trips.length - 1;
  const isExhausted = currentIndex >= trips.length;

  // Preload next few images (primary + first few carousel images)
  useEffect(() => {
    const preloadCount = 3;
    for (let i = 1; i <= preloadCount; i++) {
      const tripToPreload = trips[currentIndex + i];
      if (tripToPreload) {
        // Preload primary image
        const img = new Image();
        img.src = tripToPreload.imageUrl;
        // Preload additional carousel images (skip first since it's the primary)
        if (tripToPreload.images) {
          const carouselImages = tripToPreload.images.slice(1, 3);
          carouselImages.forEach(carouselImg => {
            const preloadImg = new Image();
            preloadImg.src = typeof carouselImg === 'string' ? carouselImg : carouselImg.url;
          });
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
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-gray-900 to-gray-900 flex flex-col items-center justify-center text-center px-6">
        {/* Decorative travel icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 text-6xl">✈️</div>
          <div className="absolute top-32 right-16 text-4xl">🌍</div>
          <div className="absolute bottom-40 left-20 text-5xl">🏝️</div>
          <div className="absolute bottom-28 right-10 text-4xl">🗺️</div>
        </div>

        <div className="relative z-10">
          {/* Compass icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary-500/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">
            Nothing catching your eye?
          </h3>
          <p className="text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
            {onLoadMore
              ? "We've got more destinations up our sleeve. Load another batch or try different vibes."
              : "No worries! Try a different vibe, dates, or destination to discover your perfect getaway."}
          </p>

          {/* Primary: Load more destinations */}
          {onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              {isLoadingMore ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Finding more...
                </>
              ) : (
                'Show More Destinations'
              )}
            </button>
          )}

          {/* Secondary: Start fresh */}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className={`px-6 py-3 text-white/70 hover:text-white font-medium transition-colors ${onLoadMore ? 'mt-4 text-sm' : 'px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95'}`}
            >
              {onLoadMore ? 'Or start a new search' : 'Start New Search'}
            </button>
          )}

          {/* Go back option */}
          {canGoBack && (
            <button
              onClick={onGoBack}
              className="mt-4 px-6 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              ← Go back to previous trips
            </button>
          )}
        </div>
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
                <ImmersiveSwipeCard
                  trip={nextTrip}
                  priceState={tripPrices?.[nextTrip.id]}
                  isActive={false}
                />
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
                  priceState={tripPrices?.[currentTrip.id]}
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

      {/* First-card swipe tutorial overlay */}
      {showTutorial && currentTrip && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="flex items-center gap-12 animate-pulse">
            {/* Left arrow + label */}
            <div className="flex flex-col items-center gap-2 opacity-80">
              <div className="w-14 h-14 rounded-full bg-red-500/30 border-2 border-red-400/60 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="text-white/80 text-xs font-medium">Skip</span>
            </div>

            {/* Right arrow + label */}
            <div className="flex flex-col items-center gap-2 opacity-80">
              <div className="w-14 h-14 rounded-full bg-green-500/30 border-2 border-green-400/60 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-white/80 text-xs font-medium">I like this!</span>
            </div>
          </div>
        </div>
      )}

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

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1">
            {trips.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-white'
                    : idx < currentIndex
                      ? 'w-2 h-2 bg-white/50'
                      : 'w-2 h-2 bg-white/20'
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-white/40 text-center">
            {currentIndex + 1} / {trips.length}
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
