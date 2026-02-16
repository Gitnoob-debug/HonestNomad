/**
 * Revealed Preference Learning Engine
 *
 * Learns user preferences from swipe behavior and other signals.
 * Conservative approach: needs 10+ signals before influencing recommendations.
 * Includes time decay and discovery slots.
 *
 * Storage: Supabase (user_preferences.revealed_preferences JSONB column)
 */

import type { DestinationVibe, Destination, FlashTripPackage } from '@/types/flash';

// ============================================
// TYPES
// ============================================

export interface SwipeSignal {
  timestamp: number;
  direction: 'left' | 'right';
  destinationId: string; // city name as ID
  vibes: string[]; // Vibes from the destination
  region: string;
  tripCost?: number; // Total trip cost if available
  dwellTimeMs?: number; // How long they looked before swiping
  expandedCard?: boolean; // Did they tap to see details?
  tripLengthDays?: number; // Length of trip
}

export interface POISignal {
  timestamp: number;
  action: 'favorite' | 'unfavorite' | 'click' | 'expand';
  poiType: string; // restaurant, museum, beach, etc.
  poiCategory?: string; // More specific: italian_restaurant, art_museum, etc.
  destinationId: string;
}

export interface BookingSignal {
  timestamp: number;
  destinationId: string;
  vibes: DestinationVibe[];
  region: string;
  tripCost: number;
  tripLengthDays: number;
  completed: boolean; // Did they actually take the trip?
}

// NEW: Flight selection tracking
export interface FlightSelectionSignal {
  timestamp: number;
  destinationId: string;
  departureHour: number; // 0-23
  price: number;
  stops: number;
  duration: number; // minutes
  cabinClass: string;
  isRedEye: boolean;
}

// NEW: Hotel selection tracking
export interface HotelSelectionSignal {
  timestamp: number;
  destinationId: string;
  stars: number;
  pricePerNight: number;
  amenities: string[];
  distanceFromCenter?: number;
}

export interface RevealedPreferences {
  // Vibe scores: accumulated weighted signals per vibe
  vibeScores: Record<string, { positive: number; negative: number }>;

  // Region scores
  regionScores: Record<string, { positive: number; negative: number }>;

  // Cost preference (running average of liked trips)
  costPreference: {
    sum: number;
    count: number;
  };

  // POI type preferences
  poiScores: Record<string, number>;

  // Signal history (for debugging and decay calculations)
  recentSignals: SwipeSignal[];

  // Stats
  totalSwipes: number;
  totalRightSwipes: number;
  totalLeftSwipes: number;
  lastUpdated: number;

  // Version for migrations
  version: number;

  // ============================================
  // NEW: Enhanced tracking (v2)
  // ============================================

  // Trip length preference (running average of liked trips)
  tripLengthPreference?: {
    sum: number;
    count: number;
  };

  // Flight preferences learned from selections
  flightPreferences?: {
    avgDepartureHour: { sum: number; count: number };
    avgPrice: { sum: number; count: number };
    avgStops: { sum: number; count: number };
    redEyeCount: number;
    totalSelections: number;
  };

  // Hotel preferences learned from selections
  hotelPreferences?: {
    avgStars: { sum: number; count: number };
    avgPricePerNight: { sum: number; count: number };
    amenityScores: Record<string, number>; // Which amenities they pick
    totalSelections: number;
  };

  // POI category clicks (more granular than poiScores)
  poiCategoryClicks?: Record<string, number>;

  // Booking history for strongest signals
  bookingSignals?: BookingSignal[];

  // Total bookings for confidence calculation
  totalBookings?: number;
}

// ============================================
// CONSTANTS
// ============================================

const CURRENT_VERSION = 1;

// Minimum signals before preferences influence recommendations
const MIN_SIGNALS_THRESHOLD = 10;

// Signal weights
const WEIGHTS = {
  swipe_right: 1.0,
  swipe_right_expanded: 1.5,    // Looked at details before liking
  swipe_right_long_dwell: 1.3,  // Spent >5s before swiping right
  swipe_left: -0.5,             // Negative signal, but weaker
  swipe_left_quick: -0.3,       // Quick dismiss = less negative
  poi_favorite: 0.3,
  poi_click: 0.1,               // Clicked to view POI details
  poi_expand: 0.15,             // Expanded POI for more info
  trip_booked: 3.0,
  trip_completed: 5.0,
  flight_selected: 0.5,         // Selected a specific flight
  hotel_selected: 0.5,          // Selected a specific hotel
};

// Time decay: signals lose 50% weight after this many days
const HALF_LIFE_DAYS = 90;

