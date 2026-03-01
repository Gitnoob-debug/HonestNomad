// Hotel search endpoint for the Discover flow
// Searches near landmark GPS coordinates with radius expansion

import { NextRequest, NextResponse } from 'next/server';
import { searchHotelsForDiscoverFlow } from '@/lib/liteapi/hotels';
import { categorizeHotels } from '@/lib/hotels/categorize';
import { getHotelDetails } from '@/lib/liteapi/client';
import type { HotelOption } from '@/lib/liteapi/types';

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

    // ── Enrich ALL hotels with photos & amenities (parallel) ────────
    // getHotelDetails is called for every hotel in parallel (Promise.all).
    // Original bug: sequential calls were slow. Parallel ≈ 2-3s total.
    // Each call is wrapped in .catch so one failure doesn't kill the batch.
    if (searchResult.hotels.length > 0) {
      const allIds = searchResult.hotels.map(h => h.id);

      console.log(`[discover-search] Enriching ${allIds.length} hotels with photos (parallel)...`);

      const detailsResults = await Promise.all(
        allIds.map(id => getHotelDetails(id).catch(() => null))
      );

      // Build enrichment map
      const detailsMap = new Map<string, { photos: string[]; amenities: string[] }>();
      let enrichedCount = 0;
      for (let i = 0; i < allIds.length; i++) {
        const details = detailsResults[i];
        if (details) {
          const photos = details.hotelImages?.slice(0, 10).map(img => img.url).filter(Boolean) || [];
          const amenities = details.hotelFacilities?.slice(0, 15) || [];
          detailsMap.set(allIds[i], { photos, amenities });
          if (photos.length > 0) enrichedCount++;
        }
      }

      // Apply to full hotel list
      for (let i = 0; i < searchResult.hotels.length; i++) {
        const enrichment = detailsMap.get(searchResult.hotels[i].id);
        if (enrichment) {
          searchResult.hotels[i] = {
            ...searchResult.hotels[i],
            photos: enrichment.photos.length > 0 ? enrichment.photos : searchResult.hotels[i].photos,
            amenities: enrichment.amenities.length > 0 ? enrichment.amenities : searchResult.hotels[i].amenities,
          };
        }
      }

      // Apply to featured hotels too (they reference different objects after categorize)
      if (featured) {
        const keys: ('closest' | 'budget' | 'highEnd')[] = ['closest', 'budget', 'highEnd'];
        for (const key of keys) {
          const enrichment = detailsMap.get(featured[key].id);
          if (enrichment) {
            featured[key] = {
              ...featured[key],
              photos: enrichment.photos.length > 0 ? enrichment.photos : featured[key].photos,
              amenities: enrichment.amenities.length > 0 ? enrichment.amenities : featured[key].amenities,
            };
          }
        }
      }

      console.log(`[discover-search] Enrichment complete. Photos found for ${enrichedCount}/${allIds.length} hotels`);
    }

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
