import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { searchFlights } from '@/lib/duffel/flights';
import { FlashVacationPreferences } from '@/types/flash';
import { NormalizedFlight } from '@/types/flight';

export const dynamic = 'force-dynamic';

interface FlightWithScore extends NormalizedFlight {
  matchScore: number;
  matchReasons: string[];
  outOfPreference: boolean;
  outOfPreferenceReasons: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
    } = body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, departureDate' },
        { status: 400 }
      );
    }

    // Get user preferences from Supabase
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let preferences: FlashVacationPreferences | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from('flash_profiles')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (profile?.preferences) {
        preferences = profile.preferences as FlashVacationPreferences;
      }
    }

    // Use default preferences if not logged in or no profile
    if (!preferences) {
      preferences = getDefaultPreferences();
    }

    const flightPrefs = preferences.flightPreferences;
    const travelers = preferences.travelers;

    // Build passengers array
    const passengers = [];
    for (let i = 0; i < (travelers?.adults || 2); i++) {
      passengers.push({ type: 'adult' as const });
    }
    if (travelers?.children) {
      for (const child of travelers.children) {
        passengers.push({ type: 'child' as const, age: child.age });
      }
    }

    console.log(`Searching flights ${origin} → ${destination}`);
    console.log(`Dates: ${departureDate} to ${returnDate}`);
    console.log(`Preferences: cabin=${flightPrefs.cabinClass}, directOnly=${flightPrefs.directOnly}, maxStops=${flightPrefs.maxStops}`);

    // Search flights with user's preferences
    const flights = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass: flightPrefs.cabinClass,
      maxConnections: flightPrefs.directOnly ? 0 : flightPrefs.maxStops,
    });

    // Score and categorize flights based on preferences
    const scoredFlights = flights.map(flight => scoreAndCategorizeFlight(flight, preferences!));

    // Sort: in-preference flights first (by score), then out-of-preference (by price)
    const inPreference = scoredFlights
      .filter(f => !f.outOfPreference)
      .sort((a, b) => b.matchScore - a.matchScore);

    const outOfPreference = scoredFlights
      .filter(f => f.outOfPreference)
      .sort((a, b) => a.pricing.totalAmount - b.pricing.totalAmount);

    console.log(`Found ${inPreference.length} matching flights, ${outOfPreference.length} out of preference`);

    return NextResponse.json({
      flights: inPreference,
      outOfPreference,
      searchParams: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers: passengers.length,
      },
    });
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json(
      { error: 'Failed to search flights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function scoreAndCategorizeFlight(
  flight: NormalizedFlight,
  preferences: FlashVacationPreferences
): FlightWithScore {
  const prefs = preferences.flightPreferences;
  let score = 50; // Base score
  const matchReasons: string[] = [];
  const outOfPreferenceReasons: string[] = [];
  let outOfPreference = false;

  // Get outbound slice for analysis
  const outbound = flight.slices[0];
  const returnSlice = flight.slices[1];

  // === HARD PREFERENCES (can mark as out-of-preference) ===

  // Direct flight preference
  if (prefs.directOnly && outbound.stops > 0) {
    outOfPreference = true;
    outOfPreferenceReasons.push(`${outbound.stops} stop${outbound.stops > 1 ? 's' : ''} (you prefer direct)`);
  } else if (outbound.stops === 0) {
    score += 20;
    matchReasons.push('Direct flight');
  } else if (outbound.stops <= prefs.maxStops) {
    score += 5;
  } else {
    outOfPreference = true;
    outOfPreferenceReasons.push(`${outbound.stops} stops (max ${prefs.maxStops})`);
  }

  // Red-eye check (departure after 10pm or arrival before 6am)
  if (!prefs.redEyeOk) {
    const depHour = new Date(outbound.departureTime).getHours();
    const arrHour = new Date(outbound.arrivalTime).getHours();

    if (depHour >= 22 || arrHour < 6) {
      outOfPreference = true;
      outOfPreferenceReasons.push('Red-eye flight');
    }
  }

  // Layover duration check
  if (outbound.stops > 0 && outbound.segments.length > 1) {
    for (let i = 0; i < outbound.segments.length - 1; i++) {
      const arrival = new Date(outbound.segments[i].arrivalTime);
      const nextDeparture = new Date(outbound.segments[i + 1].departureTime);
      const layoverHours = (nextDeparture.getTime() - arrival.getTime()) / (1000 * 60 * 60);

      if (layoverHours > prefs.maxLayoverHours) {
        outOfPreference = true;
        outOfPreferenceReasons.push(`${Math.round(layoverHours)}h layover (max ${prefs.maxLayoverHours}h)`);
        break;
      }
    }
  }

  // Avoided airlines
  if (prefs.avoidAirlines && prefs.avoidAirlines.length > 0) {
    const flightAirlines = flight.airlines.map(a => a.code);
    const avoidedOnFlight = prefs.avoidAirlines.filter(a => flightAirlines.includes(a));
    if (avoidedOnFlight.length > 0) {
      outOfPreference = true;
      outOfPreferenceReasons.push(`Includes ${avoidedOnFlight.join(', ')} (avoided)`);
    }
  }

  // === SOFT PREFERENCES (affect score but don't exclude) ===

  // Preferred airlines bonus
  if (prefs.preferredAirlines && prefs.preferredAirlines.length > 0) {
    const flightAirlines = flight.airlines.map(a => a.code);
    const preferredOnFlight = prefs.preferredAirlines.filter(a => flightAirlines.includes(a));
    if (preferredOnFlight.length > 0) {
      score += 15;
      const airlineName = flight.airlines.find(a => preferredOnFlight.includes(a.code))?.name;
      matchReasons.push(`${airlineName || 'Preferred airline'}`);
    }
  }

  // Price value score (cheaper = better, but not too cheap to be sketchy)
  const pricePerPerson = flight.pricing.perPassenger;
  if (pricePerPerson < 500) {
    score += 10;
    matchReasons.push('Great value');
  } else if (pricePerPerson < 1000) {
    score += 5;
  }

  // Refundable/changeable bonus
  if (flight.restrictions.refundable) {
    score += 5;
    matchReasons.push('Refundable');
  }
  if (flight.restrictions.changeable) {
    score += 3;
  }

  // Duration score (shorter = better)
  const durationMinutes = parseDuration(outbound.duration);
  if (durationMinutes && durationMinutes < 300) { // Under 5 hours
    score += 5;
  }

  // Baggage bonus
  if (flight.baggageAllowance?.checkedBags && flight.baggageAllowance.checkedBags > 0) {
    score += 5;
    matchReasons.push(`${flight.baggageAllowance.checkedBags} checked bag${flight.baggageAllowance.checkedBags > 1 ? 's' : ''} included`);
  }

  // Cabin class match
  if (flight.cabinClass === prefs.cabinClass) {
    score += 5;
  }

  // Time of day bonus (morning/afternoon departures preferred)
  const depHour = new Date(outbound.departureTime).getHours();
  if (depHour >= 7 && depHour <= 14) {
    score += 3;
    if (depHour >= 9 && depHour <= 12) {
      matchReasons.push('Morning departure');
    }
  }

  return {
    ...flight,
    matchScore: score,
    matchReasons,
    outOfPreference,
    outOfPreferenceReasons,
  };
}

function parseDuration(duration: string): number | null {
  // Parse ISO 8601 duration (e.g., "PT8H30M")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}

function getDefaultPreferences(): FlashVacationPreferences {
  return {
    travelers: {
      type: 'couple',
      adults: 2,
      children: [],
      infants: 0,
    },
    homeBase: {
      airportCode: 'JFK',
      city: 'New York',
      country: 'US',
    },
    budget: {
      perTripMin: 1000,
      perTripMax: 5000,
      currency: 'USD',
      flexibility: 'flexible',
    },
    flightPreferences: {
      cabinClass: 'economy',
      directOnly: false,
      maxStops: 1,
      maxLayoverHours: 4,
      redEyeOk: false,
    },
    accommodation: {
      minStars: 3,
      mustHaveAmenities: ['wifi'],
      niceToHaveAmenities: ['pool', 'gym'],
      roomPreferences: [],
    },
    profileCompleted: false,
  };
}