// Discovery ratio: this % of recommendations should be exploratory
const DISCOVERY_RATIO = 0.25; // 25% discovery, 75% preference-matched

// All vibes for initialization
const ALL_VIBES: DestinationVibe[] = [
  'beach', 'adventure', 'culture', 'romance', 'nightlife',
  'nature', 'city', 'history', 'food', 'relaxation', 'family', 'luxury'
];

// All regions
const ALL_REGIONS = ['europe', 'asia', 'americas', 'caribbean', 'africa', 'oceania', 'middle_east'];

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Create empty preferences object
 */
export function createEmptyPreferences(): RevealedPreferences {
  const vibeScores: Record<string, { positive: number; negative: number }> = {};
  ALL_VIBES.forEach(vibe => {
    vibeScores[vibe] = { positive: 0, negative: 0 };
  });

  const regionScores: Record<string, { positive: number; negative: number }> = {};
  ALL_REGIONS.forEach(region => {
    regionScores[region] = { positive: 0, negative: 0 };
  });

  return {
    vibeScores: vibeScores as Record<DestinationVibe, { positive: number; negative: number }>,
    regionScores,
    costPreference: { sum: 0, count: 0 },
    poiScores: {},
    recentSignals: [],
    totalSwipes: 0,
    totalRightSwipes: 0,
    totalLeftSwipes: 0,
    lastUpdated: Date.now(),
    version: CURRENT_VERSION,
  };
}

/**
 * Calculate time decay factor for a signal
 */
