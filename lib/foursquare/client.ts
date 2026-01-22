import type {
  FoursquareSearchResponse,
  FoursquarePlaceResult,
  ItineraryPathType,
  POICategory,
  CachedPOI,
} from '@/types/poi';

const FOURSQUARE_API_URL = 'https://api.foursquare.com/v3';

// Foursquare category IDs for each path type
// See: https://docs.foursquare.com/data-products/docs/categories
export const PATH_CATEGORY_CONFIG: Record<ItineraryPathType, {
  categoryIds: number[];
  searchQueries: string[];
  sortBy: 'RATING' | 'POPULARITY' | 'DISTANCE';
  minRating?: number;
}> = {
  classic: {
    // Landmarks, monuments, historic sites, famous attractions
    categoryIds: [
      16000, // Landmarks and Outdoors
      16003, // Botanical Garden
      16004, // Castle
      16009, // Historic Site
      16011, // Monument
      16017, // Palace
      16020, // Scenic Lookout
      16026, // Landmarks
      10027, // Museum
      12000, // Arts and Entertainment
    ],
    searchQueries: ['famous landmark', 'must see attraction', 'iconic'],
    sortBy: 'POPULARITY',
    minRating: 7,
  },
  foodie: {
    // Restaurants, markets, food experiences
    categoryIds: [
      13000, // Dining and Drinking
      13002, // Bakery
      13003, // Bar
      13034, // Food Court
      13035, // Food Truck
      13065, // Restaurant
      17069, // Farmers Market
      17070, // Flea Market
      17073, // Food and Beverage Retail
    ],
    searchQueries: ['best restaurant', 'local food', 'food market', 'michelin'],
    sortBy: 'RATING',
    minRating: 8,
  },
  adventure: {
    // Outdoor activities, sports, day trips
    categoryIds: [
      16000, // Landmarks and Outdoors
      16001, // Beach
      16007, // Harbor / Marina
      16015, // Nature Preserve
      16019, // Ski Area
      16021, // Sports Field
      16024, // Trail
      18000, // Sports and Recreation
      18012, // Climbing Gym
      18018, // Golf Course
      18021, // Hiking Trail
      18067, // Water Park
    ],
    searchQueries: ['adventure', 'outdoor activity', 'hiking', 'water sports'],
    sortBy: 'RATING',
    minRating: 7,
  },
  cultural: {
    // Museums, galleries, theaters, cultural sites
    categoryIds: [
      10000, // Arts and Entertainment
      10002, // Art Gallery
      10003, // Art Museum
      10010, // Concert Hall
      10024, // History Museum
      10025, // Indie Theater
      10027, // Museum
      10032, // Opera House
      10034, // Performing Arts Venue
      10047, // Theater
      16009, // Historic Site
    ],
    searchQueries: ['museum', 'art gallery', 'cultural center', 'theater'],
    sortBy: 'RATING',
    minRating: 7,
  },
  relaxation: {
    // Parks, gardens, spas, quiet spots
    categoryIds: [
      16002, // Botanical Garden
      16014, // National Park
      16015, // Nature Preserve
      16016, // Other Great Outdoors
      16018, // Park
      16023, // State Park
      11000, // Business and Professional
      11062, // Spa
      18023, // Hot Spring
    ],
    searchQueries: ['peaceful park', 'garden', 'spa', 'quiet retreat'],
    sortBy: 'RATING',
    minRating: 7,
  },
  nightlife: {
    // Bars, clubs, live music
    categoryIds: [
      13003, // Bar
      13004, // Beer Bar
      13006, // Beer Garden
      13012, // Cocktail Bar
      13017, // Dive Bar
      13022, // Hotel Bar
      13025, // Lounge
      13029, // Pub
      13031, // Rooftop Bar
      13033, // Wine Bar
      10008, // Club
      10029, // Jazz Club
      10030, // Live Music Venue
    ],
    searchQueries: ['best bar', 'nightclub', 'live music', 'rooftop bar'],
    sortBy: 'POPULARITY',
    minRating: 7,
  },
  trendy: {
    // Hidden gems, local favorites, off-beaten-path
    categoryIds: [
      13000, // Dining and Drinking (all)
      13009, // Cafe
      13050, // Coffee Shop
      17000, // Retail
      17003, // Antique Shop
      17010, // Bookstore
      17018, // Clothing Store
      17026, // Flea Market
      17078, // Record Shop
      17081, // Thrift Store
      17086, // Vintage Store
    ],
    searchQueries: ['hidden gem', 'local favorite', 'off beaten path', 'secret spot', 'hipster'],
    sortBy: 'RATING',
    minRating: 8,
  },
};

