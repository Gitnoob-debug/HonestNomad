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
  const destinations = selectDestinations({
    profile,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    vibes: params.vibe,
    region: params.region,
    count: count,
    originAirport: profile.homeBase.airportCode,
    revealedPreferences, // Pass learned preferences for smarter selection
    excludeDestinations: params.excludeDestinations, // Exclude already shown cities
  });

  report('building_trips', 50, 'Building your trip packages...');

  // Step 2: Build trip packages WITHOUT flights (flights loaded on-demand when user selects)
  // This makes the swipe experience instant - flights are fetched only when needed
  const trips: FlashTripPackage[] = [];

  for (const dest of destinations) {
    // Build trip package with placeholder flight data
    const tripPackage = buildTripPackageWithoutFlight(
      dest,
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
 * Build a trip package WITHOUT flight data (for instant swipe experience)
 * Flights will be loaded on-demand when user selects a destination
 */
function buildTripPackageWithoutFlight(
  destination: Destination,
  params: FlashGenerateParams,
  profile: FlashVacationPreferences
): FlashTripPackage {
  // Calculate nights
  const nights = Math.ceil(
    (new Date(params.returnDate).getTime() - new Date(params.departureDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Estimate flight price based on region and distance
  const estimatedFlightPrice = estimateFlightPrice(destination, profile.homeBase.airportCode);

  // Calculate match score
  let matchScore = 0.5;
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

  const month = new Date(params.departureDate).getMonth() + 1;
  if (destination.bestMonths.includes(month)) {
    matchScore += 0.2;
  }
  matchScore = Math.min(1.0, matchScore);

  // Get images and transfer info
  const destinationImages = getDestinationImages(destination.id);
  const transferInfo = getTransferInfo(destination.id);

  // Create placeholder flight times based on departure date
  const departureDate = new Date(params.departureDate);
  const returnDate = new Date(params.returnDate);
  departureDate.setHours(10, 0, 0, 0); // 10 AM departure
  returnDate.setHours(14, 0, 0, 0); // 2 PM return

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
      offerId: '', // Will be populated when flights are loaded
      airline: 'Loading...', // Placeholder
      airlines: [],
      outbound: {
        departure: departureDate.toISOString(),
        arrival: departureDate.toISOString(), // Placeholder
        duration: 'PT0H',
        stops: 0,
        segments: [],
      },
      return: {
        departure: returnDate.toISOString(),
        arrival: returnDate.toISOString(),
        duration: 'PT0H',
        stops: 0,
        segments: [],
      },
      price: estimatedFlightPrice,
      currency: profile.budget.currency || 'USD',
      cabinClass: profile.flightPreferences?.cabinClass || 'economy',
      baggage: { carryOn: true, checkedBags: 0 },
      conditions: { changeable: false, refundable: false },
    },
    itinerary: {
      days: nights,
      highlights: destination.highlights.slice(0, 4),
      activities: generateActivitySummary(destination, profile),
    },
    pricing: {
      flight: estimatedFlightPrice,
      hotel: 0,
      total: estimatedFlightPrice,
      currency: profile.budget.currency || 'USD',
      perPerson: estimatedFlightPrice / profile.travelers.adults,
    },
    highlights: destination.highlights.slice(0, 4),
    matchScore,
    imageUrl: destination.imageUrl,
    images: destinationImages.length > 0 ? destinationImages : undefined,
    transferInfo,
    flightsLoaded: false, // Flag to indicate flights need to be fetched
  };
}

/**
 * Estimate flight price based on region and origin
 */
function estimateFlightPrice(destination: Destination, originAirport: string): number {
  // Base prices by region (from US)
  const regionPrices: Record<string, number> = {
    'europe': 800,
    'asia': 1200,
    'north-america': 400,
    'caribbean': 500,
    'south-america': 900,
    'middle-east': 1100,
    'africa': 1300,
    'oceania': 1500,
  };

  const basePrice = regionPrices[destination.region] || 700;
  // Add some variance
  const variance = Math.floor(Math.random() * 200) - 100;
  return basePrice + variance;
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
