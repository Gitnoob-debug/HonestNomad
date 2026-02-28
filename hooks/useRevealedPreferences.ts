'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import type { FlashTripPackage } from '@/types/flash';
import {
  RevealedPreferences,
  createEmptyPreferences,
  recordSwipe,
  recordPOIAction,
  recordFlightSelection,
  recordHotelSelection,
  recordBooking,
  getPreferenceSummary,
  hasEnoughSignals,
} from '@/lib/flash/preferenceEngine';
import type { DestinationVibe } from '@/types/flash';
import {
  loadRevealedPreferences,
  saveRevealedPreferences,
  clearRevealedPreferences,
} from '@/lib/flash/preferenceStorage';

interface UseRevealedPreferencesReturn {
  preferences: RevealedPreferences;
  isLoading: boolean;
  hasEnoughData: boolean;
  summary: ReturnType<typeof getPreferenceSummary> | null;

  // Actions
  trackSwipe: (
    trip: FlashTripPackage,
    direction: 'left' | 'right',
    dwellTimeMs?: number,
    expandedCard?: boolean
  ) => void;
  trackPOIAction: (
    poiType: string,
    action: 'favorite' | 'unfavorite' | 'click' | 'expand',
    poiCategory?: string
  ) => void;
  trackFlightSelection: (selection: {
    destinationId: string;
    departureHour: number;
    price: number;
    stops: number;
    duration: number;
    cabinClass: string;
    isRedEye: boolean;
  }) => void;
  trackHotelSelection: (selection: {
    destinationId: string;
    stars: number;
    pricePerNight: number;
    amenities: string[];
  }) => void;
  trackBooking: (booking: {
    destinationId: string;
    vibes: DestinationVibe[];
    region: string;
    tripCost: number;
    tripLengthDays: number;
  }) => void;
  resetPreferences: () => Promise<void>;
}

// Debounce save to avoid too many writes
const SAVE_DEBOUNCE_MS = 2000;

export function useRevealedPreferences(): UseRevealedPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<RevealedPreferences>(createEmptyPreferences());
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPrefsRef = useRef<RevealedPreferences | null>(null);

  // Load preferences on mount / user change
  useEffect(() => {
    if (!user?.id) {
      setPreferences(createEmptyPreferences());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadRevealedPreferences(user.id)
      .then(prefs => {
        setPreferences(prefs);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load revealed preferences:', err);
        setIsLoading(false);
      });
  }, [user?.id]);

  // Debounced save function
  const scheduleSave = useCallback((prefs: RevealedPreferences) => {
    if (!user?.id) return;

    pendingPrefsRef.current = prefs;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingPrefsRef.current && user?.id) {
        saveRevealedPreferences(user.id, pendingPrefsRef.current)
          .then(success => {
            if (success) {
              console.log('[RevealedPrefs] Saved to Supabase');
            }
          })
          .catch(err => {
            console.error('[RevealedPrefs] Save failed:', err);
          });
      }
    }, SAVE_DEBOUNCE_MS);
  }, [user?.id]);

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingPrefsRef.current && user?.id) {
        // Synchronous save attempt on unmount
        saveRevealedPreferences(user.id, pendingPrefsRef.current);
      }
    };
  }, [user?.id]);

  const trackSwipe = useCallback((
    trip: FlashTripPackage,
    direction: 'left' | 'right',
    dwellTimeMs?: number,
    expandedCard?: boolean
  ) => {
    setPreferences(prev => {
      const updated = recordSwipe(prev, trip, direction, dwellTimeMs, expandedCard);
      scheduleSave(updated);

      return updated;
    });
  }, [scheduleSave]);

  const trackPOIAction = useCallback((
    poiType: string,
    action: 'favorite' | 'unfavorite' | 'click' | 'expand',
    poiCategory?: string
  ) => {
    setPreferences(prev => {
      const updated = recordPOIAction(prev, poiType, action, poiCategory);
      scheduleSave(updated);

      return updated;
    });
  }, [scheduleSave]);

  const trackFlightSelection = useCallback((selection: {
    destinationId: string;
    departureHour: number;
    price: number;
    stops: number;
    duration: number;
    cabinClass: string;
    isRedEye: boolean;
  }) => {
    setPreferences(prev => {
      const updated = recordFlightSelection(prev, selection);
      scheduleSave(updated);

      return updated;
    });
  }, [scheduleSave]);

  const trackHotelSelection = useCallback((selection: {
    destinationId: string;
    stars: number;
    pricePerNight: number;
    amenities: string[];
  }) => {
    setPreferences(prev => {
      const updated = recordHotelSelection(prev, selection);
      scheduleSave(updated);

      return updated;
    });
  }, [scheduleSave]);

  const trackBooking = useCallback((booking: {
    destinationId: string;
    vibes: DestinationVibe[];
    region: string;
    tripCost: number;
    tripLengthDays: number;
  }) => {
    setPreferences(prev => {
      const updated = recordBooking(prev, booking);
      scheduleSave(updated);

      return updated;
    });
  }, [scheduleSave]);

  const resetPreferences = useCallback(async () => {
    if (!user?.id) return;

    const empty = createEmptyPreferences();
    setPreferences(empty);
    await clearRevealedPreferences(user.id);
    console.log('[RevealedPrefs] Reset to empty');
  }, [user?.id]);

  const hasEnoughData = hasEnoughSignals(preferences);
  const summary = hasEnoughData ? getPreferenceSummary(preferences) : null;

  return {
    preferences,
    isLoading,
    hasEnoughData,
    summary,
    trackSwipe,
    trackPOIAction,
    trackFlightSelection,
    trackHotelSelection,
    trackBooking,
    resetPreferences,
  };
}
