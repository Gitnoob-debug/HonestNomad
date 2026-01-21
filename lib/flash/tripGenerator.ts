// Flash Trip Generator - Batch generates diverse trip packages
import { v4 as uuidv4 } from 'uuid';
import type {
  FlashVacationPreferences,
  FlashGenerateParams,
  FlashTripPackage,
  Destination,
} from '@/types/flash';
import { selectDestinations, calculateDiversityScore } from './diversityEngine';
import { searchFlights } from '@/lib/duffel/flights';
import { searchHotels } from '@/lib/duffel/search';
import type { NormalizedFlight } from '@/types/flight';
import type { NormalizedHotel } from '@/types/hotel';

export interface GenerationProgress {
  stage: 'finding_destinations' | 'searching_flights' | 'searching_hotels' | 'building_trips' | 'complete';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Generate a batch of diverse trip packages based on user profile and request
 */
export async function generateTripBatch(
  params: FlashGenerateParams,
  profile: FlashVacationPreferences,
  onProgress?: ProgressCallback
): Promise<{
  trips: FlashTripPackage[];
  generationTime: number;
  diversityScore: number;
}> {
  const startTime = Date.now();
  const count = params.count || 8;

  // Report progress helper
  const report = (stage: GenerationProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  report('finding_destinations', 0, 'Finding perfect destinations...');

  // Step 1: Select diverse destinations
  const destinations = selectDestinations({
    profile,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    vibes: params.vibe,
    region: params.region,
    count: count + 4, // Request extras in case some fail
    originAirport: profile.homeBase.airportCode,
  });

  report('searching_flights', 20, `Searching flights to ${destinations.length} destinations...`);

  // Step 2: Search flights in parallel (with controlled concurrency)
  const flightResults = await searchFlightsForDestinations(
    destinations,
    profile,
    params,
    (progress) => report('searching_flights', 20 + progress * 0.3, `Searching flights... ${Math.round(progress * 100)}%`)
  );

  report('searching_hotels', 50, 'Finding best hotels...');

  // Step 3: Search hotels for destinations with valid flights
  const validDestinations = destinations.filter((_, i) => flightResults[i] && flightResults[i].length > 0);
  const hotelResults = await searchHotelsForDestinations(
    validDestinations,
    profile,
    params,
    (progress) => report('searching_hotels', 50 + progress * 0.3, `Searching hotels... ${Math.round(progress * 100)}%`)
  );

  report('building_trips', 80, 'Building your trip packages...');

  // Step 4: Assemble complete trip packages
  const trips: FlashTripPackage[] = [];

  for (let i = 0; i < validDestinations.length && trips.length < count; i++) {
    const dest = validDestinations[i];
    const destIndex = destinations.indexOf(dest);
    const flights = flightResults[destIndex];
    const hotels = hotelResults[i];

    if (!flights || flights.length === 0 || !hotels || hotels.length === 0) {
      continue;
    }

    // Select best flight and hotel
    const bestFlight = selectBestFlight(flights, profile);
    const bestHotel = selectBestHotel(hotels, profile);

    if (!bestFlight || !bestHotel) {
      continue;
    }

    // Build trip package
    const tripPackage = buildTripPackage(
      dest,
      bestFlight,
      bestHotel,
      params,
      profile
    );

    trips.push(tripPackage);
  }

  // Sort by match score
  trips.sort((a, b) => b.matchScore - a.matchScore);

  report('complete', 100, `Found ${trips.length} amazing trips!`);

  const generationTime = Date.now() - startTime;
  const diversityScore = calculateDiversityScore(
    trips.map(t => ({
      id: t.id,
      city: t.destination.city,
      country: t.destination.country,
      airportCode: t.destination.airportCode,
      region: t.destination.region as any,
      vibes: t.destination.vibes as any,
      bestMonths: [],
      averageCost: t.pricing.total,
      highlights: t.highlights,
      imageUrl: t.imageUrl,
      latitude: 0,
      longitude: 0,
    }))
  );

  return {
    trips,
    generationTime,
    diversityScore,
  };
}

/**
 * Search flights for multiple destinations with controlled concurrency
 */
async function searchFlightsForDestinations(
  destinations: Destination[],
  profile: FlashVacationPreferences,
  params: FlashGenerateParams,
  onProgress?: (progress: number) => void
): Promise<(NormalizedFlight[] | null)[]> {
  const results: (NormalizedFlight[] | null)[] = new Array(destinations.length).fill(null);
  const concurrency = 3; // Max concurrent API calls
  let completed = 0;

  // Process in batches
  for (let i = 0; i < destinations.length; i += concurrency) {
    const batch = destinations.slice(i, i + concurrency);
    const batchPromises = batch.map(async (dest, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        const flights = await searchFlights({
          origin: profile.homeBase.airportCode,
          destination: dest.airportCode,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          passengers: buildPassengerList(profile.travelers),
          cabinClass: profile.budget.flexibility === 'splurge_ok' ? 'business' : 'economy',
          budget: {
            max: profile.budget.perTripMax * 0.5, // ~50% budget for flights
            currency: profile.budget.currency,
          },
          maxConnections: 1,
        });
        results[globalIndex] = flights;
      } catch (error) {
        console.error(`Flight search failed for ${dest.city}:`, error);
        results[globalIndex] = null;
      }
      completed++;
      onProgress?.(completed / destinations.length);
    });

    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Search hotels for multiple destinations with controlled concurrency
 */
async function searchHotelsForDestinations(
  destinations: Destination[],
  profile: FlashVacationPreferences,
  params: FlashGenerateParams,
  onProgress?: (progress: number) => void
): Promise<(NormalizedHotel[] | null)[]> {
  const results: (NormalizedHotel[] | null)[] = new Array(destinations.length).fill(null);
  const concurrency = 3;
  let completed = 0;

  // Calculate number of nights
  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i < destinations.length; i += concurrency) {
    const batch = destinations.slice(i, i + concurrency);
    const batchPromises = batch.map(async (dest, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        const totalGuests = profile.travelers.adults +
          (profile.travelers.children?.length || 0) +
          (profile.travelers.infants || 0);

        const hotels = await searchHotels({
          location: { city: dest.city },
          checkIn: params.departureDate,
          checkOut: params.returnDate,
          guests: totalGuests,
          rooms: Math.ceil(totalGuests / 2),
          budget: {
            min: profile.accommodation.minStars * 50,
            max: profile.budget.perTripMax * 0.6, // ~60% budget for hotel
            currency: profile.budget.currency,
          },
        });

        // Filter by star rating
        const filteredHotels = hotels.filter(
          h => !profile.accommodation.minStars || (h.rating.stars && h.rating.stars >= profile.accommodation.minStars)
        );

        results[globalIndex] = filteredHotels.length > 0 ? filteredHotels : hotels.slice(0, 5);
      } catch (error) {
        console.error(`Hotel search failed for ${dest.city}:`, error);
        results[globalIndex] = null;
      }
      completed++;
      onProgress?.(completed / destinations.length);
    });

    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Build passenger list from traveler config
 */
function buildPassengerList(travelers: FlashVacationPreferences['travelers']) {
  const passengers: Array<{ type: 'adult' | 'child' | 'infant_without_seat'; age?: number }> = [];

  for (let i = 0; i < travelers.adults; i++) {
    passengers.push({ type: 'adult' });
  }

  if (travelers.children) {
    for (const child of travelers.children) {
      passengers.push({ type: 'child', age: child.age });
    }
  }

  for (let i = 0; i < (travelers.infants || 0); i++) {
    passengers.push({ type: 'infant_without_seat', age: 1 });
  }

  return passengers;
}

/**
 * Select best flight based on profile preferences
 */
function selectBestFlight(
  flights: NormalizedFlight[],
  profile: FlashVacationPreferences
): NormalizedFlight | null {
  if (flights.length === 0) return null;

  // Prefer direct flights
  const directFlights = flights.filter(f => f.slices.every(s => s.stops === 0));

  if (directFlights.length > 0) {
    // For adventure seekers, might prefer interesting layovers
    if (profile.travelStyle.adventureRelaxation >= 4) {
      // Still return direct but could add logic for interesting connections
    }
    return directFlights[0];
  }

  // Fall back to flights with fewest stops
  const sortedByStops = [...flights].sort((a, b) => {
    const stopsA = a.slices.reduce((sum, s) => sum + s.stops, 0);
    const stopsB = b.slices.reduce((sum, s) => sum + s.stops, 0);
    return stopsA - stopsB;
  });

  return sortedByStops[0];
}

/**
 * Select best hotel based on profile preferences
 */
function selectBestHotel(
  hotels: NormalizedHotel[],
  profile: FlashVacationPreferences
): NormalizedHotel | null {
  if (hotels.length === 0) return null;

  // Score hotels based on preferences
  const scoredHotels = hotels.map(hotel => {
    let score = 0;

    // Star rating match
    if (hotel.rating.stars) {
      if (hotel.rating.stars >= profile.accommodation.minStars) {
        score += 10;
      }
      if (hotel.rating.stars >= 4) {
        score += 5;
      }
    }

    // Guest rating
    if (hotel.rating.score) {
      score += hotel.rating.score; // 0-10
    }

    // Amenity matching
    const mustHave = profile.accommodation.mustHaveAmenities || [];
    const hotelAmenities = (hotel.amenities || []).map(a => a.toLowerCase());

    const amenityMatch = mustHave.filter(a =>
      hotelAmenities.some(ha => ha.includes(a) || a.includes(ha))
    ).length;
    score += amenityMatch * 5;

    // Review count (popularity)
    if (hotel.rating.reviewCount && hotel.rating.reviewCount > 100) {
      score += 3;
    }

    return { hotel, score };
  });

  // Sort by score
  scoredHotels.sort((a, b) => b.score - a.score);

  return scoredHotels[0].hotel;
}

/**
 * Build a complete trip package from components
 */
function buildTripPackage(
  destination: Destination,
  flight: NormalizedFlight,
  hotel: NormalizedHotel,
  params: FlashGenerateParams,
  profile: FlashVacationPreferences
): FlashTripPackage {
  // Calculate nights
  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate total price
  const flightPrice = parseFloat(flight.price.amount);
  const hotelTotalPrice = (hotel.price.perNight || hotel.price.amount) * nights;
  const totalPrice = flightPrice + hotelTotalPrice;

  // Calculate match score (simplified from diversity engine)
  let matchScore = 0.5;

  // Boost for matching interests
  const primaryInterests = profile.interests?.primary || [];
  const matchingVibes = destination.vibes.filter(v =>
    primaryInterests.some(i => {
      const vibeMap: Record<string, string[]> = {
        beaches: ['beach'],
        museums: ['culture', 'history'],
        nightlife: ['nightlife'],
        food_tours: ['food'],
        hiking: ['adventure', 'nature'],
      };
      return vibeMap[i]?.includes(v);
    })
  );
  matchScore += matchingVibes.length * 0.1;

  // Boost for good season
  const month = new Date(params.departureDate).getMonth() + 1;
  if (destination.bestMonths.includes(month)) {
    matchScore += 0.2;
  }

  // Cap at 1.0
  matchScore = Math.min(1.0, matchScore);

  // Format flight slices
  const outboundSlice = flight.slices[0];
  const returnSlice = flight.slices[1] || flight.slices[0];

  return {
    id: uuidv4(),
    destination: {
      city: destination.city,
      country: destination.country,
      airportCode: destination.airportCode,
      region: destination.region,
      vibes: destination.vibes,
    },
    flight: {
      airline: flight.airlines[0]?.name || 'Airline',
      outbound: {
        departure: outboundSlice.departureTime,
        arrival: outboundSlice.arrivalTime,
        stops: outboundSlice.stops,
        duration: outboundSlice.duration,
      },
      return: {
        departure: returnSlice.departureTime,
        arrival: returnSlice.arrivalTime,
        stops: returnSlice.stops,
        duration: returnSlice.duration,
      },
      price: flightPrice,
      currency: flight.price.currency,
    },
    hotel: {
      name: hotel.name,
      stars: hotel.rating.stars || 3,
      rating: hotel.rating.score || 8,
      reviewCount: hotel.rating.reviewCount || 0,
      amenities: (hotel.amenities || []).slice(0, 5),
      pricePerNight: hotel.price.perNight || hotel.price.amount,
      totalPrice: hotelTotalPrice,
      currency: hotel.price.currency,
      imageUrl: hotel.images[0] || destination.imageUrl,
    },
    itinerary: {
      days: nights,
      highlights: destination.highlights.slice(0, 4),
      activities: generateActivitySummary(destination, profile),
    },
    pricing: {
      flight: flightPrice,
      hotel: hotelTotalPrice,
      total: totalPrice,
      currency: flight.price.currency,
      perPerson: totalPrice / profile.travelers.adults,
    },
    highlights: destination.highlights.slice(0, 4),
    matchScore,
    imageUrl: destination.imageUrl,
  };
}

/**
 * Generate activity suggestions based on destination and profile
 */
function generateActivitySummary(
  destination: Destination,
  profile: FlashVacationPreferences
): string[] {
  const activities: string[] = [];

  // Add based on destination vibes
  if (destination.vibes.includes('beach')) {
    activities.push('Beach relaxation & water activities');
  }
  if (destination.vibes.includes('culture')) {
    activities.push('Cultural tours & museums');
  }
  if (destination.vibes.includes('food')) {
    activities.push('Local food experiences');
  }
  if (destination.vibes.includes('adventure')) {
    activities.push('Adventure activities');
  }
  if (destination.vibes.includes('history')) {
    activities.push('Historical site visits');
  }
  if (destination.vibes.includes('nightlife')) {
    activities.push('Nightlife & entertainment');
  }

  // Add based on profile interests
  const interests = profile.interests?.primary || [];
  if (interests.includes('photography')) {
    activities.push('Photo opportunities');
  }
  if (interests.includes('spa_wellness')) {
    activities.push('Spa & wellness');
  }

  return activities.slice(0, 5);
}