// Map Foursquare categories to our POI categories
function mapFoursquareCategory(fsqCategories: FoursquarePlaceResult['categories']): POICategory {
  if (!fsqCategories || fsqCategories.length === 0) return 'activity';

  const primaryCategory = fsqCategories[0];
  const categoryId = primaryCategory.id;
  const categoryName = primaryCategory.name.toLowerCase();

  // Map based on category ID ranges and names
  if (categoryId >= 13000 && categoryId < 14000) {
    if (categoryName.includes('bar') || categoryName.includes('pub') || categoryName.includes('lounge')) {
      return 'bar';
    }
    if (categoryName.includes('cafe') || categoryName.includes('coffee')) {
      return 'cafe';
    }
    return 'restaurant';
  }

  if (categoryId >= 10000 && categoryId < 11000) {
    if (categoryName.includes('museum')) return 'museum';
    if (categoryName.includes('club')) return 'nightclub';
    return 'activity';
  }

  if (categoryId >= 16000 && categoryId < 17000) {
    if (categoryName.includes('park') || categoryName.includes('garden')) return 'park';
    if (categoryName.includes('lookout') || categoryName.includes('viewpoint')) return 'viewpoint';
    return 'landmark';
  }

  if (categoryId >= 17000 && categoryId < 18000) {
    if (categoryName.includes('market')) return 'market';
    return 'activity';
  }

  return 'activity';
}

// Generate description from Foursquare data
function generateDescription(place: FoursquarePlaceResult, pathType: ItineraryPathType): string {
  const parts: string[] = [];

  // Use Foursquare description if available
  if (place.description) {
    return place.description;
  }

  // Build description from available data
  const categories = place.categories?.map(c => c.name).join(', ');
  if (categories) {
    parts.push(categories);
  }

  if (place.location?.neighborhood && place.location.neighborhood.length > 0) {
    parts.push(`in ${place.location.neighborhood[0]}`);
  }

  if (place.rating && place.rating >= 8) {
    parts.push('highly rated');
  }

  if (place.price) {
    const priceDesc = ['budget-friendly', 'moderate', 'upscale', 'luxury'][place.price - 1];
    if (priceDesc) parts.push(priceDesc);
  }

  // Add path-specific context
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

// Estimate visit duration based on category
function estimateDuration(place: FoursquarePlaceResult, pathType: ItineraryPathType): string {
  const category = place.categories?.[0]?.name.toLowerCase() || '';

  // Specific durations by category type
  if (category.includes('museum')) return '2-3 hours';
  if (category.includes('park') || category.includes('garden')) return '1.5-2 hours';
  if (category.includes('restaurant')) return '1.5-2 hours';
  if (category.includes('cafe') || category.includes('coffee')) return '45 min - 1 hour';
  if (category.includes('bar')) return '1-2 hours';
  if (category.includes('club')) return '2-4 hours';
  if (category.includes('market')) return '1.5-2 hours';
  if (category.includes('lookout') || category.includes('viewpoint')) return '30-45 min';
  if (category.includes('historic')) return '1-2 hours';

  // Path-specific defaults
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
function getBestTimeOfDay(place: FoursquarePlaceResult, pathType: ItineraryPathType): CachedPOI['bestTimeOfDay'] {
  const category = place.categories?.[0]?.name.toLowerCase() || '';

  if (category.includes('bar') || category.includes('club') || category.includes('nightlife')) {
    return 'night';
  }
  if (category.includes('cafe') || category.includes('coffee') || category.includes('bakery')) {
    return 'morning';
  }
  if (category.includes('restaurant')) {
    return 'evening';
  }
  if (category.includes('market')) {
    return 'morning';
  }
  if (category.includes('museum') || category.includes('gallery')) {
    return 'afternoon';
  }

  return 'any';
}

// Get photo URL from Foursquare
function getPhotoUrl(place: FoursquarePlaceResult): string | undefined {
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0];
    return `${photo.prefix}original${photo.suffix}`;
  }
  return undefined;
}

