'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  FlashVacationPreferences,
  FlashTripPackage,
  FlashGenerateParams,
} from '@/types/flash';

// Track price loading state for each trip
interface TripPriceState {
  // Flight pricing
  flightLoading: boolean;
  flightLoaded: boolean;
  flightError?: string;
  flightPrice?: number;
  // Hotel pricing
  hotelLoading: boolean;
  hotelLoaded: boolean;
  hotelError?: string;
  hotelPrice?: number;
  // Combined state (for UI)
  loading: boolean;  // True if either still loading
  loaded: boolean;   // True only when BOTH loaded
  error?: string;
  realPrice?: number; // Combined total
  overBudget?: boolean;
  budgetDiff?: number; // Positive = over budget, negative = under
}

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
  lastGenerateParams: FlashGenerateParams | null;

  // Price loading (keyed by trip id)
  tripPrices: Record<string, TripPriceState>;

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
  lastGenerateParams: null,
  tripPrices: {},
  error: null,
};

// Number of trips to generate per search
const TRIPS_PER_SEARCH = 16;

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
          lastGenerateParams: data.lastGenerateParams || null,
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
    lastParams?: FlashGenerateParams | null
  ) => {
    try {
      sessionStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify({
        sessionId,
        trips,
        currentTripIndex: currentIndex,
        lastGenerateParams: lastParams,
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
        body: JSON.stringify({
          ...params,
          count: TRIPS_PER_SEARCH,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate trips');
      }

      const data = await response.json();

      // Initialize price states for all trips
      const initialPriceStates: Record<string, TripPriceState> = {};
      data.trips.forEach((trip: FlashTripPackage) => {
        initialPriceStates[trip.id] = {
          flightLoading: true,
          flightLoaded: false,
          hotelLoading: true,
          hotelLoaded: false,
          loading: true,
          loaded: false,
        };
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        generationStage: `Found ${data.trips.length} trips!`,
        sessionId: data.sessionId,
        trips: data.trips,
        currentTripIndex: 0,
        lastGenerateParams: params,
        tripPrices: initialPriceStates,
      }));

      // Save to session storage
      saveTripsToSession(data.sessionId, data.trips, 0, params);

      // Start background price loading
      loadPricesInBackground(data.trips, params);

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
      // Allow going past the last trip to show end card
      if (newIndex > prev.trips.length) {
        return prev;
      }

      // Update session storage
      if (prev.sessionId) {
        saveTripsToSession(prev.sessionId, prev.trips, newIndex, prev.lastGenerateParams);
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
        saveTripsToSession(prev.sessionId, prev.trips, newIndex, prev.lastGenerateParams);
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

  // Background price loading - fetches real flight AND hotel prices for all trips
  const loadPricesInBackground = useCallback(async (
    trips: FlashTripPackage[],
    params: FlashGenerateParams
  ) => {
    // Get user's budget max from preferences
    const budgetMax = state.preferences?.budget?.perTripMax || 5000;
    const nights = Math.ceil(
      (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Process trips in parallel with controlled concurrency
    const concurrency = 3; // Reduced for more API calls per trip
    const queue = [...trips];

    // Helper to update price state for a trip
    const updatePriceState = (
      tripId: string,
      update: Partial<TripPriceState>,
      tripUpdate?: Partial<FlashTripPackage>
    ) => {
      setState(prev => {
        const currentPriceState = prev.tripPrices[tripId] || {
          flightLoading: true,
          flightLoaded: false,
          hotelLoading: true,
          hotelLoaded: false,
          loading: true,
          loaded: false,
        };

        const newPriceState = { ...currentPriceState, ...update };

        // Calculate combined state
        const bothLoaded = newPriceState.flightLoaded && newPriceState.hotelLoaded;
        const eitherLoading = newPriceState.flightLoading || newPriceState.hotelLoading;
        const combinedPrice = (newPriceState.flightPrice || 0) + (newPriceState.hotelPrice || 0);
        const overBudget = combinedPrice > budgetMax;

        newPriceState.loading = eitherLoading;
        newPriceState.loaded = bothLoaded;
        newPriceState.realPrice = combinedPrice;
        newPriceState.overBudget = overBudget;
        newPriceState.budgetDiff = combinedPrice - budgetMax;

        const newTripPrices = {
          ...prev.tripPrices,
          [tripId]: newPriceState,
        };

        // Update trip object if provided
        let newTrips = prev.trips;
        if (tripUpdate) {
          newTrips = prev.trips.map(t => {
            if (t.id === tripId) {
              const updated = { ...t, ...tripUpdate };
              // Recalculate total pricing
              updated.pricing = {
                ...updated.pricing,
                total: (newPriceState.flightPrice || updated.pricing.flight) + (newPriceState.hotelPrice || updated.pricing.hotel),
                perPerson: ((newPriceState.flightPrice || updated.pricing.flight) + (newPriceState.hotelPrice || updated.pricing.hotel)) / (state.preferences?.travelers?.adults || 2),
              };
              return updated;
            }
            return t;
          });

          // Save updated trips to session
          if (prev.sessionId) {
            saveTripsToSession(prev.sessionId, newTrips, prev.currentTripIndex, prev.lastGenerateParams);
          }
        }

        return {
          ...prev,
          trips: newTrips,
          tripPrices: newTripPrices,
        };
      });
    };

    // Fetch flight price for a trip
    const fetchFlightPrice = async (trip: FlashTripPackage) => {
      try {
        const response = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: state.preferences?.homeBase?.airportCode || 'JFK',
            destination: trip.destination.airportCode,
            departureDate: params.departureDate,
            returnDate: params.returnDate,
            quickPrice: true,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch flight price');

        const data = await response.json();
        const bestFlight = data.flights?.[0];
        const flightPrice = bestFlight?.pricing?.totalAmount || trip.pricing.flight;

        updatePriceState(trip.id, {
          flightLoading: false,
          flightLoaded: true,
          flightPrice,
        }, {
          flight: {
            ...trip.flight,
            price: flightPrice,
            offerId: bestFlight?.duffelOfferId || trip.flight.offerId,
          },
          pricing: {
            ...trip.pricing,
            flight: flightPrice,
          },
          flightsLoaded: true,
        });
      } catch (error) {
        updatePriceState(trip.id, {
          flightLoading: false,
          flightLoaded: false,
          flightError: 'Could not verify flight price',
          flightPrice: trip.pricing.flight, // Keep estimate
        });
      }
    };

    // Fetch hotel price for a trip
    const fetchHotelPrice = async (trip: FlashTripPackage) => {
      try {
        const response = await fetch('/api/hotels/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: trip.destination.latitude,
            longitude: trip.destination.longitude,
            checkin: params.departureDate,
            checkout: params.returnDate,
            destinationName: trip.destination.city,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch hotel price');

        const data = await response.json();
        const bestHotel = data.hotels?.[0];
        const hotelPrice = bestHotel?.totalPrice || nights * 150; // Fallback estimate

        updatePriceState(trip.id, {
          hotelLoading: false,
          hotelLoaded: true,
          hotelPrice,
        }, {
          hotel: bestHotel ? {
            name: bestHotel.name,
            stars: bestHotel.stars || 4,
            rating: bestHotel.rating || 8.0,
            reviewCount: bestHotel.reviewCount || 100,
            amenities: bestHotel.amenities || [],
            pricePerNight: bestHotel.pricePerNight || Math.round(hotelPrice / nights),
            totalPrice: hotelPrice,
            currency: trip.pricing.currency,
            imageUrl: bestHotel.imageUrl || '',
          } : undefined,
          pricing: {
            ...trip.pricing,
            hotel: hotelPrice,
          },
        });
      } catch (error) {
        // Use estimate for hotels
        const estimatedHotelPrice = nights * 150;
        updatePriceState(trip.id, {
          hotelLoading: false,
          hotelLoaded: false,
          hotelError: 'Could not verify hotel price',
          hotelPrice: estimatedHotelPrice,
        });
      }
    };

    // Process each trip - fetch flight and hotel in parallel
    const processTrip = async (trip: FlashTripPackage) => {
      await Promise.all([
        fetchFlightPrice(trip),
        fetchHotelPrice(trip),
      ]);
    };

    // Process in batches
    for (let i = 0; i < queue.length; i += concurrency) {
      const batch = queue.slice(i, i + concurrency);
      await Promise.all(batch.map(processTrip));
    }
  }, [state.preferences]);

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
