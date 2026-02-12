'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFlashVacation } from '@/hooks/useFlashVacation';
import { FlashPlanInput } from '@/components/flash/FlashPlanInput';
import { Spinner } from '@/components/ui';
import type { FlashGenerateParams } from '@/types/flash';

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
    try {
      console.log('Starting trip generation with params:', params);
      const result = await generateTrips(params);
      console.log('Generation result:', result);
    } catch (err: any) {
      console.error('Generation failed:', err);
    }
  };

  // Show generation loading state
  if (isGenerating) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto">
              <svg className="animate-spin w-full h-full text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Finding Your Perfect Trips
          </h2>
          <p className="text-gray-600 mb-6">{generationStage}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{generationProgress}%</p>
        </div>
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
