/**
 * Confidence Scoring for Discover Feature
 *
 * Computes a 0-1 confidence score from multiple pipeline signals,
 * mapped to 3 user-facing tiers: confident / best guess / not sure.
 *
 * Signals:
 *   Claude confidence (0.30) — Claude's own high/low assessment
 *   Match type (0.30) — How the destination was matched (exact > substring > haversine > none)
 *   Source reliability (0.15) — metadata > vision > caption
 *   Geocoding success (0.15) — Did Mapbox confirm the coordinates?
 *   Consistency (0.10) — Does Claude's city/country match the geocoded result?
 */

import type { ConfidenceScore, ConfidenceTier, DestinationMatchType, ResolvedLocation } from '@/types/location';

// ── Signal weights ───────────────────────────────────────────────────

const WEIGHTS = {
  claudeConfidence: 0.30,
  matchType: 0.30,
  sourceReliability: 0.15,
  geocodingSuccess: 0.15,
  consistency: 0.10,
} as const;

// ── Tier thresholds ──────────────────────────────────────────────────

const TIER_HIGH = 0.70;
const TIER_MEDIUM = 0.40;

function getTier(value: number): ConfidenceTier {
  if (value >= TIER_HIGH) return 'high';
  if (value >= TIER_MEDIUM) return 'medium';
  return 'low';
}

function getLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case 'high': return "We're confident";
    case 'medium': return 'Our best guess';
    case 'low': return "We're not sure";
  }
}

// ── Signal value helpers ─────────────────────────────────────────────

function scoreClaudeConfidence(confidence: 'high' | 'low'): number {
  return confidence === 'high' ? 1.0 : 0.3;
}

function scoreMatchType(matchType: DestinationMatchType): number {
  switch (matchType) {
    case 'exact_city': return 1.0;
    case 'substring': return 0.75;
    case 'haversine': return 0.5;
    case 'none': return 0.1;
  }
}

function scoreSourceReliability(source: ResolvedLocation['source']): number {
  switch (source) {
    case 'metadata': return 0.9;  // Structured data (oEmbed title, OG tags)
    case 'vision': return 0.8;    // Sonnet vision is very capable
    case 'caption': return 0.7;   // Text extraction can be noisy
  }
}

function scoreConsistency(
  claudeCity: string | null,
  claudeCountry: string | null,
  geocodedDisplayName: string,
): number {
  const display = geocodedDisplayName.toLowerCase();

  // City name appears in the geocoded display name
  if (claudeCity && display.includes(claudeCity.toLowerCase())) {
    return 1.0;
  }

  // Country name appears in the geocoded display name
  if (claudeCountry && display.includes(claudeCountry.toLowerCase())) {
    return 0.6;
  }

  // Neither matches — could be a mismatch or different naming convention
  return 0.2;
}

// ── Main scoring function ────────────────────────────────────────────

export function computeConfidenceScore(params: {
  claudeConfidence: 'high' | 'low';
  matchType: DestinationMatchType;
  source: ResolvedLocation['source'];
  geocodingSuccess: boolean;
  claudeCity: string | null;
  claudeCountry: string | null;
  geocodedDisplayName: string;
}): ConfidenceScore {
  const {
    claudeConfidence,
    matchType,
    source,
    geocodingSuccess,
    claudeCity,
    claudeCountry,
    geocodedDisplayName,
  } = params;

  const value =
    scoreClaudeConfidence(claudeConfidence) * WEIGHTS.claudeConfidence +
    scoreMatchType(matchType) * WEIGHTS.matchType +
    scoreSourceReliability(source) * WEIGHTS.sourceReliability +
    (geocodingSuccess ? 1.0 : 0.0) * WEIGHTS.geocodingSuccess +
    scoreConsistency(claudeCity, claudeCountry, geocodedDisplayName) * WEIGHTS.consistency;

  // Clamp to 0-1
  const clamped = Math.min(1, Math.max(0, value));
  const tier = getTier(clamped);

  return {
    value: Math.round(clamped * 100) / 100, // 2 decimal places
    tier,
    label: getLabel(tier),
  };
}
