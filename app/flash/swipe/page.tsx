'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlashVacation } from '@/hooks/useFlashVacation';
import { useRevealedPreferences } from '@/hooks/useRevealedPreferences';
import { usePOIPrefetch } from '@/hooks/usePOIPrefetch';
import { ImmersiveSwipeContainer } from '@/components/flash/ImmersiveSwipeContainer';

export default function FlashSwipePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    trips,
    currentTripIndex,
    selectedTrip,
    swipeLeft: baseSwipeLeft,
    swipeRight: baseSwipeRight,
    goBack,
    canGoBack,
    tripPrices,
    loadMoreTrips,
    isLoadingMore,
    hydrated,
  } = useFlashVacation();

  const { trackSwipe } = useRevealedPreferences();

  // Prefetch POI data for current + next card so explore page loads instantly
  usePOIPrefetch(trips, currentTripIndex);

  // Track when user started viewing current card (for dwell time)
  const cardViewStartRef = useRef<number>(Date.now());

  // Reset timer when card changes
  useEffect(() => {
    cardViewStartRef.current = Date.now();
  }, [currentTripIndex]);

  // Wrap swipeLeft to track preference
  const swipeLeft = useCallback(() => {
    const currentTrip = trips[currentTripIndex];
    if (currentTrip) {
      const dwellTime = Date.now() - cardViewStartRef.current;
      trackSwipe(currentTrip, 'left', dwellTime, false);
    }
    baseSwipeLeft();
  }, [trips, currentTripIndex, trackSwipe, baseSwipeLeft]);

  // Wrap swipeRight to track preference
  const swipeRight = useCallback(() => {
    const currentTrip = trips[currentTripIndex];
    if (currentTrip) {
      const dwellTime = Date.now() - cardViewStartRef.current;
      trackSwipe(currentTrip, 'right', dwellTime, false);
    }
    baseSwipeRight();
  }, [trips, currentTripIndex, trackSwipe, baseSwipeRight]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        swipeLeft();
      } else if (e.key === 'ArrowRight') {
        swipeRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swipeLeft, swipeRight]);

  // Redirect if no trips (user came directly without generating)
  // Wait for hydration so sessionStorage trips are loaded before deciding
  useEffect(() => {
    if (hydrated && trips.length === 0) {
      router.push('/flash');
    }
  }, [hydrated, trips, router]);

  // Handle when trip is selected - go to explore/itinerary view
  useEffect(() => {
    if (selectedTrip) {
      // Store selected trip and redirect to explore/itinerary
      sessionStorage.setItem('flash_selected_trip', JSON.stringify(selectedTrip));
      router.push('/flash/explore');
    }
  }, [selectedTrip, router]);

  if (trips.length === 0) {
    return null;
  }

  const handleRegenerate = () => {
    router.push('/flash');
  };

  return (
    <ImmersiveSwipeContainer
      trips={trips}
      currentIndex={currentTripIndex}
      tripPrices={tripPrices}
      onSwipeLeft={swipeLeft}
      onSwipeRight={swipeRight}
      onGoBack={goBack}
      canGoBack={canGoBack}
      onRegenerate={handleRegenerate}
      onLoadMore={loadMoreTrips}
      isLoadingMore={isLoadingMore}
    />
  );
}
