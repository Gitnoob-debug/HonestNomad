interface GeocodingResult {
  latitude: number;
  longitude: number;
  placeName: string;
  city: string;
  country: string;
  confidence: number;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    mapbox_id?: string;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

interface MapboxResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export async function geocodeCity(
  query: string
): Promise<GeocodingResult> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is required');
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `${MAPBOX_BASE_URL}/${encodedQuery}.json?access_token=${accessToken}&types=place,locality,neighborhood&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data: MapboxResponse = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(
      `Location not found: "${query}". Please try a more specific city name.`
    );
  }

  const feature = data.features[0];
  const [longitude, latitude] = feature.center;

  // Extract city and country from context
  let city = feature.text;
  let country = '';

  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('country')) {
        country = ctx.text;
      }
      if (ctx.id.startsWith('place')) {
        city = ctx.text;
      }
    }
  }

  return {
    latitude,
    longitude,
    placeName: feature.place_name,
    city,
    country,
    confidence: feature.relevance,
  };
}

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is required');
  }

  const encodedQuery = encodeURIComponent(address);
  const url = `${MAPBOX_BASE_URL}/${encodedQuery}.json?access_token=${accessToken}&types=address,poi&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data: MapboxResponse = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(`Address not found: "${address}"`);
  }

  const feature = data.features[0];
  const [longitude, latitude] = feature.center;

  let city = '';
  let country = '';

  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('place')) {
        city = ctx.text;
      }
      if (ctx.id.startsWith('country')) {
        country = ctx.text;
      }
    }
  }

  return {
    latitude,
    longitude,
    placeName: feature.place_name,
    city,
    country,
    confidence: feature.relevance,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is required');
  }

  const url = `${MAPBOX_BASE_URL}/${longitude},${latitude}.json?access_token=${accessToken}&types=place,locality&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.statusText}`);
  }

  const data: MapboxResponse = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error('Location not found for these coordinates');
  }

  const feature = data.features[0];

  let city = feature.text;
  let country = '';

  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('country')) {
        country = ctx.text;
      }
    }
  }

  return {
    latitude,
    longitude,
    placeName: feature.place_name,
    city,
    country,
    confidence: feature.relevance,
  };
}

export async function searchPlaces(
  query: string,
  options?: {
    near?: { latitude: number; longitude: number };
    types?: string[];
    limit?: number;
  }
): Promise<GeocodingResult[]> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is required');
  }

  const encodedQuery = encodeURIComponent(query);
  let url = `${MAPBOX_BASE_URL}/${encodedQuery}.json?access_token=${accessToken}`;

  if (options?.types) {
    url += `&types=${options.types.join(',')}`;
  }

  if (options?.limit) {
    url += `&limit=${options.limit}`;
  }

  if (options?.near) {
    url += `&proximity=${options.near.longitude},${options.near.latitude}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Place search failed: ${response.statusText}`);
  }

  const data: MapboxResponse = await response.json();

  return data.features.map((feature) => {
    const [longitude, latitude] = feature.center;

    let city = '';
    let country = '';

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place')) {
          city = ctx.text;
        }
        if (ctx.id.startsWith('country')) {
          country = ctx.text;
        }
      }
    }

    return {
      latitude,
      longitude,
      placeName: feature.place_name,
      city: city || feature.text,
      country,
      confidence: feature.relevance,
    };
  });
}
