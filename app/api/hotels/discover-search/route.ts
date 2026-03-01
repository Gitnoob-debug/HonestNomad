// Hotel search endpoint for the Discover flow
// Searches near landmark GPS coordinates with radius expansion
// Enriches all hotels with: photos (HD + captions), amenities, room details,
// reviews, chain branding, important info, cancellation deadlines

import { NextRequest, NextResponse } from 'next/server';
import { searchHotelsForDiscoverFlow } from '@/lib/liteapi/hotels';
import { categorizeHotels } from '@/lib/hotels/categorize';
import { getHotelDetails, getHotelReviews } from '@/lib/liteapi/client';
import type { HotelOption } from '@/lib/liteapi/types';

// Enrichment data extracted from details + reviews
interface HotelEnrichment {
  photos: string[];
  photosHd: string[];
  photoCaptions: string[];
  amenities: string[];
  roomDetails?: HotelOption['roomDetails'];
  hotelImportantInformation?: string;
  reviews?: HotelOption['reviews'];
  reviewsTotal?: number;
}

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

    // ── Enrich ALL hotels (parallel): details + reviews ──────────
    // Fetches getHotelDetails + getHotelReviews for every hotel concurrently.
    // Both batches run in parallel via outer Promise.all (~2-3s total).
    if (searchResult.hotels.length > 0) {
      const allIds = searchResult.hotels.map(h => h.id);

      console.log(`[discover-search] Enriching ${allIds.length} hotels (details + reviews, parallel)...`);

      const [detailsResults, reviewsResults] = await Promise.all([
        Promise.all(allIds.map(id => getHotelDetails(id).catch(() => null))),
        Promise.all(allIds.map(id => getHotelReviews(id, 3).catch(() => ({ reviews: [], total: 0 })))),
      ]);

      // Build enrichment map
      const enrichmentMap = new Map<string, HotelEnrichment>();
      let enrichedCount = 0;

      for (let i = 0; i < allIds.length; i++) {
        const details = detailsResults[i];
        const reviewData = reviewsResults[i];

        const enrichment: HotelEnrichment = {
          photos: [],
          photosHd: [],
          photoCaptions: [],
          amenities: [],
        };

        if (details) {
          // Photos: extract url, urlHd, and caption as parallel arrays
          const images = details.hotelImages?.slice(0, 10) || [];
          enrichment.photos = images.map(img => img.url).filter(Boolean);
          enrichment.photosHd = images.map(img => img.urlHd || img.url).filter(Boolean);
          enrichment.photoCaptions = images.map(img => img.caption || '');
          enrichment.amenities = details.hotelFacilities?.slice(0, 15) || [];

          // Room details: extract first room (primary room type)
          const firstRoom = details.rooms?.[0];
          if (firstRoom) {
            enrichment.roomDetails = {
              roomSizeSquare: firstRoom.roomSizeSquare || undefined,
              roomSizeUnit: firstRoom.roomSizeUnit || undefined,
              maxOccupancy: firstRoom.maxOccupancy || undefined,
              maxAdults: firstRoom.maxAdults || undefined,
              maxChildren: firstRoom.maxChildren || undefined,
              bedTypes: firstRoom.bedTypes?.map(bt => ({
                bedType: bt.bedType,
                bedSize: bt.bedSize,
                quantity: bt.quantity,
              })) || undefined,
              views: firstRoom.views?.map(v => v.view) || undefined,
            };
          }

          // Important hotel information (truncate to 500 chars)
          if (details.hotelImportantInformation) {
            enrichment.hotelImportantInformation = details.hotelImportantInformation.slice(0, 500);
          }

          if (enrichment.photos.length > 0) enrichedCount++;
        }

        // Reviews
        if (reviewData && reviewData.reviews && reviewData.reviews.length > 0) {
          enrichment.reviews = reviewData.reviews.slice(0, 3).map(r => ({
            averageScore: r.averageScore,
            name: r.name,
            country: r.country,
            date: r.date,
            headline: r.headline,
            pros: r.pros,
            cons: r.cons,
          }));
          enrichment.reviewsTotal = reviewData.total;
        }

        enrichmentMap.set(allIds[i], enrichment);
      }

      // Apply enrichment to full hotel list
      for (let i = 0; i < searchResult.hotels.length; i++) {
        const e = enrichmentMap.get(searchResult.hotels[i].id);
        if (!e) continue;

        // TODO: Replace synthetic cancelDeadline with real cancelPolicyInfos when USE_MOCK_RATES is false
        let cancelDeadline: string | undefined;
        if (searchResult.hotels[i].refundable && checkin) {
          const deadlineDate = new Date(checkin);
          deadlineDate.setDate(deadlineDate.getDate() - 2);
          cancelDeadline = `Free cancellation until ${deadlineDate.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          })}`;
        }

        searchResult.hotels[i] = {
          ...searchResult.hotels[i],
          photos: e.photos.length > 0 ? e.photos : searchResult.hotels[i].photos,
          photosHd: e.photosHd.length > 0 ? e.photosHd : undefined,
          photoCaptions: e.photoCaptions.length > 0 ? e.photoCaptions : undefined,
          amenities: e.amenities.length > 0 ? e.amenities : searchResult.hotels[i].amenities,
          roomDetails: e.roomDetails,
          hotelImportantInformation: e.hotelImportantInformation,
          reviews: e.reviews,
          reviewsTotal: e.reviewsTotal,
          cancelDeadline,
        };
      }

      // Apply enrichment to featured hotels too (different object references after categorize)
      if (featured) {
        const keys: ('closest' | 'budget' | 'highEnd')[] = ['closest', 'budget', 'highEnd'];
        for (const key of keys) {
          const e = enrichmentMap.get(featured[key].id);
          if (!e) continue;

          let cancelDeadline: string | undefined;
          if (featured[key].refundable && checkin) {
            const deadlineDate = new Date(checkin);
            deadlineDate.setDate(deadlineDate.getDate() - 2);
            cancelDeadline = `Free cancellation until ${deadlineDate.toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}`;
          }

          featured[key] = {
            ...featured[key],
            photos: e.photos.length > 0 ? e.photos : featured[key].photos,
            photosHd: e.photosHd.length > 0 ? e.photosHd : undefined,
            photoCaptions: e.photoCaptions.length > 0 ? e.photoCaptions : undefined,
            amenities: e.amenities.length > 0 ? e.amenities : featured[key].amenities,
            roomDetails: e.roomDetails,
            hotelImportantInformation: e.hotelImportantInformation,
            reviews: e.reviews,
            reviewsTotal: e.reviewsTotal,
            cancelDeadline,
          };
        }
      }

      console.log(`[discover-search] Enrichment complete. Photos: ${enrichedCount}/${allIds.length} hotels`);
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
