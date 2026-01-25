// Flash Trip Generator - Batch generates diverse trip packages (Flights-only mode)
import { v4 as uuidv4 } from 'uuid';
import type {
  FlashVacationPreferences,
  FlashGenerateParams,
  FlashTripPackage,
  Destination,
} from '@/types/flash';
import { selectDestinations, calculateDiversityScore } from './diversityEngine';
import { searchFlights } from '@/lib/duffel/flights';
import type { NormalizedFlight } from '@/types/flight';
import { getDestinationImages } from './destinationImages';
import { getTransferInfo } from './hubAirports';
import type { RevealedPreferences } from './preferenceEngine';

export interface GenerationProgress {
  stage: 'finding_destinations' | 'searching_flights' | 'building_trips' | 'complete';
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
  revealedPreferences?: RevealedPreferences,
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

  // Step 1: Select diverse destinations (with revealed preference learning)
  // Request some extras in case some destinations fail flight search
  const destinations = selectDestinations({
    profile,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    vibes: params.vibe,
    region: params.region,
    count: count + 4, // Request 4 extras in case some fail flight search
    originAirport: profile.homeBase.airportCode,
    revealedPreferences, // Pass learned preferences for smarter selection
    excludeDestinations: params.excludeDestinations, // Exclude already shown cities
  });

  report('searching_flights', 20, `Searching flights to ${destinations.length} destinations...`);

  // Step 2: Search flights in parallel (with controlled concurrency)
  const flightResults = await searchFlightsForDestinations(
    destinations,
    profile,
    params,
    (progress) => report('searching_flights', 20 + progress * 0.6, `Searching flights... ${Math.round(progress * 100)}%`)
  );

  report('building_trips', 80, 'Building your trip packages...');

  // Step 3: Assemble trip packages (flights-only mode - no hotel search)
  const trips: FlashTripPackage[] = [];

  for (let i = 0; i < destinations.length && trips.length < count; i++) {
    const dest = destinations[i];
    const flights = flightResults[i];

    if (!flights || flights.length === 0) {
      continue;
    }

    // Select best flight
    const bestFlight = selectBestFlight(flights, profile);

    if (!bestFlight) {
      continue;
    }

    // Build trip package (flights-only)
    const tripPackage = buildTripPackage(
      dest,
      bestFlight,
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
    if (profile.travelStyle?.adventureRelaxation && profile.travelStyle.adventureRelaxation >= 4) {
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
 * Build a trip package from flight data (flights-only mode)
 */
function buildTripPackage(
  destination: Destination,
  flight: NormalizedFlight,
  params: FlashGenerateParams,
  profile: FlashVacationPreferences
): FlashTripPackage {
  // Calculate nights
  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate total price (flights only)
  const flightPrice = flight.pricing.totalAmount;
  const totalPrice = flightPrice;

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

  // Format flight slices with full details
  const outboundSlice = flight.slices[0];
  const returnSlice = flight.slices[1] || flight.slices[0];

  // Build detailed segment info for each slice
  const buildSliceSummary = (slice: typeof outboundSlice) => ({
    departure: slice.departureTime,
    arrival: slice.arrivalTime,
    duration: slice.duration,
    stops: slice.stops,
    segments: slice.segments.map(seg => ({
      flightNumber: seg.flightNumber,
      airline: seg.airline,
      marketingCarrier: seg.marketingCarrier,
      aircraft: seg.aircraft,
      departure: {
        time: seg.departureTime,
        airport: seg.departureAirport,
        terminal: seg.departureTerminal,
      },
      arrival: {
        time: seg.arrivalTime,
        airport: seg.arrivalAirport,
        terminal: seg.arrivalTerminal,
      },
      duration: seg.duration,
      cabinClass: seg.cabinClass,
      cabinClassMarketingName: seg.cabinClassMarketingName,
      wifi: seg.wifi,
      power: seg.power,
      seatPitch: seg.seatPitch,
    })),
    fareBrandName: (slice as any).fareBrandName,
  });

  // Get images and transfer info for this destination
  const destinationImages = getDestinationImages(destination.id);
  const transferInfo = getTransferInfo(destination.id);

  return {
    id: uuidv4(),
    destination: {
      city: destination.city,
      country: destination.country,
      airportCode: destination.airportCode,
      region: destination.region,
      vibes: destination.vibes,
      transferInfo,
    },
    flight: {
      offerId: flight.duffelOfferId,
      airline: flight.airlines[0]?.name || 'Airline',
      airlines: flight.airlines,
      outbound: buildSliceSummary(outboundSlice),
      return: buildSliceSummary(returnSlice),
      price: flightPrice,
      currency: flight.pricing.currency,
      cabinClass: flight.cabinClass,
      baggage: {
        carryOn: flight.baggageAllowance?.carryOn ?? true,
        checkedBags: flight.baggageAllowance?.checkedBags ?? 0,
        checkedBagWeightKg: (flight.baggageAllowance as any)?.checkedBagWeightKg,
      },
      conditions: {
        changeable: flight.restrictions.changeable,
        refundable: flight.restrictions.refundable,
        changesFee: flight.restrictions.changesFee,
        cancellationFee: flight.restrictions.cancellationFee,
      },
      co2EmissionsKg: (flight as any).totalEmissionsKg,
      expiresAt: flight.expiresAt,
    },
    // No hotel in flights-only mode
    itinerary: {
      days: nights,
      highlights: destination.highlights.slice(0, 4),
      activities: generateActivitySummary(destination, profile),
    },
    pricing: {
      flight: flightPrice,
      hotel: 0, // No hotel
      total: totalPrice,
      currency: flight.pricing.currency,
      perPerson: totalPrice / profile.travelers.adults,
    },
    highlights: destination.highlights.slice(0, 4),
    matchScore,
    imageUrl: destination.imageUrl,
    images: destinationImages.length > 0 ? destinationImages : undefined,
    transferInfo,
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
