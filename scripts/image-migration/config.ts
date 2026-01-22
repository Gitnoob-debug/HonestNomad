// Image migration configuration

export const CONFIG = {
  // Unsplash rate limits
  REQUESTS_PER_HOUR: 50,
  BATCH_COOLDOWN_MS: 70 * 60 * 1000, // 1hr 10min between batches

  // Image counts per destination
  POPULAR_DESTINATION_IMAGES: 30,
  REGULAR_DESTINATION_IMAGES: 20,

  // Local storage paths
  PROGRESS_FILE: 'scripts/image-migration/progress.json',
  MANIFEST_FILE: 'scripts/image-migration/manifest.json',
  IMAGES_DIR: 'scripts/image-migration/downloaded-images',
  PREVIEW_FILE: 'scripts/image-migration/preview.html',

  // Image specs for download
  IMAGE_SIZE: 'regular', // Unsplash size: small, regular, full
};

// Popular destinations get 30 images (high-traffic cities)
export const POPULAR_DESTINATIONS = new Set([
  // Major world cities
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
  'reykjavik', 'costa-rica', 'new-zealand', 'patagonia', 'cape-town',
]);

// Types
export interface ImageRecord {
  filename: string;
  credit: string;
  photographerName: string;
  photographerUrl: string;
  unsplashId: string;
  unsplashUrl: string;
  downloadedAt: string;
  validated: boolean;
  validationStatus: 'pending' | 'approved' | 'rejected' | null;
}

export interface DestinationImages {
  destinationId: string;
  city: string;
  country: string;
  isPopular: boolean;
  imageCount: number;
  images: ImageRecord[];
  completedAt: string | null;
  status: 'pending' | 'downloading' | 'review' | 'approved' | 'rejected';
}

export interface Manifest {
  lastUpdated: string;
  destinations: Record<string, DestinationImages>;
}

export interface Progress {
  lastUpdated: string;
  currentBatch: number;
  totalBatches: number;
  queue: { destId: string; isPopular: boolean }[];
  completed: string[];
  pendingReview: string[];
  approved: string[];
  rejected: string[];
  stats: {
    totalDestinations: number;
    totalImagesDownloaded: number;
    totalApproved: number;
    totalRejected: number;
  };
  lastBatchCompletedAt: string | null;
  nextBatchAvailableAt: string | null;
}

export const INITIAL_PROGRESS: Progress = {
  lastUpdated: new Date().toISOString(),
  currentBatch: 0,
  totalBatches: 0,
  queue: [],
  completed: [],
  pendingReview: [],
  approved: [],
  rejected: [],
  stats: {
    totalDestinations: 0,
    totalImagesDownloaded: 0,
    totalApproved: 0,
    totalRejected: 0,
  },
  lastBatchCompletedAt: null,
  nextBatchAvailableAt: null,
};

export const INITIAL_MANIFEST: Manifest = {
  lastUpdated: new Date().toISOString(),
  destinations: {},
};
