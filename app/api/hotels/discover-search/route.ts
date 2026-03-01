// Hotel search endpoint for the Discover flow
// Searches near landmark GPS coordinates with radius expansion

import { NextRequest, NextResponse } from 'next/server';
import { searchHotelsForDiscoverFlow } from '@/lib/liteapi/hotels';
import { categorizeHotels } from '@/lib/hotels/categorize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      latitude,
      longitude,
      checkin,
      checkout,
      adults = 2,
      children = [],
      cityName,
      countryCode,
    } = body;

    // Validate required fields
    if (!latitude || !longitude || !checkin || !checkout) {
      return NextResponse.json(
        { error: 'Missing required fields: latitude, longitude, checkin, checkout' },
        { status: 400 }
      );
    }

    console.log(`[discover-search] Searching near ${latitude},${longitude} (${cityName || 'unknown'}) for ${checkin} to ${checkout}`);

    // Search hotels with radius expansion (5km → 15km → 50km → city-wide)
    const searchResult = await searchHotelsForDiscoverFlow({
      landmarkLat: latitude,
      landmarkLng: longitude,
      checkin,
      checkout,
      adults,
      children,
      cityName,
      countryCode,
    });

    console.log(`[discover-search] Found ${searchResult.hotels.length} hotels (radius: ${searchResult.radiusUsed}km, fallback: ${searchResult.fallbackUsed})`);

    // Categorize top 3 as Closest / Budget / High-End
    const featured = categorizeHotels(
      searchResult.hotels,
      latitude,
      longitude
    );

    return NextResponse.json({
      hotels: searchResult.hotels,
      featured,
      searchParams: {
        latitude,
        longitude,
        checkin,
        checkout,
        radiusUsed: searchResult.radiusUsed,
        fallbackUsed: searchResult.fallbackUsed,
      },
    });
  } catch (error) {
    console.error('Discover hotel search error:', error);
    return NextResponse.json(
      { error: 'Failed to search hotels' },
      { status: 500 }
    );
  }
}
