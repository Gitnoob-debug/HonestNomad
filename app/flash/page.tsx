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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/flash');
    }
  }, [user, authLoading, router]);

  // Redirect to swipe page when trips are generated
  useEffect(() => {
    if (trips.length > 0 && !isGenerating) {
      router.push('/flash/swipe');
    }
  }, [trips, isGenerating, router]);

  const handleGenerate = async (params: FlashGenerateParams) => {
    try {
      await generateTrips(params);
    } catch (err) {
      // Error is already in state
      console.error('Generation failed:', err);
    }
  };

  if (authLoading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show wizard prompt if profile incomplete
  if (!profileComplete) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Flash Vacation
            </h1>
            <p className="text-gray-600">
              Complete your profile to unlock instant trip generation
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Set up your travel profile
            </h2>
            <p className="text-gray-600 mb-6">
              Tell us about your travel preferences once, and we'll generate personalized trip
              packages instantly — just pick your dates and swipe!
            </p>

            {missingSteps.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Missing steps:</p>
                <div className="flex flex-wrap gap-2">
                  {missingSteps.map((step) => (
                    <span
                      key={step}
                      className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
                    >
                      {step.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/flash/wizard')}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Complete Profile Setup
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              Takes about 3-5 minutes
            </p>
          </div>
        </div>
      </main>
    );
  }

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
    <main className="min-h-screen bg-gray-50 py-12">
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

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Input form */}
        <FlashPlanInput
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />

        {/* Edit profile link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/flash/wizard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Edit travel profile
          </button>
        </div>
      </div>
    </main>
  );
}
