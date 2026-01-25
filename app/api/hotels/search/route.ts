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

    // Search hotels
    const hotels = await searchHotelsForTrip({
      latitude,
      longitude,
      checkin,
      checkout,
      preferences,
      limit: 5,
    });

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
    return NextResponse.json(
      { error: 'Failed to search hotels', details: error instanceof Error ? error.message : 'Unknown error' },
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
