'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlashVacation } from '@/hooks/useFlashVacation';
import { FlashPlanInput } from '@/components/flash/FlashPlanInput';
import { Spinner } from '@/components/ui';
import type { FlashGenerateParams } from '@/types/flash';
import { DESTINATIONS } from '@/lib/flash/destinations';

// Shuffled sample destinations shown during loading
function getLoadingDestinations(count: number = 30): Array<{ city: string; country: string; emoji: string }> {
  const regionEmoji: Record<string, string> = {
    europe: '🇪🇺',
    asia: '🌏',
    americas: '🌎',
    africa: '🌍',
    oceania: '🌊',
    middle_east: '🕌',
    caribbean: '🌴',
  };
  const shuffled = [...DESTINATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(d => ({
    city: d.city,
    country: d.country,
    emoji: regionEmoji[d.region] || '✈️',
  }));
}

export default function FlashPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    preferencesLoading,
    profileComplete,
    missingSteps,
    isGenerating,
    generationProgress,
    generationStage,
    trips,
    error,
    generateTrips,
  } = useFlashVacation();

  // Redirect to swipe page when trips are generated
  useEffect(() => {
    if (trips.length > 0 && !isGenerating) {
      router.push('/flash/swipe');
    }
  }, [trips, isGenerating, router]);

  const handleGenerate = async (params: FlashGenerateParams) => {
    await generateTrips(params);
  };

  // Destination discovery animation during loading
  const loadingDestinations = useMemo(() => getLoadingDestinations(30), []);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setVisibleCount(0);
      return;
    }

    // Stagger destination appearances
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= loadingDestinations.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 300); // New destination every 300ms

    return () => clearInterval(interval);
  }, [isGenerating, loadingDestinations.length]);

  // Show generation loading state — immersive destination discovery
  if (isGenerating) {
    return (
      <main className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
        {/* Floating destination names in background */}
        <div className="absolute inset-0 overflow-hidden">
          {loadingDestinations.slice(0, visibleCount).map((dest, i) => {
            // Position each destination pseudo-randomly across the screen
            const row = Math.floor(i / 5);
            const col = i % 5;
            const x = 8 + col * 18 + (row % 2 ? 9 : 0); // staggered grid
            const y = 8 + row * 14;

            return (
              <div
                key={`${dest.city}-${i}`}
                className="absolute transition-all duration-700"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                <div className="animate-fade-in-up">
                  <span className="text-white/10 text-sm sm:text-base font-medium whitespace-nowrap">
                    {dest.emoji} {dest.city}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center px-6 max-w-md mx-auto">
          {/* Animated globe/compass */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping-slow" />
            <div className="absolute inset-2 rounded-full border-2 border-white/5 animate-ping-slower" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-slow-spin">🌍</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Scanning {loadingDestinations.length > visibleCount ? visibleCount : loadingDestinations.length}+ destinations
          </h2>
          <p className="text-white/50 text-sm mb-8">{generationStage}</p>

          {/* Progress bar — sleek */}
          <div className="w-full max-w-xs mx-auto">
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-white/30 text-xs">Finding your perfect matches...</p>
          </div>
        </div>

        <style jsx global>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.3; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          @keyframes ping-slower {
            0% { transform: scale(1); opacity: 0.2; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .animate-ping-slower {
            animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          @keyframes slow-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-slow-spin {
            animation: slow-spin 8s linear infinite;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Flash Vacation
          </h1>
          <p className="text-gray-600">
            Pick your dates, we'll handle the rest
          </p>
        </div>

        {/* Sign-in nudge for anonymous users */}
        {!authLoading && !user && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-primary-800">
                <button
                  onClick={() => router.push('/auth/login?redirect=/flash')}
                  className="font-medium underline hover:text-primary-900"
                >
                  Sign in
                </button>
                {' '}to personalize results with your travel profile
              </p>
            </div>
          </div>
        )}

        {/* Profile incomplete nudge for logged-in users */}
        {user && !preferencesLoading && !profileComplete && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-amber-800">
                  <button
                    onClick={() => router.push('/flash/wizard')}
                    className="font-medium underline hover:text-amber-900"
                  >
                    Complete your profile
                  </button>
                  {' '}for better trip recommendations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-red-800">Trip generation failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input form */}
        <FlashPlanInput
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />

        {/* Edit profile link - only for logged in users */}
        {user && profileComplete && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/flash/wizard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Edit travel profile
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
