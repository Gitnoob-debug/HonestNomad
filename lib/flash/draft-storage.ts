/**
 * Draft Trip Storage - Persists unfinished trip data to localStorage
 * Allows users to continue where they left off, shows as "unfinished trip" in My Bookings
 */

import type { FlashTripPackage } from '@/types/flash';
import type { ItineraryDay } from './itinerary-generator';

export interface DraftTrip {
  id: string;
  trip: FlashTripPackage;
  itinerary: ItineraryDay[];
  itineraryType: string;
  favorites: string[]; // Array of stop IDs
  favoriteStops: any[]; // Full stop data for favorites
  step: string;
  createdAt: string;
  updatedAt: string;
}

const DRAFT_STORAGE_KEY = 'flash_draft_trips';
const MAX_DRAFTS = 5; // Keep only the 5 most recent drafts

/**
 * Generate a unique ID for a draft based on trip data
 */
function generateDraftId(trip: FlashTripPackage): string {
  const destId = trip.destination.city.toLowerCase().replace(/\s+/g, '-');
  const dateKey = `${trip.dates.departure}-${trip.dates.return}`;
  return `${destId}-${dateKey}`;
}

/**
 * Get all draft trips from localStorage
 */
export function getDraftTrips(): DraftTrip[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load draft trips:', e);
    return [];
  }
}

/**
 * Save or update a draft trip
 */
export function saveDraftTrip(data: {
  trip: FlashTripPackage;
  itinerary: ItineraryDay[];
  itineraryType: string;
  favorites: Set<string>;
  favoriteStops: any[];
  step: string;
}): DraftTrip {
  const drafts = getDraftTrips();
  const draftId = generateDraftId(data.trip);
  const now = new Date().toISOString();

  // Find existing draft or create new
  const existingIndex = drafts.findIndex(d => d.id === draftId);

  const draft: DraftTrip = {
    id: draftId,
    trip: data.trip,
    itinerary: data.itinerary,
    itineraryType: data.itineraryType,
    favorites: Array.from(data.favorites),
    favoriteStops: data.favoriteStops,
    step: data.step,
    createdAt: existingIndex >= 0 ? drafts[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    // Update existing
    drafts[existingIndex] = draft;
  } else {
    // Add new draft at beginning
    drafts.unshift(draft);
  }

  // Keep only MAX_DRAFTS most recent
  const trimmed = drafts.slice(0, MAX_DRAFTS);

  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save draft trip:', e);
  }

  return draft;
}

/**
 * Get a specific draft by ID
 */
export function getDraftTrip(draftId: string): DraftTrip | null {
  const drafts = getDraftTrips();
  return drafts.find(d => d.id === draftId) || null;
}

/**
 * Get the most recent draft (if any)
 */
export function getMostRecentDraft(): DraftTrip | null {
  const drafts = getDraftTrips();
  return drafts[0] || null;
}

/**
 * Delete a draft trip
 */
export function deleteDraftTrip(draftId: string): void {
  const drafts = getDraftTrips();
  const filtered = drafts.filter(d => d.id !== draftId);

  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete draft trip:', e);
  }
}

/**
 * Delete all draft trips
 */
export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear drafts:', e);
  }
}

/**
 * Check if a trip has an existing draft
 */
export function hasDraft(trip: FlashTripPackage): boolean {
  const draftId = generateDraftId(trip);
  return getDraftTrip(draftId) !== null;
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
