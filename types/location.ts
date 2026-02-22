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

// ── API request / response ───────────────────────────────────────────

export interface AnalyzeLocationRequest {
  url?: string; // social media URL (TikTok, Instagram, YouTube)
  imageBase64?: string; // base64-encoded image data
  imageMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface LocationAnalysisResponse {
  success: boolean;
  location: ResolvedLocation | null;
  matchedDestination: MatchedDestination | null; // match against our 494
  // Multi-location support: when content mentions several places
  locations?: Array<{
    location: ResolvedLocation;
    matchedDestination: MatchedDestination | null;
  }>;
  error?: string;
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
}
