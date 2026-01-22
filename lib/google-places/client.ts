import type {
  ItineraryPathType,
  POICategory,
  CachedPOI,
} from '@/types/poi';

const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places';

// Google Places API types
interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

interface GooglePlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  location: GooglePlaceLocation;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
    languageCode: string;
  };
  editorialSummary?: {
    text: string;
    languageCode: string;
  };
  photos?: GooglePlacePhoto[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  websiteUri?: string;
  googleMapsUri?: string;
}

interface GooglePlacesSearchResponse {
  places?: GooglePlaceResult[];
}

// Text search types for each path
export const PATH_SEARCH_CONFIG: Record<ItineraryPathType, {
  includedTypes: string[];
  textQueries: string[];
  minRating?: number;
}> = {
  classic: {
    includedTypes: [
      'tourist_attraction',
      'museum',
      'historical_landmark',
      'church',
      'city_hall',
    ],
    textQueries: ['famous landmark', 'must see attraction', 'iconic monument'],
    minRating: 4.0,
  },
  foodie: {
    includedTypes: [
      'restaurant',
      'bakery',
      'cafe',
      'food_market',
      'meal_takeaway',
    ],
    textQueries: ['best restaurant', 'local food', 'food market', 'michelin'],
    minRating: 4.3,
  },
  adventure: {
    includedTypes: [
      'hiking_area',
      'national_park',
      'park',
      'beach',
      'marina',
      'ski_resort',
      'sports_complex',
    ],
    textQueries: ['adventure activity', 'outdoor activity', 'hiking', 'water sports'],
    minRating: 4.0,
  },
  cultural: {
    includedTypes: [
      'museum',
      'art_gallery',
      'performing_arts_theater',
      'cultural_center',
      'library',
      'historical_landmark',
    ],
    textQueries: ['museum', 'art gallery', 'cultural center', 'theater'],
    minRating: 4.0,
  },
  relaxation: {
    includedTypes: [
      'park',
      'spa',
      'botanical_garden',
      'nature_preserve',
    ],
    textQueries: ['peaceful park', 'garden', 'spa', 'quiet retreat'],
    minRating: 4.0,
  },
  nightlife: {
    includedTypes: [
      'bar',
      'night_club',
      'pub',
      'wine_bar',
      'cocktail_bar',
    ],
    textQueries: ['best bar', 'nightclub', 'live music', 'rooftop bar'],
    minRating: 4.0,
  },
  trendy: {
    includedTypes: [
      'cafe',
      'coffee_shop',
      'book_store',
      'clothing_store',
      'vintage_store',
    ],
    textQueries: ['hidden gem', 'local favorite', 'hipster', 'specialty coffee'],
    minRating: 4.3,
  },
};

// Map Google place types to our POI categories
function mapGoogleTypeToCategory(types: string[] | undefined, primaryType: string | undefined): POICategory {
  const type = primaryType || (types && types[0]) || '';

  if (type.includes('restaurant') || type.includes('food')) return 'restaurant';
  if (type.includes('cafe') || type.includes('coffee')) return 'cafe';
  if (type.includes('bar') || type.includes('pub') || type.includes('wine')) return 'bar';
  if (type.includes('club') || type.includes('night')) return 'nightclub';
  if (type.includes('museum')) return 'museum';
  if (type.includes('park') || type.includes('garden')) return 'park';
  if (type.includes('market')) return 'market';
  if (type.includes('viewpoint') || type.includes('lookout')) return 'viewpoint';
  if (type.includes('landmark') || type.includes('monument') || type.includes('tourist')) return 'landmark';

  return 'activity';
}

// Map Google price level to number
function mapPriceLevel(priceLevel: GooglePlaceResult['priceLevel']): number | undefined {
  if (!priceLevel) return undefined;
  const mapping: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };
  return mapping[priceLevel];
}

