'use client';

import { useRouter } from 'next/navigation';
import { useProfileWizard } from '@/hooks/useProfileWizard';
import { StepIndicator } from './StepIndicator';
import { TravelersStep } from './TravelersStep';
import { HomeBaseStep } from './HomeBaseStep';
import { BudgetAccommodationStep } from './BudgetAccommodationStep';
import { WIZARD_STEP_TITLES } from '@/types/flash';
import { Button, Spinner } from '@/components/ui';

export function WizardContainer() {
  const router = useRouter();
  const {
    currentStep,
    totalSteps,
    currentStepName,
    stepData,
    isLoading,
    isSaving,
    error,
    canProceed,
    canGoBack,
    isLastStep,
    updateTravelers,
    updateHomeBase,
    updateBudget,
    updateAccommodation,
    nextStep,
    prevStep,
    goToStep,
    completeWizard,
  } = useProfileWizard({
    onComplete: () => {
      router.push('/flash');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    const success = await completeWizard();
    if (success) {
      router.push('/flash');
    }
  };

  const renderStep = () => {
    switch (currentStepName) {
      case 'travelers':
        return (
          <TravelersStep
            data={stepData.travelers || {}}
            onChange={updateTravelers}
          />
        );
      case 'homeBase':
        return (
          <HomeBaseStep
            data={stepData.homeBase || {}}
            onChange={updateHomeBase}
          />
        );
      case 'budgetAccommodation':
        return (
          <BudgetAccommodationStep
            budgetData={stepData.budget || {}}
            accommodationData={stepData.accommodation || {}}
            onBudgetChange={updateBudget}
            onAccommodationChange={updateAccommodation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepClick={goToStep}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {WIZARD_STEP_TITLES[currentStepName]}
        </h2>
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {canGoBack && (
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={isSaving}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLastStep ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={!canProceed || isSaving}
              loading={isSaving}
            >
              Complete Setup
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!canProceed || isSaving}
              loading={isSaving}
            >
              Continue
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Save indicator */}
      {isSaving && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Saving your preferences...</p>
        </div>
      )}
    </div>
  );
}
