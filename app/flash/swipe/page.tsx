'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlashVacation } from '@/hooks/useFlashVacation';
import { ImmersiveSwipeContainer } from '@/components/flash/ImmersiveSwipeContainer';
import { Spinner } from '@/components/ui';

export default function FlashSwipePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    trips,
    currentTripIndex,
    selectedTrip,
    swipeLeft,
    swipeRight,
    goBack,
    canGoBack,
    preferencesLoading,
  } = useFlashVacation();

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  // Redirect if no trips (user came directly without generating)
  useEffect(() => {
    if (!preferencesLoading && trips.length === 0) {
      router.push('/flash');
    }
  }, [trips, preferencesLoading, router]);

  // Handle booking when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      // Store selected trip and redirect to booking
      sessionStorage.setItem('flash_selected_trip', JSON.stringify(selectedTrip));
      router.push('/flash/confirm');
    }
  }, [selectedTrip, router]);

  if (authLoading || preferencesLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  if (!user || trips.length === 0) {
    return null;
  }

  const handleRegenerate = () => {
    router.push('/flash');
  };

  return (
    <ImmersiveSwipeContainer
      trips={trips}
      currentIndex={currentTripIndex}
      onSwipeLeft={swipeLeft}
      onSwipeRight={swipeRight}
      onGoBack={goBack}
      canGoBack={canGoBack}
      onRegenerate={handleRegenerate}
    />
  );
}
