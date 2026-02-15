import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
    } = body;

    // Validate required fields
    if (!latitude || !longitude || !checkin || !checkout) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, checkin, checkout' },
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

    console.log(`Searching hotels for ${destinationName || 'location'} (${latitude}, ${longitude})`);
    console.log(`Dates: ${checkin} to ${checkout}`);
    console.log(`Travelers: ${preferences.travelers?.adults || 2} adults`);

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

    console.log(`Found ${hotels.length} hotels matching preferences`);

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
    console.error('Hotel search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Stack:', errorStack);

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
