/**
 * Draft Trip Storage - Persists unfinished trip data to Supabase
 * Allows users to continue where they left off across devices
 * Shows as "unfinished trip" in My Bookings
 */

import type { FlashTripPackage } from '@/types/flash';
import type { ItineraryDay } from './itinerary-generator';

export interface DraftTrip {
  id: string;
  trip: FlashTripPackage;
  itinerary: ItineraryDay[];
  itineraryType: string;
  favorites: string[]; // Array of POI IDs
  favoriteStops: any[]; // Full stop data for favorites
  step: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all draft trips for the current user
 */
export async function getDraftTrips(): Promise<DraftTrip[]> {
  try {
    const response = await fetch('/api/drafts', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in - return empty
        return [];
      }
      throw new Error('Failed to fetch drafts');
    }

    const data = await response.json();
    return data.drafts || [];
  } catch (e) {
    console.error('Failed to load draft trips:', e);
    return [];
  }
}

/**
 * Save or update a draft trip
 */
export async function saveDraftTrip(data: {
  trip: FlashTripPackage;
  itinerary: ItineraryDay[];
  itineraryType: string;
  favorites: Set<string>;
  favoriteStops: any[];
  step: string;
}): Promise<DraftTrip | null> {
  try {
    const response = await fetch('/api/drafts', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip: data.trip,
        itinerary: data.itinerary,
        itineraryType: data.itineraryType,
        favorites: Array.from(data.favorites),
        favoriteStops: data.favoriteStops,
        step: data.step,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in - silently fail
        return null;
      }
      throw new Error('Failed to save draft');
    }

    const result = await response.json();
    return result.draft;
  } catch (e) {
    console.error('Failed to save draft trip:', e);
    return null;
  }
}

/**
 * Get a specific draft by ID
 */
export async function getDraftTrip(draftId: string): Promise<DraftTrip | null> {
  try {
    const response = await fetch(`/api/drafts/${draftId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.draft || null;
  } catch (e) {
    console.error('Failed to load draft trip:', e);
    return null;
  }
}

/**
 * Delete a draft trip
 */
export async function deleteDraftTrip(draftId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/drafts/${draftId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    return response.ok;
  } catch (e) {
    console.error('Failed to delete draft trip:', e);
    return false;
  }
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
