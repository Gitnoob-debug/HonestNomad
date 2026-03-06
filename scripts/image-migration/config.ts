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
  // ── New destinations batch (215) ──────────────────────────
  // Turkey (7)
  'bodrum', 'cappadocia', 'izmir', 'trabzon', 'ephesus', 'pamukkale', 'gaziantep',
  // US (28)
  'sacramento', 'san-jose', 'columbus', 'baltimore', 'honolulu', 'newport-ri',
  'finger-lakes', 'berkshires', 'outer-banks', 'mackinac-island', 'bozeman', 'bend',
  'kauai', 'big-island', 'lake-placid', 'taos', 'telluride', 'stowe',
  'bar-harbor', 'annapolis', 'door-county', 'whitefish', 'sarasota', 'hilton-head',
  'galveston', 'traverse-city', 'mystic', 'providence',
  // Iceland (4)
  'akureyri', 'vik', 'husavik', 'blue-lagoon',
  // Ireland (4)
  'killarney', 'dingle', 'cliffs-of-moher', 'westport',
  // Portugal (5)
  'braga', 'coimbra', 'evora', 'guimaraes', 'tavira',
  // Spain (4)
  'segovia', 'salamanca', 'ronda', 'cadiz',
  // France (4)
  'annecy', 'avignon', 'carcassonne', 'dordogne',
  // Italy (5)
  'lucca', 'siena', 'orvieto', 'matera', 'ravenna',
  // Germany (5)
  'rothenburg', 'bamberg', 'lubeck', 'potsdam', 'trier',
  // Czech Republic (3)
  'cesky-krumlov', 'brno', 'karlovy-vary',
  // Hungary (2), Austria (2)
  'eger', 'pecs', 'hallstatt', 'linz',
  // Scandinavia (6)
  'turku', 'stavanger', 'tampere', 'odense', 'visby', 'faroe-islands',
  // Eastern Europe / Balkans (14)
  'novi-sad', 'ohrid', 'berat', 'prizren', 'timisoara', 'sibiu', 'brasov',
  'varna', 'budva', 'skopje', 'piran', 'constanta', 'torun', 'zakopane',
  // Jordan (2), Uzbekistan (3), Caucasus (3)
  'petra', 'wadi-rum', 'samarkand', 'bukhara', 'khiva', 'yerevan', 'baku', 'batumi',
  // Morocco (2), Egypt (2)
  'tangier', 'rabat', 'cairo', 'alexandria',
  // Caribbean (7)
  'dominica', 'sint-maarten', 'tobago', 'tortola', 'saint-vincent', 'montego-bay', 'punta-cana',
  // Mexico (4)
  'queretaro', 'morelia', 'san-cristobal', 'mazatlan',
  // Central America (5)
  'granada-nicaragua', 'leon-nicaragua', 'el-tunco', 'semuc-champey', 'bocas-del-toro',
  // South America (10)
  'cali', 'sucre', 'asuncion', 'manaus', 'recife', 'fortaleza', 'huaraz', 'potosi', 'natal', 'trujillo',
  // Japan (6)
  'kamakura', 'nikko', 'takayama', 'naoshima', 'kobe', 'matsumoto',
  // South Korea (5)
  'gyeongju', 'jeonju', 'sokcho', 'daegu', 'incheon',
  // China (3)
  'kunming', 'chongqing', 'harbin',
  // Thailand (5)
  'pai', 'sukhothai', 'kanchanaburi', 'khao-lak', 'koh-lanta',
  // Vietnam (4)
  'dalat', 'phu-quoc', 'ninh-binh', 'mui-ne',
  // Cambodia (2), Laos (2), Myanmar (2)
  'phnom-penh', 'kampot', 'vientiane', 'vang-vieng', 'bagan', 'mandalay',
  // Indonesia (3), Malaysia (2), Philippines (2)
  'flores', 'bandung', 'surabaya', 'cameron-highlands', 'kota-kinabalu', 'bohol', 'coron',
  // India (5 + 15)
  'hampi', 'jodhpur', 'mysore', 'pondicherry', 'darjeeling',
  'leh-ladakh', 'jaisalmer', 'kolkata', 'hyderabad', 'shimla', 'manali', 'munnar',
  'alleppey', 'ranthambore', 'khajuraho', 'andaman-islands', 'aurangabad', 'pushkar',
  'bangalore', 'chennai',
  // Nepal (2), Taiwan (2), Sri Lanka (2)
  'chitwan', 'lumbini', 'tainan', 'jiufen', 'sigiriya', 'trincomalee',
  // Australia (3), New Zealand (2)
  'alice-springs', 'broome', 'margaret-river', 'abel-tasman', 'wanaka',
  // Africa (12)
  'mombasa', 'arusha', 'maputo', 'lamu', 'swakopmund', 'stellenbosch',
  'antananarivo', 'nosy-be', 'livingstone', 'maun', 'accra', 'diani-beach',
  // Pacific (2), Mongolia (1), Oman (1), Canada (1)
  'tonga', 'moorea', 'ulaanbaatar', 'nizwa', 'niagara-on-the-lake',
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
  blurHash: string | null;
  color: string;          // Dominant color hex from Unsplash
  altText: string | null;  // photo.alt_description
  width: number;
  height: number;
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
  /** Page offset for search queries (used by backfill to get fresh results) */
  pageOffset?: number;
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
