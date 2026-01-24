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
  isLoadingMore: boolean;
  generationProgress: number;
  generationStage: string;

  // Trips
  sessionId: string | null;
  trips: FlashTripPackage[];
  currentTripIndex: number;
  selectedTrip: FlashTripPackage | null;
  lastGenerateParams: FlashGenerateParams | null;
  loadedBatches: number; // Track how many additional batches we've loaded

  // Actions
  error: string | null;
}

const initialState: FlashVacationState = {
  preferences: null,
  preferencesLoading: true,
  profileComplete: false,
  missingSteps: [],
  isGenerating: false,
  isLoadingMore: false,
  generationProgress: 0,
  generationStage: '',
  sessionId: null,
  trips: [],
  currentTripIndex: 0,
  selectedTrip: null,
  lastGenerateParams: null,
  loadedBatches: 0,
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
        console.log('[LazyLoad] Loaded from session:', {
          tripsCount: data.trips?.length,
          currentIndex: data.currentTripIndex,
          hasParams: !!data.lastGenerateParams,
          loadedBatches: data.loadedBatches || 0
        });
        setState(prev => ({
          ...prev,
          sessionId: data.sessionId,
          trips: data.trips,
          currentTripIndex: data.currentTripIndex || 0,
          lastGenerateParams: data.lastGenerateParams || null,
          loadedBatches: data.loadedBatches || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load trips from session:', error);
    }
  };

  const saveTripsToSession = (
    sessionId: string,
    trips: FlashTripPackage[],
    currentIndex: number = 0,
    lastParams?: FlashGenerateParams | null,
    loadedBatches: number = 0
  ) => {
    try {
      sessionStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify({
        sessionId,
        trips,
        currentTripIndex: currentIndex,
        lastGenerateParams: lastParams,
        loadedBatches,
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
        lastGenerateParams: params,
        loadedBatches: 0,
      }));

      // Save to session storage
      saveTripsToSession(data.sessionId, data.trips, 0, params, 0);

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

  // Load more trips in the background (supports continuous loading)
  const MAX_BATCHES = 10; // Limit total batches to prevent infinite loading

  const loadMoreTrips = useCallback(async () => {
    // Don't load if already loading, no params, or reached max batches
    if (state.isLoadingMore || !state.lastGenerateParams || state.loadedBatches >= MAX_BATCHES) {
      return;
    }

    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      // Request 8 more trips, excluding destinations we already have
      const existingCities = state.trips.map(t => t.destination.city.toLowerCase());
      const response = await fetch('/api/flash/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.lastGenerateParams,
          count: 8,
          excludeDestinations: existingCities,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load more trips');
      }

      const data = await response.json();

      if (data.trips && data.trips.length > 0) {
        setState(prev => {
          const newTrips = [...prev.trips, ...data.trips];
          const newBatchCount = prev.loadedBatches + 1;
          // Save to session with updated trips
          if (prev.sessionId) {
            saveTripsToSession(prev.sessionId, newTrips, prev.currentTripIndex, prev.lastGenerateParams, newBatchCount);
          }
          return {
            ...prev,
            trips: newTrips,
            isLoadingMore: false,
            loadedBatches: newBatchCount,
          };
        });
        console.log(`[LazyLoad] Loaded batch ${state.loadedBatches + 1}: ${data.trips.length} more trips (total: ${state.trips.length + data.trips.length})`);
      } else {
        // No more trips available, mark as max reached
        setState(prev => ({ ...prev, isLoadingMore: false, loadedBatches: MAX_BATCHES }));
      }
    } catch (error) {
      console.error('Failed to load more trips:', error);
      setState(prev => ({ ...prev, isLoadingMore: false }));
    }
  }, [state.isLoadingMore, state.lastGenerateParams, state.loadedBatches, state.trips]);

  const swipeLeft = useCallback(() => {
    setState(prev => {
      const newIndex = prev.currentTripIndex + 1;
      if (newIndex >= prev.trips.length) {
        return prev; // No more trips
      }

      // Update session storage
      if (prev.sessionId) {
        saveTripsToSession(prev.sessionId, prev.trips, newIndex, prev.lastGenerateParams, prev.loadedBatches);
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
        saveTripsToSession(prev.sessionId, prev.trips, newIndex, prev.lastGenerateParams, prev.loadedBatches);
      }

      return {
        ...prev,
        currentTripIndex: newIndex,
        selectedTrip: null,
      };
    });
  }, []);

  // Trigger loading more trips when user reaches card 4 (index 3)
  // Also trigger when approaching the end of current trips
  useEffect(() => {
    const LOAD_MORE_THRESHOLD = 3; // When at card 4 (0-indexed as 3)
    const REMAINING_THRESHOLD = 4; // Load more when 4 or fewer trips remaining

    const tripsRemaining = state.trips.length - state.currentTripIndex - 1;
    const shouldLoadMore =
      !state.isLoadingMore &&
      state.loadedBatches < MAX_BATCHES &&
      state.lastGenerateParams &&
      state.trips.length > 0 &&
      (state.currentTripIndex >= LOAD_MORE_THRESHOLD || tripsRemaining <= REMAINING_THRESHOLD);

    // Debug logging for lazy load
    console.log('[LazyLoad] Check:', {
      currentIndex: state.currentTripIndex,
      tripsLength: state.trips.length,
      tripsRemaining,
      isLoadingMore: state.isLoadingMore,
      loadedBatches: state.loadedBatches,
      maxBatches: MAX_BATCHES,
      hasParams: !!state.lastGenerateParams,
      shouldTrigger: shouldLoadMore
    });

    // Trigger if:
    // 1. User has reached threshold OR is running low on trips
    // 2. We're not already loading
    // 3. We haven't reached max batches
    // 4. We have params to use
    if (shouldLoadMore) {
      console.log('[LazyLoad] Triggering loadMoreTrips! Batch:', state.loadedBatches + 1);
      loadMoreTrips();
    }
  }, [state.currentTripIndex, state.trips.length, state.isLoadingMore, state.loadedBatches, state.lastGenerateParams, loadMoreTrips]);

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
    loadMoreTrips,
    swipeLeft,
    swipeRight,
    goBack,
    clearSelection,
    regenerate,
  };
}
