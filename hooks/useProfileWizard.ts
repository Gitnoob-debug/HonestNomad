'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  FlashVacationPreferences,
  WizardStep,
  TravelerConfig,
  HomeBase,
  BudgetConfig,
  AccommodationPreferences,
  TravelStyleConfig,
  InterestConfig,
  RestrictionConfig,
} from '@/types/flash';
import { WIZARD_STEPS, DEFAULT_FLASH_PREFERENCES } from '@/types/flash';

interface UseProfileWizardOptions {
  initialPreferences?: Partial<FlashVacationPreferences>;
  onComplete?: (preferences: FlashVacationPreferences) => void;
}

interface WizardState {
  currentStep: number;
  totalSteps: number;
  currentStepName: WizardStep;
  stepData: Partial<FlashVacationPreferences>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export function useProfileWizard(options: UseProfileWizardOptions = {}) {
  const { initialPreferences, onComplete } = options;

  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    totalSteps: WIZARD_STEPS.length,
    currentStepName: WIZARD_STEPS[0],
    stepData: initialPreferences || DEFAULT_FLASH_PREFERENCES,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/flash/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setState(prev => ({
            ...prev,
            stepData: { ...DEFAULT_FLASH_PREFERENCES, ...data.preferences },
            isLoading: false,
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const savePreferences = async (data: Partial<FlashVacationPreferences>): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    try {
      const response = await fetch('/api/flash/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      setState(prev => ({ ...prev, isSaving: false }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to save preferences',
      }));
      return false;
    }
  };

  const updateStepData = useCallback(<K extends keyof FlashVacationPreferences>(
    key: K,
    value: FlashVacationPreferences[K]
  ) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [key]: value,
      },
    }));
  }, []);

  const updateTravelers = useCallback((travelers: Partial<TravelerConfig>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        travelers: { ...prev.stepData.travelers, ...travelers } as TravelerConfig,
      },
    }));
  }, []);

  const updateHomeBase = useCallback((homeBase: Partial<HomeBase>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        homeBase: { ...prev.stepData.homeBase, ...homeBase } as HomeBase,
      },
    }));
  }, []);

  const updateBudget = useCallback((budget: Partial<BudgetConfig>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        budget: { ...prev.stepData.budget, ...budget } as BudgetConfig,
      },
    }));
  }, []);

  const updateAccommodation = useCallback((accommodation: Partial<AccommodationPreferences>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        accommodation: { ...prev.stepData.accommodation, ...accommodation } as AccommodationPreferences,
      },
    }));
  }, []);

  const updateTravelStyle = useCallback((travelStyle: Partial<TravelStyleConfig>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        travelStyle: { ...prev.stepData.travelStyle, ...travelStyle } as TravelStyleConfig,
      },
    }));
  }, []);

  const updateInterests = useCallback((interests: Partial<InterestConfig>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        interests: { ...prev.stepData.interests, ...interests } as InterestConfig,
      },
    }));
  }, []);

  const updateRestrictions = useCallback((restrictions: Partial<RestrictionConfig>) => {
    setState(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        restrictions: { ...prev.stepData.restrictions, ...restrictions } as RestrictionConfig,
      },
    }));
  }, []);

  const nextStep = useCallback(async () => {
    // Save current step data
    const saved = await savePreferences(state.stepData);
    if (!saved) return;

    if (state.currentStep < WIZARD_STEPS.length - 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        currentStepName: WIZARD_STEPS[prev.currentStep + 1],
      }));
    }
  }, [state.currentStep, state.stepData]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        currentStepName: WIZARD_STEPS[prev.currentStep - 1],
      }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setState(prev => ({
        ...prev,
        currentStep: step,
        currentStepName: WIZARD_STEPS[step],
      }));
    }
  }, []);

  const completeWizard = useCallback(async () => {
    const finalData = {
      ...state.stepData,
      profileCompleted: true,
      profileCompletedAt: new Date().toISOString(),
    };

    const saved = await savePreferences(finalData);
    if (saved && onComplete) {
      onComplete(finalData as FlashVacationPreferences);
    }
    return saved;
  }, [state.stepData, onComplete]);

  const isStepValid = useCallback((step: WizardStep): boolean => {
    const data = state.stepData;

    switch (step) {
      case 'travelers':
        return !!data.travelers?.type && (data.travelers?.adults || 0) >= 1;
      case 'homeBase':
        return !!data.homeBase?.airportCode && !!data.homeBase?.city;
      case 'budget':
        return (data.budget?.perTripMax || 0) > 0;
      case 'accommodation':
        return data.accommodation?.minStars !== undefined;
      case 'travelStyle':
        return data.travelStyle?.adventureRelaxation !== undefined;
      case 'interests':
        return (data.interests?.primary?.length || 0) >= 1;
      case 'restrictions':
        return true; // Optional step
      case 'surpriseTolerance':
        return data.surpriseTolerance !== undefined;
      default:
        return false;
    }
  }, [state.stepData]);

  const canProceed = isStepValid(state.currentStepName);
  const canGoBack = state.currentStep > 0;
  const isLastStep = state.currentStep === WIZARD_STEPS.length - 1;

  return {
    // State
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    currentStepName: state.currentStepName,
    stepData: state.stepData,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    canProceed,
    canGoBack,
    isLastStep,

    // Update functions
    updateStepData,
    updateTravelers,
    updateHomeBase,
    updateBudget,
    updateAccommodation,
    updateTravelStyle,
    updateInterests,
    updateRestrictions,

    // Navigation
    nextStep,
    prevStep,
    goToStep,
    completeWizard,
    isStepValid,
  };
}