// Generate description from Google data
function generateDescription(place: GooglePlaceResult, pathType: ItineraryPathType): string {
  if (place.editorialSummary?.text) {
    return place.editorialSummary.text;
  }

  const parts: string[] = [];

  if (place.primaryTypeDisplayName?.text) {
    parts.push(place.primaryTypeDisplayName.text);
  }

  if (place.rating && place.rating >= 4.5) {
    parts.push('highly rated');
  }

  if (place.priceLevel) {
    const priceDesc: Record<string, string> = {
      'PRICE_LEVEL_FREE': 'free',
      'PRICE_LEVEL_INEXPENSIVE': 'budget-friendly',
      'PRICE_LEVEL_MODERATE': 'moderate',
      'PRICE_LEVEL_EXPENSIVE': 'upscale',
      'PRICE_LEVEL_VERY_EXPENSIVE': 'luxury',
    };
    if (priceDesc[place.priceLevel]) parts.push(priceDesc[place.priceLevel]);
  }

  const pathContext: Record<ItineraryPathType, string> = {
    classic: 'iconic destination',
    foodie: 'culinary experience',
    adventure: 'exciting activity',
    cultural: 'cultural experience',
    relaxation: 'peaceful retreat',
    nightlife: 'evening hotspot',
    trendy: 'local favorite',
  };

  if (parts.length === 0) {
    parts.push(pathContext[pathType]);
  }

  return parts.join(' - ');
}

// Estimate visit duration based on type
function estimateDuration(place: GooglePlaceResult, pathType: ItineraryPathType): string {
  const type = place.primaryType || (place.types && place.types[0]) || '';

  if (type.includes('museum')) return '2-3 hours';
  if (type.includes('park') || type.includes('garden')) return '1.5-2 hours';
  if (type.includes('restaurant')) return '1.5-2 hours';
  if (type.includes('cafe') || type.includes('coffee')) return '45 min - 1 hour';
  if (type.includes('bar')) return '1-2 hours';
  if (type.includes('club')) return '2-4 hours';
  if (type.includes('market')) return '1.5-2 hours';
  if (type.includes('viewpoint') || type.includes('lookout')) return '30-45 min';
  if (type.includes('landmark') || type.includes('monument')) return '1-2 hours';

  const pathDefaults: Record<ItineraryPathType, string> = {
    classic: '1.5-2 hours',
    foodie: '1.5-2 hours',
    adventure: '2-3 hours',
    cultural: '2-3 hours',
    relaxation: '1.5-2 hours',
    nightlife: '2-3 hours',
    trendy: '1-1.5 hours',
  };

  return pathDefaults[pathType];
}

// Get best time of day for a POI
function getBestTimeOfDay(place: GooglePlaceResult, pathType: ItineraryPathType): CachedPOI['bestTimeOfDay'] {
  const type = place.primaryType || (place.types && place.types[0]) || '';

  if (type.includes('bar') || type.includes('club') || type.includes('night')) {
    return 'night';
  }
  if (type.includes('cafe') || type.includes('coffee') || type.includes('bakery')) {
    return 'morning';
  }
  if (type.includes('restaurant')) {
    return 'evening';
  }
  if (type.includes('market')) {
    return 'morning';
  }
  if (type.includes('museum') || type.includes('gallery')) {
    return 'afternoon';
  }

  return 'any';
}