function getDecayFactor(signalTimestamp: number): number {
  const ageMs = Date.now() - signalTimestamp;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  // Exponential decay: factor = 0.5^(age/half_life)
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

/**
 * Record a swipe signal
 */
export function recordSwipe(
  prefs: RevealedPreferences,
  trip: FlashTripPackage,
  direction: 'left' | 'right',
  dwellTimeMs?: number,
  expandedCard?: boolean
): RevealedPreferences {
  const destinationId = trip.destination.id;

  const signal: SwipeSignal = {
    timestamp: Date.now(),
    direction,
    destinationId,
    vibes: trip.destination.vibes,
    region: trip.destination.region,
    tripCost: trip.pricing?.total, // Use trip pricing if available
    dwellTimeMs,
    expandedCard,
  };

  // Calculate weight for this signal
  let weight: number;
  if (direction === 'right') {
    if (expandedCard) {
      weight = WEIGHTS.swipe_right_expanded;
    } else if (dwellTimeMs && dwellTimeMs > 5000) {
      weight = WEIGHTS.swipe_right_long_dwell;
    } else {
      weight = WEIGHTS.swipe_right;
    }
  } else {
    if (dwellTimeMs && dwellTimeMs < 1500) {
      weight = WEIGHTS.swipe_left_quick;
    } else {
      weight = WEIGHTS.swipe_left;
    }
  }

  // Update vibe scores
  const newVibeScores: Record<string, { positive: number; negative: number }> = { ...prefs.vibeScores };
  for (const vibe of trip.destination.vibes) {
    if (!newVibeScores[vibe]) {
      newVibeScores[vibe] = { positive: 0, negative: 0 };
    }
    if (weight > 0) {
      newVibeScores[vibe] = {
        ...newVibeScores[vibe],
        positive: newVibeScores[vibe].positive + weight,
      };
    } else {
      newVibeScores[vibe] = {
        ...newVibeScores[vibe],
        negative: newVibeScores[vibe].negative + Math.abs(weight),
      };
    }
  }

  // Update region scores
  const newRegionScores = { ...prefs.regionScores };
  const region = trip.destination.region;
  if (!newRegionScores[region]) {
    newRegionScores[region] = { positive: 0, negative: 0 };
  }
  if (weight > 0) {
    newRegionScores[region] = {
      ...newRegionScores[region],
      positive: newRegionScores[region].positive + weight,
    };
  } else {
    newRegionScores[region] = {
      ...newRegionScores[region],
      negative: newRegionScores[region].negative + Math.abs(weight),
    };
  }

  // Update cost preference (only for right swipes)
  let newCostPref = { ...prefs.costPreference };
  if (direction === 'right' && trip.pricing?.total) {
    newCostPref = {
      sum: prefs.costPreference.sum + trip.pricing.total,
      count: prefs.costPreference.count + 1,
    };
  }

  // Keep last 100 signals for history
  const newRecentSignals = [signal, ...prefs.recentSignals].slice(0, 100);

  return {
    ...prefs,
    vibeScores: newVibeScores,
    regionScores: newRegionScores,
    costPreference: newCostPref,
    recentSignals: newRecentSignals,
    totalSwipes: prefs.totalSwipes + 1,
    totalRightSwipes: direction === 'right' ? prefs.totalRightSwipes + 1 : prefs.totalRightSwipes,
    totalLeftSwipes: direction === 'left' ? prefs.totalLeftSwipes + 1 : prefs.totalLeftSwipes,
    lastUpdated: Date.now(),
  };
}

/**
 * Record a POI action (favorite, unfavorite, click, expand)
 */
export function recordPOIAction(
  prefs: RevealedPreferences,
  poiType: string,
  action: 'favorite' | 'unfavorite' | 'click' | 'expand',
  poiCategory?: string
): RevealedPreferences {
  let weight: number;
  switch (action) {
    case 'favorite':
      weight = WEIGHTS.poi_favorite;
      break;
    case 'unfavorite':
      weight = -WEIGHTS.poi_favorite;
      break;
    case 'click':
      weight = WEIGHTS.poi_click;
      break;
    case 'expand':
      weight = WEIGHTS.poi_expand;
      break;
  }

  const newPoiScores = { ...prefs.poiScores };
  newPoiScores[poiType] = (newPoiScores[poiType] || 0) + weight;

  // Track more granular category if provided
  let newCategoryClicks = { ...(prefs.poiCategoryClicks || {}) };
  if (poiCategory && (action === 'click' || action === 'expand')) {
    newCategoryClicks[poiCategory] = (newCategoryClicks[poiCategory] || 0) + 1;
  }

  return {
    ...prefs,
    poiScores: newPoiScores,
    poiCategoryClicks: newCategoryClicks,
    lastUpdated: Date.now(),
  };
}

/**
 * Record a flight selection
 */
export function recordFlightSelection(
  prefs: RevealedPreferences,
  selection: {
    destinationId: string;
    departureHour: number;
    price: number;
    stops: number;
    duration: number;
    cabinClass: string;
    isRedEye: boolean;
  }
): RevealedPreferences {
  const current = prefs.flightPreferences || {
    avgDepartureHour: { sum: 0, count: 0 },
    avgPrice: { sum: 0, count: 0 },
    avgStops: { sum: 0, count: 0 },
    redEyeCount: 0,
    totalSelections: 0,
  };

  return {
    ...prefs,
    flightPreferences: {
      avgDepartureHour: {
        sum: current.avgDepartureHour.sum + selection.departureHour,
        count: current.avgDepartureHour.count + 1,
      },
      avgPrice: {
        sum: current.avgPrice.sum + selection.price,
        count: current.avgPrice.count + 1,
      },
      avgStops: {
        sum: current.avgStops.sum + selection.stops,
        count: current.avgStops.count + 1,
      },
      redEyeCount: current.redEyeCount + (selection.isRedEye ? 1 : 0),
      totalSelections: current.totalSelections + 1,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Record a hotel selection
 */
export function recordHotelSelection(
  prefs: RevealedPreferences,
  selection: {
    destinationId: string;
    stars: number;
    pricePerNight: number;
    amenities: string[];
  }
): RevealedPreferences {
  const current = prefs.hotelPreferences || {
    avgStars: { sum: 0, count: 0 },
    avgPricePerNight: { sum: 0, count: 0 },
    amenityScores: {},
    totalSelections: 0,
  };

  // Update amenity scores
  const newAmenityScores = { ...current.amenityScores };
  for (const amenity of selection.amenities) {
    newAmenityScores[amenity] = (newAmenityScores[amenity] || 0) + 1;
  }

  return {
    ...prefs,
    hotelPreferences: {
      avgStars: {
        sum: current.avgStars.sum + selection.stars,
        count: current.avgStars.count + 1,
      },
      avgPricePerNight: {
        sum: current.avgPricePerNight.sum + selection.pricePerNight,
        count: current.avgPricePerNight.count + 1,
      },
      amenityScores: newAmenityScores,
      totalSelections: current.totalSelections + 1,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Record a booking (strongest signal)
 */
export function recordBooking(
  prefs: RevealedPreferences,
  booking: {
    destinationId: string;
    vibes: DestinationVibe[];
    region: string;
    tripCost: number;
    tripLengthDays: number;
  }
): RevealedPreferences {
  const signal: BookingSignal = {
    timestamp: Date.now(),
    destinationId: booking.destinationId,
    vibes: booking.vibes,
    region: booking.region,
    tripCost: booking.tripCost,
    tripLengthDays: booking.tripLengthDays,
    completed: false, // Will be updated later if they complete the trip
  };

  // Boost vibe and region scores significantly for bookings
  const boostedVibeScores = { ...prefs.vibeScores };
  for (const vibe of booking.vibes) {
    if (!boostedVibeScores[vibe]) {
      boostedVibeScores[vibe] = { positive: 0, negative: 0 };
    }
    boostedVibeScores[vibe] = {
      ...boostedVibeScores[vibe],
      positive: boostedVibeScores[vibe].positive + WEIGHTS.trip_booked,
    };
  }

  const boostedRegionScores = { ...prefs.regionScores };
  if (!boostedRegionScores[booking.region]) {
    boostedRegionScores[booking.region] = { positive: 0, negative: 0 };
  }
  boostedRegionScores[booking.region] = {
    ...boostedRegionScores[booking.region],
    positive: boostedRegionScores[booking.region].positive + WEIGHTS.trip_booked,
  };

  // Update trip length preference
  const currentTripLength = prefs.tripLengthPreference || { sum: 0, count: 0 };

  return {
    ...prefs,
    vibeScores: boostedVibeScores,
    regionScores: boostedRegionScores,
    bookingSignals: [...(prefs.bookingSignals || []), signal].slice(-20), // Keep last 20
    totalBookings: (prefs.totalBookings || 0) + 1,
    tripLengthPreference: {
      sum: currentTripLength.sum + booking.tripLengthDays,
      count: currentTripLength.count + 1,
    },
    costPreference: {
      sum: prefs.costPreference.sum + booking.tripCost,
      count: prefs.costPreference.count + 1,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Calculate preference score for a vibe (with decay)
 */
export function getVibeScore(prefs: RevealedPreferences, vibe: string): number {
  const scores = prefs.vibeScores[vibe];
  if (!scores) return 0;

  // Apply decay to recent signals for this vibe
  let decayedPositive = 0;
  let decayedNegative = 0;

  for (const signal of prefs.recentSignals) {
    if (!signal.vibes.includes(vibe)) continue;

    const decay = getDecayFactor(signal.timestamp);
    const weight = signal.direction === 'right' ? WEIGHTS.swipe_right : WEIGHTS.swipe_left;

    if (weight > 0) {
      decayedPositive += weight * decay;
    } else {
      decayedNegative += Math.abs(weight) * decay;
    }
  }

  // Net score: positive - negative
  return decayedPositive - decayedNegative;
}

/**
 * Get all vibe scores sorted by preference
 */
export function getRankedVibes(prefs: RevealedPreferences): Array<{ vibe: string; score: number }> {
  return ALL_VIBES
    .map(vibe => ({ vibe, score: getVibeScore(prefs, vibe) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Check if we have enough signals to influence recommendations
 */
export function hasEnoughSignals(prefs: RevealedPreferences): boolean {
  return prefs.totalSwipes >= MIN_SIGNALS_THRESHOLD;
}

/**
 * Calculate preference score for a destination
 * Returns a score between 0 and 1
 */
export function scoreDestination(prefs: RevealedPreferences, destination: Destination): number {
  if (!hasEnoughSignals(prefs)) {
    return 0.5; // Neutral score when not enough data
  }

  let totalScore = 0;
  let maxPossibleScore = 0;

  // Score based on vibes (weighted by how many vibes match)
  const rankedVibes = getRankedVibes(prefs);
  const maxVibeScore = Math.max(...rankedVibes.map(v => v.score), 0.001);

  for (const vibe of destination.vibes) {
    const vibeData = rankedVibes.find(v => v.vibe === vibe);
    if (vibeData && vibeData.score > 0) {
      totalScore += vibeData.score / maxVibeScore;
    }
    maxPossibleScore += 1;
  }

  // Normalize
  if (maxPossibleScore === 0) return 0.5;
  return Math.min(1, Math.max(0, totalScore / maxPossibleScore));
}

/**
 * Sort destinations by preference score, with discovery slots
 */
export function rankDestinations(
  prefs: RevealedPreferences,
  destinations: Destination[],
  count: number = 8
): Destination[] {
  if (!hasEnoughSignals(prefs)) {
    // Not enough data - return diverse mix
    return shuffleArray(destinations).slice(0, count);
  }

  // Score all destinations
  const scored = destinations.map(d => ({
    destination: d,
    score: scoreDestination(prefs, d),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Split into preference-matched and discovery
  const discoveryCount = Math.ceil(count * DISCOVERY_RATIO);
  const preferenceCount = count - discoveryCount;

  // Top destinations by preference
  const topPicks = scored.slice(0, preferenceCount).map(s => s.destination);

  // Discovery: pick from lower-scored destinations randomly
  // This helps us learn about preferences we haven't explored
  const remainingPool = scored.slice(preferenceCount * 2); // Skip the "medium" zone
  const discoveryPicks = shuffleArray(remainingPool)
    .slice(0, discoveryCount)
    .map(s => s.destination);

  // Interleave: put discovery picks at positions 3, 6, etc.
  const result: Destination[] = [];
  let topIdx = 0;
  let discoveryIdx = 0;

  for (let i = 0; i < count; i++) {
    // Every 3rd slot (starting at index 2) is a discovery slot
    if ((i + 1) % 3 === 0 && discoveryIdx < discoveryPicks.length) {
      result.push(discoveryPicks[discoveryIdx]);
      discoveryIdx++;
    } else if (topIdx < topPicks.length) {
      result.push(topPicks[topIdx]);
      topIdx++;
    } else if (discoveryIdx < discoveryPicks.length) {
      result.push(discoveryPicks[discoveryIdx]);
      discoveryIdx++;
    }
  }

  return result;
}

/**
 * Get a human-readable summary of preferences
 */
export function getPreferenceSummary(prefs: RevealedPreferences): {
  topVibes: string[];
  avoidVibes: string[];
  avgCost: number | null;
  avgTripLength: number | null;
  confidence: 'low' | 'medium' | 'high';
  // New: learned flight preferences
  flightPrefs: {
    avgDepartureHour: number | null;
    avgPrice: number | null;
    prefersRedEye: boolean;
    avgStops: number | null;
  } | null;
  // New: learned hotel preferences
  hotelPrefs: {
    avgStars: number | null;
    avgPricePerNight: number | null;
    topAmenities: string[];
  } | null;
  // New: top POI categories
  topPOICategories: string[];
} {
  const ranked = getRankedVibes(prefs);
  const positiveVibes = ranked.filter(v => v.score > 0);
  const negativeVibes = ranked.filter(v => v.score < -0.5);

  const avgCost = prefs.costPreference.count > 0
    ? Math.round(prefs.costPreference.sum / prefs.costPreference.count)
    : null;

  const avgTripLength = prefs.tripLengthPreference?.count && prefs.tripLengthPreference.count > 0
    ? Math.round(prefs.tripLengthPreference.sum / prefs.tripLengthPreference.count)
    : null;

  let confidence: 'low' | 'medium' | 'high';
  if (prefs.totalSwipes < 10) confidence = 'low';
  else if (prefs.totalSwipes < 30) confidence = 'medium';
  else confidence = 'high';

  // Flight preferences
  let flightPrefs = null;
  if (prefs.flightPreferences && prefs.flightPreferences.totalSelections >= 2) {
    const fp = prefs.flightPreferences;
    flightPrefs = {
      avgDepartureHour: fp.avgDepartureHour.count > 0
        ? Math.round(fp.avgDepartureHour.sum / fp.avgDepartureHour.count)
        : null,
      avgPrice: fp.avgPrice.count > 0
        ? Math.round(fp.avgPrice.sum / fp.avgPrice.count)
        : null,
      prefersRedEye: fp.totalSelections > 0 && (fp.redEyeCount / fp.totalSelections) > 0.3,
      avgStops: fp.avgStops.count > 0
        ? Math.round((fp.avgStops.sum / fp.avgStops.count) * 10) / 10
        : null,
    };
  }

  // Hotel preferences
  let hotelPrefs = null;
  if (prefs.hotelPreferences && prefs.hotelPreferences.totalSelections >= 2) {
    const hp = prefs.hotelPreferences;
    const topAmenities = Object.entries(hp.amenityScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([amenity]) => amenity);

    hotelPrefs = {
      avgStars: hp.avgStars.count > 0
        ? Math.round((hp.avgStars.sum / hp.avgStars.count) * 10) / 10
        : null,
      avgPricePerNight: hp.avgPricePerNight.count > 0
        ? Math.round(hp.avgPricePerNight.sum / hp.avgPricePerNight.count)
        : null,
      topAmenities,
    };
  }

  // Top POI categories
  const topPOICategories = Object.entries(prefs.poiCategoryClicks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);

  return {
    topVibes: positiveVibes.slice(0, 3).map(v => v.vibe),
    avoidVibes: negativeVibes.slice(0, 2).map(v => v.vibe),
    avgCost,
    avgTripLength,
    confidence,
    flightPrefs,
    hotelPrefs,
    topPOICategories,
  };
}

// ============================================
// UTILITIES
// ============================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
