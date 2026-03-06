// Pexels Image Migration Configuration
// Runs in PARALLEL with Unsplash - 4x faster rate limits

export const PEXELS_CONFIG = {
  // Pexels rate limits - much more generous than Unsplash
  REQUESTS_PER_HOUR: 200,
  RESULTS_PER_REQUEST: 80, // Pexels allows up to 80 per request
  BATCH_COOLDOWN_MS: 6.75 * 60 * 1000, // 6.75 min between batches (~200/hr limit)

  // Image counts per destination
  IMAGES_PER_DESTINATION: 60, // More images since we have higher limits

  // Separate storage from Unsplash
  PROGRESS_FILE: 'scripts/image-migration/pexels-progress.json',
  MANIFEST_FILE: 'scripts/image-migration/pexels-manifest.json',
  IMAGES_DIR: 'scripts/image-migration/pexels-images',

  // Image size - Pexels offers: original, large2x, large, medium, small, portrait, landscape, tiny
  IMAGE_SIZE: 'large2x' as const, // High quality but not massive
};

// Query categories designed to "sell" destinations
// These focus on what makes people want to visit
// VARIETY STRATEGY: Many specific categories, low count per category, pagination
export const PEXELS_QUERY_CATEGORIES = [
  // Core destination identity (spread across multiple specific queries)
  { category: 'landmarks', suffix: 'famous landmark monument', weight: 2, maxImages: 4 },
  { category: 'skyline', suffix: 'skyline cityscape aerial view', weight: 2, maxImages: 3 },
  { category: 'panorama', suffix: 'panoramic view scenic overlook', weight: 1, maxImages: 2 },

  // Food & Drink - major travel motivator (split into specific types)
  { category: 'local-cuisine', suffix: 'traditional local cuisine plate', weight: 2, maxImages: 4 },
  { category: 'restaurant', suffix: 'restaurant interior dining', weight: 1, maxImages: 3 },
  { category: 'cafe', suffix: 'cafe coffee terrace outdoor', weight: 1, maxImages: 3 },
  { category: 'street-food', suffix: 'street food vendor market stall', weight: 2, maxImages: 4 },
  { category: 'drinks', suffix: 'bar cocktail wine local drink', weight: 1, maxImages: 2 },

  // Streets & Neighborhoods (different angles)
  { category: 'old-town', suffix: 'old town historic quarter cobblestone', weight: 2, maxImages: 4 },
  { category: 'streets', suffix: 'street scene walking pedestrian', weight: 2, maxImages: 3 },
  { category: 'neighborhood', suffix: 'neighborhood residential local life', weight: 1, maxImages: 2 },
  { category: 'alley', suffix: 'narrow alley passage charming', weight: 1, maxImages: 2 },

  // Time of day variety
  { category: 'sunrise', suffix: 'sunrise morning golden light', weight: 1, maxImages: 2 },
  { category: 'sunset', suffix: 'sunset evening golden hour', weight: 2, maxImages: 3 },
  { category: 'night', suffix: 'night lights illuminated evening', weight: 2, maxImages: 4 },
  { category: 'blue-hour', suffix: 'twilight blue hour dusk', weight: 1, maxImages: 2 },

  // Culture & Experiences
  { category: 'culture', suffix: 'culture tradition local customs', weight: 2, maxImages: 3 },
  { category: 'festival', suffix: 'festival celebration event', weight: 1, maxImages: 2 },
  { category: 'market', suffix: 'market bazaar shopping local', weight: 2, maxImages: 3 },
  { category: 'art', suffix: 'art gallery museum exhibition', weight: 1, maxImages: 2 },

  // Architecture variety
  { category: 'historic', suffix: 'historic building ancient ruins', weight: 2, maxImages: 3 },
  { category: 'modern', suffix: 'modern architecture contemporary', weight: 1, maxImages: 2 },
  { category: 'religious', suffix: 'church mosque temple cathedral', weight: 2, maxImages: 3 },
  { category: 'palace', suffix: 'palace castle fortress', weight: 1, maxImages: 2 },

  // Nature & Outdoors
  { category: 'park', suffix: 'park garden green space', weight: 1, maxImages: 2 },
  { category: 'waterfront', suffix: 'waterfront river harbor marina', weight: 2, maxImages: 3 },
  { category: 'beach', suffix: 'beach coast seaside shore', weight: 1, maxImages: 3 }, // Only for coastal

  // People & Energy
  { category: 'people', suffix: 'people crowd busy vibrant', weight: 1, maxImages: 2 },
  { category: 'lifestyle', suffix: 'lifestyle local people daily', weight: 1, maxImages: 2 },
];

// Types
export interface PexelsImageRecord {
  filename: string;
  credit: string;
  photographerName: string;
  photographerUrl: string;
  photographerId: number;
  pexelsId: number;
  pexelsUrl: string;
  avgColor: string;
  altText: string | null;
  downloadedAt: string;
  queryUsed: string;
  width: number;
  height: number;
}

export interface PexelsDestinationImages {
  destinationId: string;
  city: string;
  country: string;
  highlights: string[]; // Store highlights for reference
  imageCount: number;
  images: PexelsImageRecord[];
  completedAt: string | null;
  source: 'pexels';
}

export interface PexelsManifest {
  lastUpdated: string;
  source: 'pexels';
  destinations: Record<string, PexelsDestinationImages>;
}

export interface PexelsProgress {
  lastUpdated: string;
  currentBatch: number;
  totalBatches: number;
  queue: string[];
  completed: string[];
  stats: {
    totalDestinations: number;
    totalImagesDownloaded: number;
    apiCallsUsed: number;
  };
  lastBatchCompletedAt: string | null;
  nextBatchAvailableAt: string | null;
}

export const INITIAL_PEXELS_PROGRESS: PexelsProgress = {
  lastUpdated: new Date().toISOString(),
  currentBatch: 0,
  totalBatches: 0,
  queue: [],
  completed: [],
  stats: {
    totalDestinations: 0,
    totalImagesDownloaded: 0,
    apiCallsUsed: 0,
  },
  lastBatchCompletedAt: null,
  nextBatchAvailableAt: null,
};

export const INITIAL_PEXELS_MANIFEST: PexelsManifest = {
  lastUpdated: new Date().toISOString(),
  source: 'pexels',
  destinations: {},
};
