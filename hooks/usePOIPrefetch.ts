'use client';

import { useEffect, useRef } from 'react';
import type { FlashTripPackage } from '@/types/flash';

/**
 * Module-level cache for prefetched POI data.
 * Once a dynamic import resolves, Next.js caches the module internally,
 * so when the explore page calls the same import() it returns instantly.
 * We track which city keys we've already kicked off to avoid duplicate fetches.
 */
const prefetchedCities = new Set<string>();

function getCityKey(trip: FlashTripPackage): string {
  return trip.destination.city.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Silently prefetch the POI JSON for a destination.
 * This warms the Next.js module cache so that when the explore page
 * calls `import(`@/data/pois/${cityKey}.json`)`, it resolves instantly.
 */
async function prefetchPOIData(cityKey: string): Promise<void> {
  if (prefetchedCities.has(cityKey)) return;
  prefetchedCities.add(cityKey);

  try {
    // Same dynamic import path used by itinerary-generator.ts
    await import(`@/data/pois/${cityKey}.json`);
  } catch {
    // No POI data for this city — that's fine, the explore page
    // handles this gracefully with fallback data
  }
}

/**
 * Prefetch POI data for the current and next swipe cards.
 * This runs in the background while the user is looking at cards,
 * so when they swipe right the explore page loads instantly.
 *
 * @param trips     - All trip packages
 * @param currentIndex - Index of the currently visible card
 */
export function usePOIPrefetch(
  trips: FlashTripPackage[],
  currentIndex: number
) {
  const lastPrefetchedIndex = useRef(-1);

  useEffect(() => {
    // Avoid re-running for the same index
    if (currentIndex === lastPrefetchedIndex.current) return;
    lastPrefetchedIndex.current = currentIndex;

    const currentTrip = trips[currentIndex];
    const nextTrip = trips[currentIndex + 1];

    // Prefetch current card's POI data (high priority — user might swipe right)
    if (currentTrip) {
      prefetchPOIData(getCityKey(currentTrip));
    }

    // Prefetch next card too (low priority, but keeps the pipeline warm)
    if (nextTrip) {
      // Small delay so we don't compete with current card's prefetch
      const timer = setTimeout(() => {
        prefetchPOIData(getCityKey(nextTrip));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [trips, currentIndex]);
}
