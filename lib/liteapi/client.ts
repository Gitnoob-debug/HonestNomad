// LiteAPI Client for Hotel Search & Booking

import {
  LiteAPIHotel,
  LiteAPIHotelDetails,
  LiteAPIRatesResponse,
  LiteAPIReview,
  LiteAPIOccupancy,
} from './types';

const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';

function getApiKey(): string {
  const key = process.env.LITEAPI_PRODUCTION_KEY || process.env.LITEAPI_SANDBOX_KEY;
  if (!key) {
    throw new Error('LiteAPI key not configured. Set LITEAPI_SANDBOX_KEY or LITEAPI_PRODUCTION_KEY in .env.local');
  }
  return key;
}

async function liteApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LiteAPI error [${response.status}] ${endpoint}:`, errorText);
    // Include error details in the thrown error
    let errorDetail = response.statusText;
    try {
      const errorJson = JSON.parse(errorText);
      // Handle various error response formats
      if (typeof errorJson === 'object') {
        errorDetail = errorJson.message || errorJson.error || errorJson.errors?.[0]?.message || JSON.stringify(errorJson);
      } else {
        errorDetail = String(errorJson);
      }
    } catch {
      errorDetail = errorText || response.statusText;
    }
    throw new Error(`LiteAPI: ${errorDetail}`);
  }

  return response.json();
}

/**
 * Search hotels by coordinates
 */
export async function searchHotelsByLocation(
  latitude: number,
  longitude: number,
  options: {
    radius?: number; // km, default 10
    limit?: number;
    countryCode?: string;
  } = {}
): Promise<{ hotels: LiteAPIHotel[]; total: number }> {
  const { radius = 10, limit = 20 } = options;

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
    limit: limit.toString(),
  });

  const response = await liteApiRequest<{
    data: LiteAPIHotel[];
    hotelIds: string[];
    total: number;
  }>(`/data/hotels?${params}`);

  return {
    hotels: response.data || [],
    total: response.total || 0,
  };
}

/**
 * Search hotels by city name
 */
export async function searchHotelsByCity(
  cityName: string,
  countryCode: string,
  limit: number = 20
): Promise<{ hotels: LiteAPIHotel[]; total: number }> {
  const params = new URLSearchParams({
    cityName,
    countryCode,
    limit: limit.toString(),
  });

  const response = await liteApiRequest<{
    data: LiteAPIHotel[];
    hotelIds: string[];
    total: number;
  }>(`/data/hotels?${params}`);

  return {
    hotels: response.data || [],
    total: response.total || 0,
  };
}

/**
 * Get detailed hotel information
 */
export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotelDetails | null> {
  try {
    const response = await liteApiRequest<{ data: LiteAPIHotelDetails }>(`/data/hotel?hotelId=${hotelId}`);
    return response.data || null;
  } catch (error) {
    console.error(`Failed to get hotel details for ${hotelId}:`, error);
    return null;
  }
}

/**
 * Get real-time rates for hotels
 */
export async function getHotelRates(
  hotelIds: string[],
  checkin: string,
  checkout: string,
  occupancies: LiteAPIOccupancy[],
  options: {
    currency?: string;
    guestNationality?: string;
  } = {}
): Promise<LiteAPIRatesResponse> {
  const { currency = 'USD', guestNationality = 'US' } = options;

  // Clean occupancies - remove undefined children
  const cleanOccupancies = occupancies.map(occ => ({
    adults: occ.adults,
    ...(occ.children && occ.children.length > 0 ? { children: occ.children } : {}),
  }));

  const body = {
    hotelIds,
    checkin,
    checkout,
    occupancies: cleanOccupancies,
    currency,
    guestNationality,
  };

  console.log('[LiteAPI] Rates request:', JSON.stringify(body, null, 2));

  const response = await liteApiRequest<LiteAPIRatesResponse>('/hotels/rates', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return response;
}

/**
 * Get hotel reviews
 */
export async function getHotelReviews(
  hotelId: string,
  limit: number = 10
): Promise<{ reviews: LiteAPIReview[]; total: number }> {
  const params = new URLSearchParams({
    hotelId,
    limit: limit.toString(),
  });

  const response = await liteApiRequest<{
    data: LiteAPIReview[];
    total: number;
  }>(`/data/reviews?${params}`);

  return {
    reviews: response.data || [],
    total: response.total || 0,
  };
}

/**
 * Get minimum rates for multiple hotels (for listing/comparison)
 * Returns the cheapest available rate for each hotel
 */
export async function getHotelMinRates(
  hotelIds: string[],
  checkin: string,
  checkout: string,
  adults: number,
  children: number[] = [],
  currency: string = 'USD'
): Promise<Map<string, { price: number; currency: string; refundable: boolean; offerId: string; rateId: string }>> {
  const occupancies: LiteAPIOccupancy[] = [{
    adults,
    children: children.length > 0 ? children : undefined,
  }];

  const ratesResponse = await getHotelRates(hotelIds, checkin, checkout, occupancies, { currency });

  const minRates = new Map<string, { price: number; currency: string; refundable: boolean; offerId: string; rateId: string }>();

  for (const hotelRates of ratesResponse.data) {
    let minPrice = Infinity;
    let minRate: { price: number; currency: string; refundable: boolean; offerId: string; rateId: string } | null = null;

    for (const roomType of hotelRates.roomTypes) {
      // Use the wholesale price (offerRetailRate)
      const price = roomType.offerRetailRate?.amount || roomType.offerInitialPrice?.amount;

      if (price && price < minPrice) {
        minPrice = price;
        const firstRate = roomType.rates[0];
        minRate = {
          price,
          currency: roomType.offerRetailRate?.currency || currency,
          refundable: firstRate?.cancellationPolicies?.refundableTag === 'RFN',
          offerId: roomType.offerId,
          rateId: firstRate?.rateId || '',
        };
      }
    }

    if (minRate) {
      minRates.set(hotelRates.hotelId, minRate);
    }
  }

  return minRates;
}
