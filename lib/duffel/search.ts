import { duffel, getDuffelClient } from './client';
import type { HotelSearchParams, NormalizedHotel, Room, Rate } from '@/types/hotel';
import { geocodeCity } from '@/lib/geocoding/mapbox';
import { getMockHotels, isMockMode } from './mock-data';

export async function searchHotels(
  params: HotelSearchParams
): Promise<NormalizedHotel[]> {
  // Use mock data if Duffel Stays API is not available
  if (isMockMode()) {
    console.log('Using mock hotel data (Duffel Stays API not available)');
    return getMockHotels(
      params.location.city || 'default',
      params.checkIn,
      params.checkOut,
      params.budget
    );
  }

  // Get coordinates for the location
  let coordinates: { latitude: number; longitude: number };

  if (params.location.latitude && params.location.longitude) {
    coordinates = {
      latitude: params.location.latitude,
      longitude: params.location.longitude,
    };
  } else if (params.location.city) {
    const geocoded = await geocodeCity(params.location.city);
    coordinates = {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    };
  } else {
    throw new Error('Location is required for hotel search');
  }

  // Build guest array
  const guests = Array(params.guests || 1).fill({ type: 'adult' as const });

  console.log('Searching Duffel Stays API for accommodations...');

  // Step 1: Search for accommodations
  const searchResponse = await duffel.stays.search({
    check_in_date: params.checkIn,
    check_out_date: params.checkOut,
    rooms: params.rooms || 1,
    guests,
    location: {
      geographic_coordinates: coordinates,
      radius: params.location.radiusKm || 10,
    },
  });

  // The search returns an array of results
  const searchResults = searchResponse.data.results || [];
  console.log(`Found ${searchResults.length} accommodations`);

  if (searchResults.length === 0) {
    return [];
  }

  // Filter by budget early if specified (using cheapest_rate from search)
  let filteredResults = searchResults;
  if (params.budget) {
    const nights = getNights(params.checkIn, params.checkOut);
    filteredResults = searchResults.filter((result: any) => {
      const nightlyRate =
        parseFloat(result.cheapest_rate_total_amount || '0') / nights;
      const meetsMin = !params.budget!.min || nightlyRate >= params.budget!.min;
      const meetsMax = !params.budget!.max || nightlyRate <= params.budget!.max;
      return meetsMin && meetsMax;
    });
  }

  // Limit to top 10 results to avoid rate limiting
  const topResults = filteredResults.slice(0, 10);

  // Step 2: Fetch rates for each search result (in parallel for speed)
  const accommodationsWithRates = await Promise.all(
    topResults.map(async (result: any) => {
      try {
        const ratesResponse = await fetchRatesForSearchResult(result.id);
        return {
          ...result.accommodation,
          cheapest_rate_total_amount: result.cheapest_rate_total_amount,
          cheapest_rate_currency: result.cheapest_rate_currency,
          search_result_id: result.id,
          rooms: ratesResponse?.rooms || [],
        };
      } catch (error) {
        console.error(`Error fetching rates for ${result.id}:`, error);
        // Return accommodation without detailed rates
        return {
          ...result.accommodation,
          cheapest_rate_total_amount: result.cheapest_rate_total_amount,
          cheapest_rate_currency: result.cheapest_rate_currency,
          search_result_id: result.id,
          rooms: [],
        };
      }
    })
  );

  // Normalize to our format
  return accommodationsWithRates.map((acc: any) =>
    normalizeAccommodation(acc, params.checkIn, params.checkOut)
  );
}

// Step 2: Fetch all rates for a search result
async function fetchRatesForSearchResult(searchResultId: string): Promise<any> {
  try {
    const response = await getDuffelClient().stays.searchResults.fetchAllRates(
      searchResultId
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch rates for search result ${searchResultId}:`, error);
    return null;
  }
}

// Step 3: Create a quote for a specific rate
export async function createHotelQuote(rateId: string): Promise<{ quoteId: string; expiresAt: string } | null> {
  try {
    // Duffel SDK expects rate_id as the first parameter
    const response = await getDuffelClient().stays.quotes.create(rateId);
    const quote = response.data as any;
    return {
      quoteId: quote.id,
      expiresAt: quote.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Default 15 min expiry
    };
  } catch (error) {
    console.error('Failed to create hotel quote:', error);
    return null;
  }
}

function normalizeAccommodation(
  acc: any,
  checkIn: string,
  checkOut: string
): NormalizedHotel {
  const nights = getNights(checkIn, checkOut);
  const totalAmount = parseFloat(acc.cheapest_rate_total_amount || '0');

  // Get cheapest rate ID from rooms if available
  let cheapestRateId = acc.cheapest_rate_id || '';
  if (!cheapestRateId && acc.rooms?.length > 0) {
    // Find the cheapest rate from all rooms
    let cheapestRate: any = null;
    for (const room of acc.rooms) {
      for (const rate of room.rates || []) {
        if (!cheapestRate || parseFloat(rate.total_amount || '0') < parseFloat(cheapestRate.total_amount || '0')) {
          cheapestRate = rate;
        }
      }
    }
    if (cheapestRate) {
      cheapestRateId = cheapestRate.id;
    }
  }

  return {
    id: acc.id,
    duffelId: acc.id,
    name: acc.name || 'Unknown Hotel',
    description: acc.description || '',

    location: {
      address: acc.location?.address?.line_1 || '',
      city: acc.location?.address?.city_name || '',
      country: acc.location?.address?.country_code || '',
      latitude: acc.location?.geographic_coordinates?.latitude || 0,
      longitude: acc.location?.geographic_coordinates?.longitude || 0,
    },

    rating: {
      stars: acc.rating || null,
      reviewScore: acc.review_score || null,
      reviewCount: acc.review_count || null,
    },

    photos: (acc.photos || []).map((p: any) => ({
      url: p.url,
      caption: p.caption || null,
    })),

    amenities: acc.amenities || [],

    pricing: {
      totalAmount,
      currency: acc.cheapest_rate_currency || 'USD',
      nightlyRate: totalAmount / nights,
    },

    cheapestRateId,
    searchResultId: acc.search_result_id,

    rooms: (acc.rooms || []).map((room: any) => ({
      id: room.id,
      name: room.name || 'Standard Room',
      description: room.description || '',
      beds: room.beds || '',
      maxOccupancy: room.max_occupancy || 2,
      rates: (room.rates || []).map((rate: any) => ({
        id: rate.id,
        totalAmount: parseFloat(rate.total_amount || '0'),
        currency: rate.total_currency || 'USD',
        cancellationPolicy: {
          refundable: rate.cancellation_timeline?.some(
            (t: any) => t.refund_amount !== '0'
          ) || false,
          deadline: rate.cancellation_timeline?.[0]?.before,
        },
        boardType: rate.board_type || 'room_only',
      })),
    })),
  };
}

function getNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function getHotelDetails(hotelId: string): Promise<any> {
  // Duffel doesn't have a separate hotel details endpoint
  // Details come from the search results
  // This function is a placeholder for potential future API additions
  return null;
}
