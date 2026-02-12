// POI (Point of Interest) types for cached place data (Google Places / Foursquare)

export type ItineraryPathType =
  | 'classic'      // Must-see landmarks, famous attractions
  | 'foodie'       // Restaurants, markets, food tours
  | 'adventure'    // Outdoor activities, day trips, sports
  | 'cultural'     // Museums, galleries, historical sites
  | 'relaxation'   // Parks, spas, quiet spots
  | 'nightlife'    // Bars, clubs, live music
  | 'trendy';      // Hidden gems, local favorites, off-beaten-path

export type POICategory =
  | 'landmark'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'museum'
  | 'park'
  | 'market'
  | 'activity'
  | 'nightclub'
  | 'viewpoint'
  | 'neighborhood';

export interface CachedPOI {
  id: string;                    // Place ID (Google or Foursquare)
  destinationId: string;         // Reference to destination (e.g., 'paris')
  pathType: ItineraryPathType;   // Which itinerary path this belongs to
  rank: number;                  // Priority rank (1 = must-do, higher = nice-to-have)

  // Core data
  name: string;
  description: string;
  category: POICategory;

  // Location
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;

  // Google Places metadata
  googleRating?: number;         // 1-5 rating
  googleReviewCount?: number;    // Number of reviews
  googlePrice?: number;          // 0-4 price level

  // Foursquare metadata (legacy)
  fsqRating?: number;            // 0-10 rating
  fsqPopularity?: number;        // Popularity score
  fsqPrice?: number;             // 1-4 price level
  fsqVerified?: boolean;

  // Visit info
  suggestedDuration: string;     // e.g., "2 hours"
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';

  // Media & Links
  imageUrl?: string;
  supabaseImageUrl?: string;  // Preferred image URL (Supabase Storage)
  websiteUrl?: string;
  googleMapsUrl?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DestinationPOICache {
  destinationId: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;

  // POIs organized by path type, already ranked
  paths: {
    [K in ItineraryPathType]?: CachedPOI[];
  };

  // Metadata
  lastFetched: string;
  apiSource: 'google' | 'foursquare';  // Which API was used
  apiVersion?: string;                  // API version used
  totalPOIs: number;
}

// Foursquare API response types
export interface FoursquarePlaceResult {
  fsq_id: string;
  name: string;
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  location: {
    address?: string;
    formatted_address?: string;
    locality?: string;
    neighborhood?: string[];
    postcode?: string;
    region?: string;
    country?: string;
  };
  categories: {
    id: number;
    name: string;
    short_name: string;
    plural_name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }[];
  distance?: number;
  rating?: number;
  popularity?: number;
  price?: number;
  verified?: boolean;
  photos?: {
    id: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }[];
  tips?: {
    id: string;
    text: string;
    created_at: string;
  }[];
  description?: string;
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
  };
}

export interface FoursquareSearchResponse {
  results: FoursquarePlaceResult[];
  context?: {
    geo_bounds?: {
      circle?: {
        center: { latitude: number; longitude: number };
        radius: number;
      };
    };
  };
}

// Configuration for fetching POIs per path type
export interface PathFetchConfig {
  pathType: ItineraryPathType;
  foursquareCategories: number[];  // Foursquare category IDs
  searchQueries?: string[];        // Additional search terms
  minRating?: number;              // Minimum rating filter
  limit: number;                   // How many to fetch
  sortBy: 'rating' | 'popularity' | 'distance';
}

// Migration progress tracking
export interface POIMigrationProgress {
  startedAt: string;
  lastUpdatedAt: string;
  totalDestinations: number;
  completedDestinations: string[];
  failedDestinations: { id: string; error: string }[];
  currentDestination?: string;
  rateLimitCooldownUntil?: string;
}
