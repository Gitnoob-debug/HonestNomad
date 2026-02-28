import { NextRequest, NextResponse } from 'next/server';
import { searchHotelsForTrip } from '@/lib/liteapi';
import { FlashVacationPreferences } from '@/types/flash';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      latitude,
      longitude,
      checkin,
      checkout,
      destinationName,
      zoneRadiusKm,  // Optional: hotel zone radius in km (from clustering)
      travelers,      // Optional: traveler type from form (solo/couple/family)
      roomConfig,     // Optional: detailed room config { adults, children, childAges }
      budgetTier,     // Optional: 'budget' when user clicked Budget-Friendly tile in Discover
    } = body;

    // Validate required fields
    if (!latitude || !longitude || !checkin || !checkout) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, checkin, checkout' },
        { status: 400 }
      );
    }

    // Build preferences from form data — no saved profile needed
    const preferences: FlashVacationPreferences = getDefaultPreferences();

    // Override traveler count based on form selection
    if (roomConfig && travelers === 'family') {
      // Use detailed room config from family configurator
      const childAges = roomConfig.childAges || [];
      const children = childAges.map((age: number) => ({ age }));
      const infants = childAges.filter((age: number) => age < 2).length;
      preferences.travelers = {
        type: 'family',
        adults: roomConfig.adults || 2,
        children,
        infants,
      };
    } else if (travelers) {
      switch (travelers) {
        case 'solo':
          preferences.travelers = { type: 'solo', adults: 1, children: [], infants: 0 };
          break;
        case 'couple':
          preferences.travelers = { type: 'couple', adults: 2, children: [], infants: 0 };
          break;
        case 'family':
          preferences.travelers = { type: 'family', adults: 2, children: [{ age: 10 }], infants: 0 };
          break;
      }
    }

    // Adjust budget preferences when user selected Budget-Friendly tile
    if (budgetTier === 'budget') {
      preferences.budget = {
        ...preferences.budget,
        perTripMax: 2000,
        flexibility: 'strict',
      };
      preferences.accommodation = {
        ...preferences.accommodation,
        minStars: 2,
      };
    }

    // Search hotels — use zone radius if available for tighter results
    let hotels;
    try {
      hotels = await searchHotelsForTrip({
        latitude,
        longitude,
        checkin,
        checkout,
        preferences,
        limit: 5,
        zoneRadiusKm: zoneRadiusKm || undefined,
      });
    } catch (hotelError) {
      console.error('LiteAPI hotel search failed:', hotelError);
      const errorMessage = hotelError instanceof Error ? hotelError.message : 'Unknown error';

      // Check for common issues
      if (errorMessage.includes('key not configured')) {
        return NextResponse.json(
          { error: 'Hotel service not configured', details: 'API key missing - contact support' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Hotel search failed', details: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hotels,
      searchParams: {
        latitude,
        longitude,
        checkin,
        checkout,
        destinationName,
      },
    });
  } catch (error) {
    console.error('Hotel search error:', error instanceof Error ? error.message : error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to search hotels', details: errorMessage },
      { status: 500 }
    );
  }
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
