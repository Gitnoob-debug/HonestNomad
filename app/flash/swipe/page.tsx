'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlashVacation } from '@/hooks/useFlashVacation';
import { SwipeContainer } from '@/components/flash/SwipeContainer';
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
    regenerate,
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
      // For now, show confirmation - later integrate with booking flow
      router.push('/flash/confirm');
    }
  }, [selectedTrip, router]);

  if (authLoading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
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
    <main className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/flash')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <h1 className="text-xl font-bold text-gray-900">Flash Trips</h1>

          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">New Search</span>
          </button>
        </div>

        {/* Swipe container */}
        <SwipeContainer
          trips={trips}
          currentIndex={currentTripIndex}
          onSwipeLeft={swipeLeft}
          onSwipeRight={swipeRight}
          onRegenerate={handleRegenerate}
        />
      </div>
    </main>
  );
}
