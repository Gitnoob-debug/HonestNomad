/**
 * Alternative Destination Finder for Discover Feature
 *
 * When the Discover pipeline identifies a destination, this module finds 3 alternatives:
 *   1. Closer Alternative — same vibes, nearer to the user
 *   2. Budget-Friendly — same vibes, significantly cheaper
 *   3. Similar Vibe — different region, high vibe overlap
 *
 * When no destination is matched, provides 4 trending/popular fallback tiles
 * scored by seasonal fit, popularity proxy, and reachability.
 *
 * All algorithms are O(N) single-pass over DESTINATIONS — efficient at 500-800 destinations.
 */

import { DESTINATIONS } from '@/lib/flash/destinations';
import type { Destination, DestinationVibe } from '@/types/flash';
import type { AlternativeTile, MatchedDestination } from '@/types/location';
import { scoreSeasonalFit, scoreReachability } from '@/lib/flash/diversityEngine';
import { estimateTravelTime } from '@/lib/flash/travelTimeMatrix';

// ── Helpers ──────────────────────────────────────────────────────────

/** Count overlapping vibes between two destinations */
function vibeOverlap(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter(v => setB.has(v)).length;
}

/** Vibe overlap as a ratio (0-1) */
function vibeOverlapRatio(destVibes: string[], targetVibes: string[]): number {
  if (targetVibes.length === 0) return 0;
  return vibeOverlap(destVibes, targetVibes) / targetVibes.length;
}

/** Get travel time category for display */
function getTravelTimeCategory(
  userAirport: string,
  destination: Destination,
): string | undefined {
  const estimate = estimateTravelTime(userAirport, destination);
  if (!estimate) return undefined;
  const hours = estimate.totalHours;
  if (hours <= 4) return 'short';
  if (hours <= 9) return 'medium';
  if (hours <= 15) return 'long';
  return 'ultra_long';
}

/** Convert a Destination to a MatchedDestination for tile display */
function toMatchedDestination(dest: Destination): MatchedDestination {
  return {
    id: dest.id,
    city: dest.city,
    country: dest.country,
    latitude: dest.latitude,
    longitude: dest.longitude,
    highlights: dest.highlights,
    imageUrl: dest.imageUrl,
    vibes: dest.vibes as string[],
    averageCost: dest.averageCost,
    region: dest.region,
  };
}

/** Build a date string for the current month (for seasonal scoring) */
function currentMonthDateString(): string {
  const now = new Date();
  // scoreSeasonalFit expects a date string, it extracts month from it
  return now.toISOString().slice(0, 10);
}

// ── Find Alternatives (when we have a match) ─────────────────────────

export function findAlternatives(params: {
  matchedDestinationId: string;
  matchedVibes: string[];
  matchedAverageCost: number;
  matchedRegion: string;
  matchedCountry: string;
  userAirportCode: string | null;
  currentMonth: number;
}): AlternativeTile[] {
  const {
    matchedDestinationId,
    matchedVibes,
    matchedAverageCost,
    matchedRegion,
    matchedCountry,
    userAirportCode,
    currentMonth,
  } = params;

  // All candidates except the matched destination
  const candidates = DESTINATIONS.filter(d => d.id !== matchedDestinationId);
  const dateStr = currentMonthDateString();
  const selected: Set<string> = new Set();
  const tiles: AlternativeTile[] = [];

  // ── 1. Closer Alternative ──────────────────────────────────────────
  if (userAirportCode) {
    // Filter to destinations with at least 1 shared vibe
    const withVibes = candidates.filter(d =>
      vibeOverlap(d.vibes as string[], matchedVibes) >= 1 && !selected.has(d.id),
    );

    // Score by reachability (closest first)
    const scored = withVibes.map(d => ({
      dest: d,
      reachability: scoreReachability(d, userAirportCode),
      vibeRatio: vibeOverlapRatio(d.vibes as string[], matchedVibes),
    }));

    // Sort by reachability desc, then vibe overlap desc
    scored.sort((a, b) => b.reachability - a.reachability || b.vibeRatio - a.vibeRatio);

    // Prefer a different country for diversity
    const closer = scored.find(s => s.dest.country !== matchedCountry) || scored[0];

    if (closer) {
      selected.add(closer.dest.id);
      const travelCat = getTravelTimeCategory(userAirportCode, closer.dest);
      tiles.push({
        role: 'closer',
        label: 'Closer to You',
        destination: toMatchedDestination(closer.dest),
        reasoning: buildCloserReasoning(closer.dest, matchedVibes, travelCat),
        averageCost: closer.dest.averageCost,
        travelTimeCategory: travelCat,
      });
    }
  }

  // ── 2. Budget-Friendly Alternative ─────────────────────────────────
  {
    let budgetThreshold = matchedAverageCost * 0.7;

    // Find destinations with shared vibes AND cheaper
    let budgetPool = candidates.filter(d =>
      vibeOverlap(d.vibes as string[], matchedVibes) >= 1 &&
      d.averageCost < budgetThreshold &&
      !selected.has(d.id),
    );

    // If nothing found, relax the threshold
    if (budgetPool.length === 0) {
      budgetThreshold = matchedAverageCost * 0.9;
      budgetPool = candidates.filter(d =>
        vibeOverlap(d.vibes as string[], matchedVibes) >= 1 &&
        d.averageCost < budgetThreshold &&
        !selected.has(d.id),
      );
    }

    // Sort by vibe overlap desc, then cost asc
    budgetPool.sort((a, b) => {
      const vibeA = vibeOverlapRatio(a.vibes as string[], matchedVibes);
      const vibeB = vibeOverlapRatio(b.vibes as string[], matchedVibes);
      if (vibeB !== vibeA) return vibeB - vibeA;
      return a.averageCost - b.averageCost;
    });

    const budget = budgetPool[0];
    if (budget) {
      selected.add(budget.id);
      const savings = Math.round((1 - budget.averageCost / matchedAverageCost) * 100);
      tiles.push({
        role: 'budget',
        label: 'Budget-Friendly',
        destination: toMatchedDestination(budget),
        reasoning: `${savings}% cheaper with ${describeSharedVibes(budget.vibes as string[], matchedVibes)}`,
        averageCost: budget.averageCost,
        travelTimeCategory: userAirportCode
          ? getTravelTimeCategory(userAirportCode, budget)
          : undefined,
      });
    }
  }

  // ── 3. Similar Vibe (different region) ─────────────────────────────
  {
    const vibePool = candidates.filter(d =>
      d.region !== matchedRegion && !selected.has(d.id),
    );

    // Sort by vibe overlap desc
    vibePool.sort((a, b) => {
      const vibeA = vibeOverlapRatio(a.vibes as string[], matchedVibes);
      const vibeB = vibeOverlapRatio(b.vibes as string[], matchedVibes);
      return vibeB - vibeA;
    });

    const similar = vibePool[0];
    if (similar) {
      selected.add(similar.id);
      tiles.push({
        role: 'similar_vibe',
        label: 'Similar Vibe',
        destination: toMatchedDestination(similar),
        reasoning: describeSharedVibes(similar.vibes as string[], matchedVibes),
        averageCost: similar.averageCost,
        travelTimeCategory: userAirportCode
          ? getTravelTimeCategory(userAirportCode, similar)
          : undefined,
      });
    }
  }

  // ── Fallback: if "Closer" wasn't possible (no user airport), add a second Similar Vibe
  if (!userAirportCode && tiles.length < 3) {
    const extraPool = candidates.filter(d =>
      d.region === matchedRegion && // same region this time (different from tile 3)
      !selected.has(d.id),
    );

    extraPool.sort((a, b) => {
      const vibeA = vibeOverlapRatio(a.vibes as string[], matchedVibes);
      const vibeB = vibeOverlapRatio(b.vibes as string[], matchedVibes);
      return vibeB - vibeA;
    });

    const extra = extraPool[0];
    if (extra) {
      selected.add(extra.id);
      tiles.push({
        role: 'similar_vibe',
        label: 'Similar Vibe',
        destination: toMatchedDestination(extra),
        reasoning: describeSharedVibes(extra.vibes as string[], matchedVibes),
        averageCost: extra.averageCost,
      });
    }
  }

  return tiles;
}

