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

    // ── Enrich featured hotels with photos & amenities ─────────────
    // Only call getHotelDetails for the 3 featured hotels (fast, parallel).
    // The bulk list keeps basic data — photos only matter for the tiles.
    if (featured) {
      const featuredEntries: { key: 'closest' | 'budget' | 'highEnd'; hotel: HotelOption }[] = [
        { key: 'closest', hotel: featured.closest },
        { key: 'budget', hotel: featured.budget },
        { key: 'highEnd', hotel: featured.highEnd },
      ];

      // Deduplicate IDs (in case same hotel appears in multiple slots)
      const uniqueIds = Array.from(new Set(featuredEntries.map(e => e.hotel.id)));

      console.log(`[discover-search] Enriching ${uniqueIds.length} featured hotels with photos...`);

      const detailsResults = await Promise.all(
        uniqueIds.map(id => getHotelDetails(id).catch(() => null))
      );

      // Build a map of id → details
      const detailsMap = new Map<string, { photos: string[]; amenities: string[] }>();
      for (let i = 0; i < uniqueIds.length; i++) {
        const details = detailsResults[i];
        if (details) {
          detailsMap.set(uniqueIds[i], {
            photos: details.hotelImages?.slice(0, 10).map(img => img.url).filter(Boolean) || [],
            amenities: details.hotelFacilities?.slice(0, 15) || [],
          });
        }
      }

      // Apply enrichment to featured hotels AND to matching entries in the full list
      for (const { key, hotel } of featuredEntries) {
        const enrichment = detailsMap.get(hotel.id);
        if (enrichment) {
          featured[key] = {
            ...featured[key],
            photos: enrichment.photos.length > 0 ? enrichment.photos : featured[key].photos,
            amenities: enrichment.amenities.length > 0 ? enrichment.amenities : featured[key].amenities,
          };

          // Also update the matching entry in the full hotels array
          const idx = searchResult.hotels.findIndex(h => h.id === hotel.id);
          if (idx !== -1) {
            searchResult.hotels[idx] = {
              ...searchResult.hotels[idx],
              photos: enrichment.photos.length > 0 ? enrichment.photos : searchResult.hotels[idx].photos,
              amenities: enrichment.amenities.length > 0 ? enrichment.amenities : searchResult.hotels[idx].amenities,
            };
          }
        }
      }

      console.log(`[discover-search] Enrichment complete. Photos found for ${detailsMap.size}/${uniqueIds.length} hotels`);
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
