'use client';

import { WIZARD_STEPS, WIZARD_STEP_TITLES, type WizardStep } from '@/types/flash';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  completedSteps = [],
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary-600 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
        />

        {/* Step dots */}
        <div className="relative flex justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(index) || index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && (isCompleted || index <= currentStep);

            return (
              <button
                key={step}
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full
                  transition-all duration-200
                  ${isCurrent
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : isCompleted
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary-200' : 'cursor-default'}
                `}
                title={WIZARD_STEP_TITLES[step]}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current step label */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </p>
        <h2 className="text-xl font-semibold text-gray-900 mt-1">
          {WIZARD_STEP_TITLES[WIZARD_STEPS[currentStep]]}
        </h2>
      </div>
    </div>
  );
}