// ── Trending Fallback (when no match) ────────────────────────────────

export function getTrendingFallback(params: {
  userAirportCode: string | null;
  currentMonth: number;
}): AlternativeTile[] {
  const { userAirportCode, currentMonth } = params;
  const dateStr = currentMonthDateString();

  // Score all destinations
  const scored = DESTINATIONS.map(dest => {
    const seasonal = scoreSeasonalFit(dest, dateStr);
    const popularity = Math.min(dest.highlights.length / 5, 1.0);
    const reachability = userAirportCode
      ? scoreReachability(dest, userAirportCode)
      : 0.5; // neutral if no location

    const total = seasonal * 0.4 + popularity * 0.3 + reachability * 0.3;

    return { dest, total };
  });

  // Sort by score descending
  scored.sort((a, b) => b.total - a.total);

  // Pick top 4 with region diversity (no two from the same region)
  const tiles: AlternativeTile[] = [];
  const usedRegions = new Set<string>();

  for (const item of scored) {
    if (tiles.length >= 4) break;

    // Allow same region only for the 4th tile if we're stuck
    if (usedRegions.has(item.dest.region) && tiles.length < 3) continue;

    usedRegions.add(item.dest.region);
    tiles.push({
      role: tiles.length === 0 ? 'best_match' : 'similar_vibe',
      label: tiles.length === 0 ? 'Popular Pick' : 'Trending Now',
      destination: toMatchedDestination(item.dest),
      reasoning: buildTrendingReasoning(item.dest, currentMonth),
      averageCost: item.dest.averageCost,
      travelTimeCategory: userAirportCode
        ? getTravelTimeCategory(userAirportCode, item.dest)
        : undefined,
    });
  }

  return tiles;
}

// ── Reasoning text builders ──────────────────────────────────────────

function describeSharedVibes(destVibes: string[], targetVibes: string[]): string {
  const shared = destVibes.filter(v => targetVibes.includes(v));
  if (shared.length === 0) return 'A fresh alternative';
  if (shared.length === 1) return `Great for ${shared[0]}`;
  return `Great for ${shared.slice(0, 2).join(' & ')}`;
}

function buildCloserReasoning(
  dest: Destination,
  targetVibes: string[],
  travelCat: string | undefined,
): string {
  const vibeText = describeSharedVibes(dest.vibes as string[], targetVibes);
  const timeText = travelCat === 'short' ? 'Short flight away'
    : travelCat === 'medium' ? 'Medium-haul flight'
    : '';
  return [vibeText, timeText].filter(Boolean).join(' · ');
}

function buildTrendingReasoning(dest: Destination, currentMonth: number): string {
  const inSeason = dest.bestMonths.includes(currentMonth);
  const vibeSnippet = (dest.vibes as string[]).slice(0, 2).join(' & ');
  if (inSeason) return `Perfect season for ${vibeSnippet}`;
  return `Known for ${vibeSnippet}`;
}
