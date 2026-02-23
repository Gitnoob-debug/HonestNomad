/**
 * Social Location Resolver Types
 *
 * Types for the Discover feature: resolve locations from social media URLs
 * and uploaded screenshots using Claude Vision + Mapbox geocoding.
 */

// ── Claude's raw response ────────────────────────────────────────────

export interface ClaudeLocationResult {
  city: string | null;
  country: string | null;
  region: string | null;
  locationString: string | null; // best geocodable search string
  confidence: 'high' | 'low'; // simplified: found it or didn't
  reasoning: string; // one sentence explaining the identification
}

// Multi-location: Claude returns an array when content mentions several places
export interface ClaudeMultiLocationResult {
  locations: ClaudeLocationResult[];
}

// ── Confidence scoring ───────────────────────────────────────────────

export type ConfidenceTier = 'high' | 'medium' | 'low';

/** How the destination was matched against our database */
export type DestinationMatchType = 'exact_city' | 'substring' | 'haversine' | 'none';

export interface ConfidenceScore {
  value: number;            // 0-1 numeric score
  tier: ConfidenceTier;     // derived from value thresholds
  label: string;            // "We're confident" | "Our best guess" | "We're not sure"
}

// ── Alternative destination tiles ────────────────────────────────────

export type AlternativeTileRole = 'best_match' | 'closer' | 'budget' | 'similar_vibe';

export interface AlternativeTile {
  role: AlternativeTileRole;
  label: string;             // "Best Match" | "Closer to You" | "Budget-Friendly" | "Similar Vibe"
  destination: MatchedDestination;
  reasoning: string;         // "Same beach vibes, 3h closer"
  averageCost?: number;      // for budget comparison display
  travelTimeCategory?: string; // "short" | "medium" | "long" | "ultra_long"
}

// ── API request / response ───────────────────────────────────────────

export interface AnalyzeLocationRequest {
  url?: string; // social media URL (TikTok, Instagram, YouTube)
  imageBase64?: string; // base64-encoded image data
  imageMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  clientIp?: string; // injected by API route for IP geolocation
}

export interface LocationAnalysisResponse {
  success: boolean;
  location: ResolvedLocation | null;
  matchedDestination: MatchedDestination | null;
  confidenceScore?: ConfidenceScore;
  alternatives?: AlternativeTile[];       // 3 alt tiles (when match found)
  trendingFallback?: AlternativeTile[];   // 4 trending tiles (when no match)
  // Multi-location support: when content mentions several places
  locations?: Array<{
    location: ResolvedLocation;
    matchedDestination: MatchedDestination | null;
    confidenceScore?: ConfidenceScore;
  }>;
  error?: string;
  _debug?: string[]; // pipeline trace (temporary)
}

// ── Resolved location (after geocoding) ──────────────────────────────

export interface ResolvedLocation {
  city: string | null;
  country: string | null;
  locationString: string;
  lat: number;
  lng: number;
  displayName: string; // human-readable from Mapbox geocoder
  confidence: 'high' | 'low';
  confidenceScore?: ConfidenceScore; // rich confidence data
  reasoning: string;
  source: 'metadata' | 'caption' | 'vision';
}

// ── Matched destination from our database ────────────────────────────

export interface MatchedDestination {
  id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  highlights: string[];
  imageUrl: string;
  vibes?: string[];       // needed for similarity matching in alternatives
  averageCost?: number;   // needed for budget tile display
  region?: string;        // needed for diversity in alternatives
}
