// Hotel Categorization for Discover Flow
// Picks 3 featured hotels from search results: Closest, Budget, High-End

import { HotelOption } from '@/lib/liteapi/types';

export interface FeaturedHotels {
  closest: HotelOption;
  budget: HotelOption;
  highEnd: HotelOption;
}

/**
 * Haversine distance in meters between two GPS coordinates
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Categorize hotels into Closest, Budget, and High-End picks.
 * Each hotel appears in only one category.
 *
 * @param hotels - Scored hotel results (at least 3)
 * @param landmarkLat - Landmark GPS latitude (photo location)
 * @param landmarkLng - Landmark GPS longitude (photo location)
 * @returns Three featured hotels, or null if fewer than 3 hotels
 */
export function categorizeHotels(
  hotels: HotelOption[],
  landmarkLat: number,
  landmarkLng: number
): FeaturedHotels | null {
  if (hotels.length < 3) return null;

  // Add distance from landmark to each hotel
  const withDistance = hotels.map(h => ({
    hotel: h,
    distanceFromLandmark: haversineMeters(landmarkLat, landmarkLng, h.latitude, h.longitude),
  }));

  // 1. CLOSEST — nearest to the landmark, tiebreak by higher rating
  withDistance.sort((a, b) => {
    const distDiff = a.distanceFromLandmark - b.distanceFromLandmark;
    if (Math.abs(distDiff) < 50) return (b.hotel.rating || 0) - (a.hotel.rating || 0); // within 50m = tie
    return distDiff;
  });
  const closest = withDistance[0].hotel;

  // 2. BUDGET — cheapest per night among remaining, prefer 3+ stars, tiebreak by rating
  const remaining = withDistance.filter(h => h.hotel.id !== closest.id);

  const budgetCandidates = remaining.filter(h => h.hotel.stars >= 3);
  const budgetPool = budgetCandidates.length > 0 ? budgetCandidates : remaining;

  budgetPool.sort((a, b) => {
    const priceDiff = a.hotel.pricePerNight - b.hotel.pricePerNight;
    if (priceDiff !== 0) return priceDiff;
    return (b.hotel.rating || 0) - (a.hotel.rating || 0);
  });
  const budget = budgetPool[0].hotel;

  // 3. HIGH-END — highest stars + price among remaining, tiebreak by rating + reviews
  const finalRemaining = remaining.filter(h => h.hotel.id !== budget.id);

  if (finalRemaining.length === 0) {
    // Edge case: only 3 hotels and budget took the last one
    // Fall back to the second-closest as high-end
    const fallback = remaining.find(h => h.hotel.id !== budget.id);
    return {
      closest,
      budget,
      highEnd: fallback?.hotel || remaining[remaining.length - 1].hotel,
    };
  }

  finalRemaining.sort((a, b) => {
    // Sort by stars descending, then price descending, then rating descending
    const starsDiff = b.hotel.stars - a.hotel.stars;
    if (starsDiff !== 0) return starsDiff;
    const priceDiff = b.hotel.pricePerNight - a.hotel.pricePerNight;
    if (priceDiff !== 0) return priceDiff;
    return (b.hotel.rating || 0) - (a.hotel.rating || 0);
  });
  const highEnd = finalRemaining[0].hotel;

  return { closest, budget, highEnd };
}
