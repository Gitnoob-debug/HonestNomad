// Image migration configuration
// UPDATED: Tiered image counts — 100 for major destinations, 50 for standard

export const CONFIG = {
  // Unsplash rate limits
  REQUESTS_PER_HOUR: 50,
  BATCH_COOLDOWN_MS: 63 * 60 * 1000, // 1hr 3min between batches (safety margin)

  // Tiered image counts based on destination size
  // Major destinations (150+ POIs, major cities) get 100 images (2 batches)
  // Standard destinations get 50 images (1 batch)
  IMAGES_PER_MAJOR_DESTINATION: 100,
  IMAGES_PER_STANDARD_DESTINATION: 50,

  // Threshold: destinations with >= this many unique POIs are "major"
  MAJOR_DESTINATION_POI_THRESHOLD: 150,

  // Local storage paths
  PROGRESS_FILE: 'scripts/image-migration/progress.json',
  MANIFEST_FILE: 'scripts/image-migration/manifest.json',
  IMAGES_DIR: 'scripts/image-migration/downloaded-images',
  PREVIEW_FILE: 'scripts/image-migration/preview.html',

  // Image specs for download - FULL RESOLUTION for maximum quality
  IMAGE_SIZE: 'full' as const, // Unsplash size: small, regular, full, raw
};

// Major destinations — cities with 150+ unique POIs that need deeper image coverage.
// These get 100 images (2 hourly batches) instead of the standard 50.
// Determined by POI count analysis + tourist importance.
export const MAJOR_DESTINATIONS = new Set([
  // European capitals & major cities (all 150+ POIs, all <50% coverage)
  'paris', 'london', 'rome', 'barcelona', 'madrid', 'berlin', 'vienna',
  'milan', 'amsterdam', 'prague', 'budapest', 'lisbon', 'brussels',
  'copenhagen', 'stockholm', 'oslo', 'helsinki', 'edinburgh', 'dublin',
  'athens', 'zurich', 'geneva', 'lyon', 'seville', 'porto', 'florence',
  'venice', 'krakow', 'marseille', 'munich', 'santorini', 'dubrovnik',
  'hamburg',
  // Key non-European majors with low coverage
  'istanbul',
]);

// Zero-coverage destinations that need images from scratch (50 images each)
export const ZERO_COVERAGE_DESTINATIONS = new Set([
  'tbilisi',   // Georgia — 125 POIs, 0 images
  'varanasi',  // India — 128 POIs, 0 images
]);

// Priority queue: only these destinations will be downloaded in the current run.
// Combines major cities (100 images) + zero-coverage cities (50 images).
export const PRIORITY_DESTINATIONS = new Set([
  ...MAJOR_DESTINATIONS,
  ...ZERO_COVERAGE_DESTINATIONS,
]);

/** Get the target image count for a destination */
export function getImageCount(destId: string): number {
  return MAJOR_DESTINATIONS.has(destId)
    ? CONFIG.IMAGES_PER_MAJOR_DESTINATION
    : CONFIG.IMAGES_PER_STANDARD_DESTINATION;
}

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

export interface QueueEntry {
  destId: string;
  /** For major destinations that need 2 batches: which batch (1 or 2) */
  batchPart: number;
  /** Total batches this destination needs */
  totalParts: number;
  /** How many images to download in this batch */
  imageCount: number;
  isMajor: boolean;
}

export interface Progress {
  lastUpdated: string;
  currentBatch: number;
  totalBatches: number;
  queue: QueueEntry[];
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