export class FoursquareClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Foursquare API key is required');
    }
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${FOURSQUARE_API_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.apiKey,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Foursquare API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async searchPlaces(
    latitude: number,
    longitude: number,
    options: {
      categories?: number[];
      query?: string;
      radius?: number;
      limit?: number;
      sort?: 'RATING' | 'POPULARITY' | 'DISTANCE';
      minRating?: number;
    } = {}
  ): Promise<FoursquarePlaceResult[]> {
    const params: Record<string, string> = {
      ll: `${latitude},${longitude}`,
      radius: String(options.radius || 15000), // 15km default radius
      limit: String(options.limit || 50),
      sort: options.sort || 'RATING',
      fields: 'fsq_id,name,geocodes,location,categories,distance,rating,popularity,price,verified,photos,tips,description,hours',
    };

    if (options.categories && options.categories.length > 0) {
      params.categories = options.categories.join(',');
    }

    if (options.query) {
      params.query = options.query;
    }

    const response = await this.fetch<FoursquareSearchResponse>('/places/search', params);
    let results = response.results || [];

    // Filter by minimum rating if specified
    if (options.minRating) {
      results = results.filter(p => (p.rating || 0) >= options.minRating!);
    }

    return results;
  }

  async fetchPOIsForPath(
    destinationId: string,
    latitude: number,
    longitude: number,
    pathType: ItineraryPathType,
    limit: number = 30
  ): Promise<CachedPOI[]> {
    const config = PATH_CATEGORY_CONFIG[pathType];
    const allPlaces: FoursquarePlaceResult[] = [];
    const seenIds = new Set<string>();

    // Fetch by categories
    if (config.categoryIds.length > 0) {
      const categoryPlaces = await this.searchPlaces(latitude, longitude, {
        categories: config.categoryIds,
        limit: Math.min(50, limit),
        sort: config.sortBy,
        minRating: config.minRating,
        radius: 20000, // 20km for broader coverage
      });

      categoryPlaces.forEach(p => {
        if (!seenIds.has(p.fsq_id)) {
          seenIds.add(p.fsq_id);
          allPlaces.push(p);
        }
      });
    }

    // Fetch by search queries for additional coverage
    for (const query of config.searchQueries) {
      if (allPlaces.length >= limit) break;

      try {
        const queryPlaces = await this.searchPlaces(latitude, longitude, {
          query,
          limit: 20,
          sort: config.sortBy,
          minRating: config.minRating,
        });

        queryPlaces.forEach(p => {
          if (!seenIds.has(p.fsq_id) && allPlaces.length < limit * 1.5) {
            seenIds.add(p.fsq_id);
            allPlaces.push(p);
          }
        });
      } catch (error) {
        console.warn(`Search query "${query}" failed:`, error);
      }
    }

    // Sort by rating/popularity and rank
    allPlaces.sort((a, b) => {
      const scoreA = (a.rating || 0) * 10 + (a.popularity || 0);
      const scoreB = (b.rating || 0) * 10 + (b.popularity || 0);
      return scoreB - scoreA;
    });

    // Convert to CachedPOI format with rankings
    const pois: CachedPOI[] = allPlaces.slice(0, limit).map((place, index) => ({
      id: place.fsq_id,
      destinationId,
      pathType,
      rank: index + 1, // 1-based ranking

      name: place.name,
      description: generateDescription(place, pathType),
      category: mapFoursquareCategory(place.categories),

      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude,
      address: place.location?.formatted_address,
      neighborhood: place.location?.neighborhood?.[0],

      fsqRating: place.rating,
      fsqPopularity: place.popularity,
      fsqPrice: place.price,
      fsqVerified: place.verified,

      suggestedDuration: estimateDuration(place, pathType),
      bestTimeOfDay: getBestTimeOfDay(place, pathType),

      imageUrl: getPhotoUrl(place),

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return pois;
  }
}

// Create client instance
export function createFoursquareClient(): FoursquareClient {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error('FOURSQUARE_API_KEY environment variable is not set');
  }
  return new FoursquareClient(apiKey);
}
