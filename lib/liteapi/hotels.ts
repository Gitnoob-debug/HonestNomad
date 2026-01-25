// LiteAPI Hotel Search Service
// Searches and filters hotels based on user preferences

import {
  searchHotelsByLocation,
  getHotelDetails,
  getHotelRates,
} from './client';
import {
  LiteAPIHotel,
  LiteAPIHotelDetails,
  HotelOption,
  LiteAPIOccupancy,
} from './types';
import { FlashVacationPreferences } from '@/types/flash';

// Amenity mapping from our preferences to LiteAPI facility names
const AMENITY_MAPPINGS: Record<string, string[]> = {
  'pool': ['Swimming pool', 'Indoor pool', 'Outdoor pool', 'Heated pool'],
  'wifi': ['Free WiFi', 'WiFi', 'Free wired internet', 'Internet access'],
  'gym': ['Fitness', 'Gym', 'Fitness facilities', 'Fitness center'],
  'spa': ['Spa', 'Spa/wellness', 'Massage services', 'Sauna'],
  'restaurant': ['Restaurant', 'On-site restaurant'],
  'parking': ['Parking', 'Free parking', 'Self parking', 'Valet parking'],
  'ac': ['Air conditioning'],
  'breakfast': ['Breakfast', 'Breakfast buffet', 'Continental breakfast'],
  'room-service': ['Room service', '24-hour room service'],
  'pet-friendly': ['Pets allowed', 'Pet friendly'],
  'wheelchair': ['Wheelchair accessible', 'Facilities for disabled'],
  'family': ['Family rooms', 'Kid meals', 'Cribs'],
};

interface SearchHotelsParams {
  latitude: number;
  longitude: number;
  checkin: string;
  checkout: string;
  preferences: FlashVacationPreferences;
  limit?: number;
}

/**
 * Search hotels with smart filtering based on user preferences
 * Returns top 3-5 hotels that match user's profile
 */
