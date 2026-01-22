// Image migration configuration

export const CONFIG = {
  // Unsplash rate limits
  REQUESTS_PER_HOUR: 50,
  DELAY_BETWEEN_REQUESTS_MS: 1500, // 1.5 seconds between requests (safe buffer)
  SESSION_DURATION_MS: 75 * 60 * 1000, // 1hr 15min per session

  // Image counts
  POPULAR_DESTINATION_IMAGES: 30,
  REGULAR_DESTINATION_IMAGES: 20,

  // Storage paths
  PROGRESS_FILE: 'scripts/image-migration/progress.json',
  OUTPUT_DIR: 'public/images/destinations', // For local testing, later Supabase

  // Image specs
  IMAGE_WIDTH: 600,
  IMAGE_HEIGHT: 800,
  IMAGE_QUALITY: 80,
};

// Popular destinations get more images (high-traffic cities)
export const POPULAR_DESTINATIONS = new Set([
  // Major cities
  'paris', 'london', 'rome', 'barcelona', 'amsterdam', 'new-york', 'tokyo',
  'los-angeles', 'miami', 'las-vegas', 'san-francisco', 'chicago', 'boston',
  'dubai', 'singapore', 'hong-kong', 'bangkok', 'bali', 'sydney', 'melbourne',

  // Top vacation spots
  'cancun', 'hawaii', 'maui', 'santorini', 'mykonos', 'maldives', 'fiji',
  'bora-bora', 'turks-caicos', 'bahamas', 'jamaica', 'aruba', 'st-lucia',

  // European favorites
  'florence', 'venice', 'amalfi', 'cinque-terre', 'lisbon', 'prague',
  'vienna', 'dublin', 'edinburgh', 'swiss-alps', 'ibiza', 'nice',

  // Adventure/nature
  'iceland', 'costa-rica', 'new-zealand', 'patagonia', 'cape-town',
]);

export interface MigrationProgress {
  lastUpdated: string;
  completedDestinations: string[];
  failedDestinations: { id: string; error: string; attempts: number }[];
  currentSession: {
    startedAt: string;
    requestCount: number;
  } | null;
  stats: {
    totalDestinations: number;
    completed: number;
    failed: number;
    imagesDownloaded: number;
  };
}

export const INITIAL_PROGRESS: MigrationProgress = {
  lastUpdated: new Date().toISOString(),
  completedDestinations: [],
  failedDestinations: [],
  currentSession: null,
  stats: {
    totalDestinations: 410,
    completed: 0,
    failed: 0,
    imagesDownloaded: 0,
  },
};
