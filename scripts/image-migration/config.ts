// Image migration configuration
// UPDATED: Full resolution, 50 images per destination, one city per hour

export const CONFIG = {
  // Unsplash rate limits
  REQUESTS_PER_HOUR: 50,
  BATCH_COOLDOWN_MS: 63 * 60 * 1000, // 1hr 3min between batches (safety margin)

  // Image counts - ALL destinations get 50 images (full hourly quota)
  IMAGES_PER_DESTINATION: 50,

  // Local storage paths
  PROGRESS_FILE: 'scripts/image-migration/progress.json',
  MANIFEST_FILE: 'scripts/image-migration/manifest.json',
  IMAGES_DIR: 'scripts/image-migration/downloaded-images',
  PREVIEW_FILE: 'scripts/image-migration/preview.html',

  // Image specs for download - FULL RESOLUTION for maximum quality
  IMAGE_SIZE: 'full' as const, // Unsplash size: small, regular, full, raw
};

// Search query categories for variety within each destination
// Each destination will use multiple different query angles
export const QUERY_CATEGORIES = [
  'landmarks iconic',           // Famous landmarks
  'architecture buildings',     // Architecture
  'street life people',         // Street scenes
  'nature landscape scenic',    // Nature/parks
  'food restaurant cafe',       // Food & dining
  'night lights evening',       // Nighttime shots
  'aerial skyline view',        // Aerial/skyline
  'historic old town',          // Historic areas
  'modern contemporary',        // Modern architecture
  'local culture authentic',    // Local culture
];

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
  queryUsed: string; // Track which query found this image
}

export interface DestinationImages {
  destinationId: string;
  city: string;
  country: string;
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
  queue: string[]; // Just destination IDs now (no popular/regular distinction)
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