// Get photo URL from Google Places
function getPhotoUrl(place: GooglePlaceResult, apiKey: string): string | undefined {
  if (place.photos && place.photos.length > 0) {
    const photoName = place.photos[0].name;
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${apiKey}`;
  }
  return undefined;
}

export class GooglePlacesClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Places API key is required');
    }
    this.apiKey = apiKey;
  }

  private async searchNearby(
    latitude: number,
    longitude: number,
    options: {
      includedTypes?: string[];
      maxResultCount?: number;
      rankPreference?: 'POPULARITY' | 'DISTANCE';
    } = {}
  ): Promise<GooglePlaceResult[]> {
    const response = await fetch(`${GOOGLE_PLACES_API_URL}:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.primaryType,places.primaryTypeDisplayName,places.editorialSummary,places.photos,places.regularOpeningHours,places.websiteUri,places.googleMapsUri',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: 15000, // 15km radius
          },
        },
        includedTypes: options.includedTypes,
        maxResultCount: options.maxResultCount || 20,
        rankPreference: options.rankPreference || 'POPULARITY',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    const data: GooglePlacesSearchResponse = await response.json();
    return data.places || [];
  }

  private async textSearch(
    query: string,
    latitude: number,
    longitude: number,
    options: {
      includedType?: string;
      maxResultCount?: number;
    } = {}
  ): Promise<GooglePlaceResult[]> {
    const body: Record<string, unknown> = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: 20000, // 20km bias
        },
      },
      maxResultCount: options.maxResultCount || 20,
    };

    if (options.includedType) {
      body.includedType = options.includedType;
    }

    const response = await fetch(`${GOOGLE_PLACES_API_URL}:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.primaryType,places.primaryTypeDisplayName,places.editorialSummary,places.photos,places.regularOpeningHours,places.websiteUri,places.googleMapsUri',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    const data: GooglePlacesSearchResponse = await response.json();
    return data.places || [];
  }

  async fetchPOIsForPath(
    destinationId: string,
    latitude: number,
    longitude: number,
    pathType: ItineraryPathType,
    limit: number = 30
  ): Promise<CachedPOI[]> {
    const config = PATH_SEARCH_CONFIG[pathType];
    const allPlaces: GooglePlaceResult[] = [];
    const seenIds = new Set<string>();

    // Fetch by included types using nearby search
    for (const type of config.includedTypes.slice(0, 3)) { // Limit to first 3 types to save API calls
      try {
        const places = await this.searchNearby(latitude, longitude, {
          includedTypes: [type],
          maxResultCount: 10,
          rankPreference: 'POPULARITY',
        });

        places.forEach(p => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            allPlaces.push(p);
          }
        });
      } catch (error) {
        console.warn(`Nearby search for type "${type}" failed:`, error);
      }
    }

    // Fetch by text queries for additional coverage
    for (const query of config.textQueries.slice(0, 2)) { // Limit to first 2 queries
      if (allPlaces.length >= limit) break;

      try {
        const places = await this.textSearch(query, latitude, longitude, {
          maxResultCount: 10,
        });

        places.forEach(p => {
          if (!seenIds.has(p.id) && allPlaces.length < limit * 1.5) {
            seenIds.add(p.id);
            allPlaces.push(p);
          }
        });
      } catch (error) {
        console.warn(`Text search for "${query}" failed:`, error);
      }
    }

    // Filter by minimum rating if specified
    let filteredPlaces = allPlaces;
    if (config.minRating) {
      filteredPlaces = allPlaces.filter(p => (p.rating || 0) >= config.minRating!);
    }

    // Sort by rating and review count
    filteredPlaces.sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + Math.min((a.userRatingCount || 0) / 100, 10);
      const scoreB = (b.rating || 0) * 10 + Math.min((b.userRatingCount || 0) / 100, 10);
      return scoreB - scoreA;
    });

    // Convert to CachedPOI format with rankings
    const pois: CachedPOI[] = filteredPlaces.slice(0, limit).map((place, index) => ({
      id: place.id,
      destinationId,
      pathType,
      rank: index + 1,

      name: place.displayName.text,
      description: generateDescription(place, pathType),
      category: mapGoogleTypeToCategory(place.types, place.primaryType),

      latitude: place.location.latitude,
      longitude: place.location.longitude,
      address: place.formattedAddress,

      googleRating: place.rating,
      googleReviewCount: place.userRatingCount,
      googlePrice: mapPriceLevel(place.priceLevel),

      suggestedDuration: estimateDuration(place, pathType),
      bestTimeOfDay: getBestTimeOfDay(place, pathType),

      imageUrl: getPhotoUrl(place, this.apiKey),
      websiteUrl: place.websiteUri,
      googleMapsUrl: place.googleMapsUri,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return pois;
  }
}

// Create client instance
export function createGooglePlacesClient(): GooglePlacesClient {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
  }
  return new GooglePlacesClient(apiKey);
}