export async function searchHotelsForTrip(params: SearchHotelsParams): Promise<HotelOption[]> {
  const {
    latitude,
    longitude,
    checkin,
    checkout,
    preferences,
    limit = 5,
  } = params;

  // Get more hotels than we need so we can filter/rank
  const fetchLimit = Math.max(limit * 4, 20);

  // 1. Search hotels by location
  const { hotels } = await searchHotelsByLocation(latitude, longitude, {
    radius: 15, // 15km radius
    limit: fetchLimit,
  });

  if (hotels.length === 0) {
    console.log('No hotels found in location');
    return [];
  }

  // 2. Filter by minimum stars
  const minStars = preferences.accommodation?.minStars || 3;
  const starFiltered = hotels.filter(h => h.stars >= minStars);

  if (starFiltered.length === 0) {
    // Fallback: use top-rated hotels if star filter is too strict
    console.log('Star filter too strict, using top-rated hotels');
    hotels.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const filteredHotels = starFiltered.length > 0 ? starFiltered : hotels;

  // 3. Get rates for filtered hotels (max 10 to avoid rate limits)
  const hotelIds = filteredHotels.slice(0, 10).map(h => h.id);
  const occupancies = buildOccupancies(preferences);

  let ratesData;
  try {
    ratesData = await getHotelRates(hotelIds, checkin, checkout, occupancies);
    console.log('[LiteAPI] Rates response:', JSON.stringify(ratesData, null, 2).slice(0, 1000));
  } catch (error) {
    console.error('Failed to get hotel rates:', error);
    return [];
  }

  // 4. Build hotel options with pricing
  const hotelOptions: HotelOption[] = [];
  const nights = calculateNights(checkin, checkout);

  // Handle case where data is not an array
  const ratesArray = Array.isArray(ratesData?.data) ? ratesData.data : [];
  if (ratesArray.length === 0) {
    console.log('[LiteAPI] No rates available for these hotels/dates');
    return [];
  }

  for (const hotelRates of ratesArray) {
    const hotel = filteredHotels.find(h => h.id === hotelRates.hotelId);
    if (!hotel || hotelRates.roomTypes.length === 0) continue;

    // Find the best rate (cheapest that fits our criteria)
    const bestRoom = findBestRoom(hotelRates.roomTypes, preferences);
    if (!bestRoom) continue;

    // Get hotel details for amenities and photos
    const details = await getHotelDetails(hotel.id);

    const option: HotelOption = {
      id: hotel.id,
      name: hotel.name,
      description: hotel.hotelDescription || '',
      stars: hotel.stars,
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      address: hotel.address,
      mainPhoto: hotel.main_photo || hotel.thumbnail,
      photos: details?.hotelImages?.slice(0, 10).map(img => img.url) || [hotel.main_photo],
      amenities: details?.hotelFacilities?.slice(0, 15) || [],
      checkinTime: details?.checkinCheckoutTimes?.checkin || '3:00 PM',
      checkoutTime: details?.checkinCheckoutTimes?.checkout || '11:00 AM',
      // Pricing - using wholesale price
      totalPrice: bestRoom.price,
      pricePerNight: Math.round(bestRoom.price / nights),
      currency: bestRoom.currency,
      taxesIncluded: bestRoom.taxesIncluded,
      refundable: bestRoom.refundable,
      boardType: bestRoom.boardType,
      boardName: bestRoom.boardName,
      // Booking details
      offerId: bestRoom.offerId,
      rateId: bestRoom.rateId,
      roomName: bestRoom.roomName,
      roomDescription: bestRoom.roomDescription,
      expiresAt: Date.now() + (hotelRates.et * 1000), // Convert seconds to ms
    };

    hotelOptions.push(option);
  }

  // 5. Score and rank hotels based on preferences
  const scoredOptions = hotelOptions.map(hotel => ({
    hotel,
    score: scoreHotel(hotel, preferences),
  }));

  scoredOptions.sort((a, b) => b.score - a.score);

  // 6. Return top N hotels
  return scoredOptions.slice(0, limit).map(s => s.hotel);
}

/**
 * Build occupancies array from preferences
 */
function buildOccupancies(preferences: FlashVacationPreferences): LiteAPIOccupancy[] {
  const adults = preferences.travelers?.adults || 2;
  const children = preferences.travelers?.children || [];

  return [{
    adults,
    children: children.length > 0 ? children.map(c => c.age) : undefined,
  }];
}

/**
 * Calculate number of nights between dates
 */
function calculateNights(checkin: string, checkout: string): number {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Find the best room/rate for user's preferences
 */
function findBestRoom(
  roomTypes: any[],
  preferences: FlashVacationPreferences
): {
  price: number;
  currency: string;
  taxesIncluded: boolean;
  refundable: boolean;
  boardType: string;
  boardName: string;
  offerId: string;
  rateId: string;
  roomName: string;
  roomDescription: string;
} | null {
  let bestRoom = null;
  let bestPrice = Infinity;

  const budgetMax = preferences.budget?.perTripMax;
  const flexibility = preferences.budget?.flexibility;

  for (const roomType of roomTypes) {
    for (const rate of roomType.rates) {
      const price = roomType.offerRetailRate?.amount || roomType.offerInitialPrice?.amount;
      if (!price) continue;

      // Skip if over budget (unless flexibility allows)
      if (budgetMax && flexibility === 'strict' && price > budgetMax * 0.5) {
        continue; // Hotel shouldn't be more than 50% of total trip budget
      }

      // Prefer refundable if prices are similar (within 10%)
      const isRefundable = rate.cancellationPolicies?.refundableTag === 'RFN';
      const priceWithPreference = isRefundable ? price * 0.95 : price;

      if (priceWithPreference < bestPrice) {
        bestPrice = priceWithPreference;

        // Check if taxes are included
        const taxesAndFees = rate.retailRate?.taxesAndFees || [];
        const taxesIncluded = taxesAndFees.every((t: any) => t.included === true);

        bestRoom = {
          price,
          currency: roomType.offerRetailRate?.currency || 'USD',
          taxesIncluded,
          refundable: isRefundable,
          boardType: rate.boardType || 'RO',
          boardName: rate.boardName || 'Room Only',
          offerId: roomType.offerId,
          rateId: rate.rateId,
          roomName: rate.name || roomType.roomTypeId,
          roomDescription: '', // Could fetch from room details if needed
        };
      }
    }
  }

  return bestRoom;
}

/**
 * Score hotel based on user preferences (higher = better match)
 */
function scoreHotel(hotel: HotelOption, preferences: FlashVacationPreferences): number {
  let score = 0;

  // Base score from rating (0-10 points)
  score += (hotel.rating || 0);

  // Star rating match (0-5 points)
  const minStars = preferences.accommodation?.minStars || 3;
  if (hotel.stars >= minStars) {
    score += 5;
  }
  // Bonus for exact match
  if (hotel.stars === minStars) {
    score += 2;
  }

  // Price score - prefer mid-range unless budget is "splurge_ok"
  const flexibility = preferences.budget?.flexibility;
  const budgetMax = preferences.budget?.perTripMax || 5000;
  const hotelBudgetRatio = hotel.totalPrice / (budgetMax * 0.5); // Hotel as % of total budget

  if (flexibility === 'splurge_ok') {
    // Higher rated hotels score better
    score += Math.min(hotel.stars * 2, 10);
  } else if (flexibility === 'strict') {
    // Cheaper hotels score better
    if (hotelBudgetRatio < 0.3) score += 5;
    else if (hotelBudgetRatio < 0.5) score += 3;
  } else {
    // Flexible - balance of value
    if (hotelBudgetRatio < 0.4) score += 4;
  }

  // Amenity matching (0-10 points)
  const mustHave = preferences.accommodation?.mustHaveAmenities || [];
  const niceToHave = preferences.accommodation?.niceToHaveAmenities || [];

  for (const amenity of mustHave) {
    if (hasAmenity(hotel.amenities, amenity)) {
      score += 3;
    }
  }

  for (const amenity of niceToHave) {
    if (hasAmenity(hotel.amenities, amenity)) {
      score += 1;
    }
  }

  // Refundable bonus (for cautious travelers)
  if (hotel.refundable) {
    score += 2;
  }

  // Review count bonus (more reviews = more trustworthy)
  if (hotel.reviewCount > 500) score += 2;
  else if (hotel.reviewCount > 100) score += 1;

  // Breakfast included bonus
  if (hotel.boardType !== 'RO') {
    score += 2;
  }

  return score;
}

/**
 * Check if hotel has a specific amenity
 */
function hasAmenity(hotelAmenities: string[], searchAmenity: string): boolean {
  const searchTerms = AMENITY_MAPPINGS[searchAmenity.toLowerCase()] || [searchAmenity];

  return hotelAmenities.some(hotelAmenity =>
    searchTerms.some(term =>
      hotelAmenity.toLowerCase().includes(term.toLowerCase())
    )
  );
}

export { AMENITY_MAPPINGS };
