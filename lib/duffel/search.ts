import { duffel } from './client';
import type { HotelSearchParams, NormalizedHotel } from '@/types/hotel';
import { geocodeCity } from '@/lib/geocoding/mapbox';

export async function searchHotels(
  params: HotelSearchParams
): Promise<NormalizedHotel[]> {
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

  // Search for accommodations
  const searchResponse = await duffel.stays.search({
    check_in_date: params.checkIn,
    check_out_date: params.checkOut,
    rooms: params.rooms || 1,
    guests,
    location: {
      geographic_coordinates: coordinates,
    },
    radius: params.location.radiusKm || 10,
  });

  const accommodations = searchResponse.data;

  // Filter by budget if specified
  let filtered = accommodations;
  if (params.budget) {
    const nights = getNights(params.checkIn, params.checkOut);

    filtered = accommodations.filter((acc: any) => {
      const nightlyRate =
        parseFloat(acc.cheapest_rate_total_amount) / nights;

      const meetsMin =
        !params.budget!.min || nightlyRate >= params.budget!.min;
      const meetsMax =
        !params.budget!.max || nightlyRate <= params.budget!.max;

      return meetsMin && meetsMax;
    });
  }

  // Normalize to our format
  return filtered.map((acc: any) =>
    normalizeAccommodation(acc, params.checkIn, params.checkOut)
  );
}

function normalizeAccommodation(
  acc: any,
  checkIn: string,
  checkOut: string
): NormalizedHotel {
  const nights = getNights(checkIn, checkOut);
  const totalAmount = parseFloat(acc.cheapest_rate_total_amount || '0');

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

    cheapestRateId: acc.cheapest_rate_id || '',

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
