'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  FlashVacationPreferences,
  FlashTripPackage,
  FlashGenerateParams,
} from '@/types/flash';

interface FlashVacationState {
  // Preferences
  preferences: FlashVacationPreferences | null;
  preferencesLoading: boolean;
  profileComplete: boolean;
  missingSteps: string[];

  // Generation
  isGenerating: boolean;
  generationProgress: number;
  generationStage: string;

  // Trips
  sessionId: string | null;
  trips: FlashTripPackage[];
  currentTripIndex: number;
  selectedTrip: FlashTripPackage | null;

  // Actions
  error: string | null;
}

const initialState: FlashVacationState = {
  preferences: null,
  preferencesLoading: true,
  profileComplete: false,
  missingSteps: [],
  isGenerating: false,
  generationProgress: 0,
  generationStage: '',
  sessionId: null,
  trips: [],
  currentTripIndex: 0,
  selectedTrip: null,
  error: null,
};

// Session storage key for trips
const TRIPS_STORAGE_KEY = 'flash_vacation_trips';

export function useFlashVacation() {
  const [state, setState] = useState<FlashVacationState>(initialState);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
    loadTripsFromSession();
  }, []);

  const loadPreferences = async () => {
    try {
      setState(prev => ({ ...prev, preferencesLoading: true }));
      const response = await fetch('/api/flash/preferences');

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          preferences: data.preferences,
          profileComplete: data.profileComplete,
          missingSteps: data.missingSteps || [],
          preferencesLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, preferencesLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setState(prev => ({ ...prev, preferencesLoading: false }));
    }
  };

  const loadTripsFromSession = () => {
    try {
      const stored = sessionStorage.getItem(TRIPS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          sessionId: data.sessionId,
          trips: data.trips,
          currentTripIndex: data.currentTripIndex || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load trips from session:', error);
    }
  };

  const saveTripsToSession = (sessionId: string, trips: FlashTripPackage[], currentIndex: number = 0) => {
    try {
      sessionStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify({
        sessionId,
        trips,
        currentTripIndex: currentIndex,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save trips to session:', error);
    }
  };

  const generateTrips = useCallback(async (params: FlashGenerateParams) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      generationStage: 'Starting...',
      error: null,
      trips: [],
      currentTripIndex: 0,
      selectedTrip: null,
    }));

    try {
      // Simulate progress updates (real progress would come from SSE)
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.generationProgress < 90) {
            const stages = [
              'Finding perfect destinations...',
              'Searching for flights...',
              'Finding best hotels...',
              'Building your trips...',
            ];
            const stageIndex = Math.floor(prev.generationProgress / 25);
            return {
              ...prev,
              generationProgress: prev.generationProgress + 5,
              generationStage: stages[stageIndex] || prev.generationStage,
            };
          }
          return prev;
        });
      }, 500);

      const response = await fetch('/api/flash/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate trips');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        generationStage: `Found ${data.trips.length} trips!`,
        sessionId: data.sessionId,
        trips: data.trips,
        currentTripIndex: 0,
      }));

      // Save to session storage
      saveTripsToSession(data.sessionId, data.trips, 0);

      return data.trips;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
        generationStage: '',
        error: error.message || 'Failed to generate trips',
      }));
      throw error;
    }
  }, []);

  const currentTrip = state.trips[state.currentTripIndex] || null;

  const swipeLeft = useCallback(() => {
    setState(prev => {
      const newIndex = prev.currentTripIndex + 1;
      if (newIndex >= prev.trips.length) {
        return prev; // No more trips
      }

      // Update session storage
      if (prev.sessionId) {
        saveTripsToSession(prev.sessionId, prev.trips, newIndex);
      }

      return {
        ...prev,
        currentTripIndex: newIndex,
        selectedTrip: null,
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.currentTripIndex <= 0) {
        return prev; // Already at first trip
      }

      const newIndex = prev.currentTripIndex - 1;

      // Update session storage
      if (prev.sessionId) {
        saveTripsToSession(prev.sessionId, prev.trips, newIndex);
      }

      return {
        ...prev,
        currentTripIndex: newIndex,
        selectedTrip: null,
      };
    });
  }, []);

  const swipeRight = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTrip: prev.trips[prev.currentTripIndex] || null,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTrip: null,
    }));
  }, []);

  const regenerate = useCallback(async (params: FlashGenerateParams) => {
    // Clear current trips
    setState(prev => ({
      ...prev,
      trips: [],
      currentTripIndex: 0,
      selectedTrip: null,
      sessionId: null,
    }));
    sessionStorage.removeItem(TRIPS_STORAGE_KEY);

    // Generate new batch
    return generateTrips(params);
  }, [generateTrips]);

  const hasMoreTrips = state.currentTripIndex < state.trips.length - 1;
  const isLastTrip = state.currentTripIndex === state.trips.length - 1;
  const tripsExhausted = state.trips.length > 0 && state.currentTripIndex >= state.trips.length;
  const canGoBack = state.currentTripIndex > 0;

  return {
    // State
    ...state,
    currentTrip,
    hasMoreTrips,
    isLastTrip,
    tripsExhausted,
    canGoBack,

    // Actions
    loadPreferences,
    generateTrips,
    swipeLeft,
    swipeRight,
    goBack,
    clearSelection,
    regenerate,
  };
}
