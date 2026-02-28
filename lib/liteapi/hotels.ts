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

// Use mock rates when sandbox doesn't return real pricing
const USE_MOCK_RATES = true;

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
  zoneRadiusKm?: number; // From hotel zone clustering — tighter search radius
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
    zoneRadiusKm,
  } = params;

  // Get more hotels than we need so we can filter/rank
  const fetchLimit = Math.max(limit * 4, 20);

  // 1. Search hotels by location — use zone radius if available
  // Zone radius is the clustering-based ideal zone; add 50% padding for search
  // but use a minimum of 5km and max of 15km to ensure we get results
  const searchRadiusKm = zoneRadiusKm
    ? Math.min(15, Math.max(5, zoneRadiusKm * 1.5))
    : 15;

  // Debug: radius ${searchRadiusKm}km, zone: ${zoneRadiusKm || 'n/a'}km

  const { hotels } = await searchHotelsByLocation(latitude, longitude, {
    radius: searchRadiusKm,
    limit: fetchLimit,
  });

  if (hotels.length === 0) {
    // No hotels found in location
    return [];
  }

  // 2. Calculate distance from zone center for each hotel
  const hotelsWithDistance = hotels.map(h => {
    const dLat = (h.latitude - latitude) * 111320;
    const dLng = (h.longitude - longitude) * 111320 * Math.cos(((h.latitude + latitude) / 2) * Math.PI / 180);
    const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng);
    const zoneRadiusMeters = (zoneRadiusKm || 15) * 1000;
    return {
      ...h,
      distanceFromCenter: distanceMeters,
      insideZone: distanceMeters <= zoneRadiusMeters,
    };
  });

  // Sort by distance so closer hotels are processed first
  hotelsWithDistance.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

  // 3. Filter by minimum stars
  const minStars = preferences.accommodation?.minStars || 3;
  const starFiltered = hotelsWithDistance.filter(h => h.stars >= minStars);

  if (starFiltered.length === 0) {
    // Fallback: use top-rated hotels if star filter is too strict
    // Star filter too strict, falling back to closest hotels by distance
  }

  const filteredHotels = starFiltered.length > 0 ? starFiltered : hotelsWithDistance;

  // 3. Build hotel options - use mock rates for sandbox testing
  const hotelOptions: HotelOption[] = [];
  const nights = calculateNights(checkin, checkout);
  const hotelsToProcess = filteredHotels.slice(0, limit);

  if (USE_MOCK_RATES) {
    // Generate mock rates based on hotel stars and location
    // Using mock rates for hotelsToProcess.length hotels

    for (const hotel of hotelsToProcess) {
      // Get hotel details for amenities and photos
      const details = await getHotelDetails(hotel.id);

      // Generate realistic mock pricing based on stars
      const basePrice = getBasePriceForStars(hotel.stars);
      const pricePerNight = basePrice + Math.floor(Math.random() * 50) - 25; // +/- $25 variance
      const totalPrice = pricePerNight * nights;
      const isRefundable = Math.random() > 0.3; // 70% refundable

      const option: HotelOption = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.hotelDescription || details?.hotelDescription || '',
        stars: hotel.stars,
        rating: hotel.rating || 4.0,
        reviewCount: hotel.reviewCount || Math.floor(Math.random() * 500) + 50,
        address: hotel.address || '',
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        mainPhoto: hotel.main_photo || hotel.thumbnail || details?.hotelImages?.[0]?.url || '',
        photos: details?.hotelImages?.slice(0, 10).map(img => img.url) || [],
        amenities: details?.hotelFacilities?.slice(0, 15) || ['WiFi', 'Air Conditioning', 'Room Service'],
        checkinTime: details?.checkinCheckoutTimes?.checkin || '3:00 PM',
        checkoutTime: details?.checkinCheckoutTimes?.checkout || '11:00 AM',
        totalPrice,
        pricePerNight,
        currency: 'USD',
        taxesIncluded: true,
        refundable: isRefundable,
        boardType: Math.random() > 0.5 ? 'BB' : 'RO',
        boardName: Math.random() > 0.5 ? 'Breakfast Included' : 'Room Only',
        offerId: `mock_offer_${hotel.id}`,
        rateId: `mock_rate_${hotel.id}`,
        roomName: 'Standard Room',
        roomDescription: 'Comfortable room with modern amenities',
        expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
        distanceFromZoneCenter: hotel.distanceFromCenter,
        insideZone: hotel.insideZone,
      };

      hotelOptions.push(option);
    }
  } else {
    // Use real rates from LiteAPI
    const hotelIds = hotelsToProcess.map(h => h.id);
    const occupancies = buildOccupancies(preferences);

    let ratesData;
    try {
      ratesData = await getHotelRates(hotelIds, checkin, checkout, occupancies);
      // Rates response received
    } catch (error) {
      console.error('Failed to get hotel rates:', error);
      return [];
    }

    const ratesArray = Array.isArray(ratesData?.data) ? ratesData.data : [];
    if (ratesArray.length === 0) {
      // No rates available for these hotels/dates
      return [];
    }

    for (const hotelRates of ratesArray) {
      const hotel = hotelsToProcess.find(h => h.id === hotelRates.hotelId);
      if (!hotel || hotelRates.roomTypes.length === 0) continue;

      const bestRoom = findBestRoom(hotelRates.roomTypes, preferences);
      if (!bestRoom) continue;

      const details = await getHotelDetails(hotel.id);

      const option: HotelOption = {
        id: hotel.id,
        name: hotel.name,
        description: hotel.hotelDescription || '',
        stars: hotel.stars,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        mainPhoto: hotel.main_photo || hotel.thumbnail,
        photos: details?.hotelImages?.slice(0, 10).map(img => img.url) || [hotel.main_photo],
        amenities: details?.hotelFacilities?.slice(0, 15) || [],
        checkinTime: details?.checkinCheckoutTimes?.checkin || '3:00 PM',
        checkoutTime: details?.checkinCheckoutTimes?.checkout || '11:00 AM',
        totalPrice: bestRoom.price,
        pricePerNight: Math.round(bestRoom.price / nights),
        currency: bestRoom.currency,
        taxesIncluded: bestRoom.taxesIncluded,
        refundable: bestRoom.refundable,
        boardType: bestRoom.boardType,
        boardName: bestRoom.boardName,
        offerId: bestRoom.offerId,
        rateId: bestRoom.rateId,
        roomName: bestRoom.roomName,
        roomDescription: bestRoom.roomDescription,
        expiresAt: Date.now() + (hotelRates.et * 1000),
        distanceFromZoneCenter: hotel.distanceFromCenter,
        insideZone: hotel.insideZone,
      };

      hotelOptions.push(option);
    }
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
 * Get base price per night based on hotel star rating
 */
function getBasePriceForStars(stars: number): number {
  switch (stars) {
    case 5: return 350;
    case 4: return 200;
    case 3: return 120;
    case 2: return 80;
    default: return 150;
  }
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

  // === PROXIMITY TO ZONE (0-15 points) — highest weight ===
  // Hotels inside the ideal hotel zone get a big boost
  if (hotel.insideZone) {
    score += 10;
  }
  // Distance penalty: closer to zone center = higher score
  if (hotel.distanceFromZoneCenter !== undefined) {
    // 0-1km: +5, 1-3km: +3, 3-5km: +1, >5km: 0
    const distKm = hotel.distanceFromZoneCenter / 1000;
    if (distKm < 1) score += 5;
    else if (distKm < 3) score += 3;
    else if (distKm < 5) score += 1;
  }

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
