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

/** Haversine distance in km between two lat/lng points */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  userLat: number | null;
  userLng: number | null;
  currentMonth: number;
}): AlternativeTile[] {
  const {
    matchedDestinationId,
    matchedVibes,
    matchedAverageCost,
    matchedRegion,
    matchedCountry,
    userAirportCode,
    userLat,
    userLng,
    currentMonth,
  } = params;

  // All candidates except the matched destination
  const candidates = DESTINATIONS.filter(d => d.id !== matchedDestinationId);
  const dateStr = currentMonthDateString();
  const selected: Set<string> = new Set();
  const tiles: AlternativeTile[] = [];

  // ── 1. Closer Alternative (haversine distance from user) ───────────
  if (userLat != null && userLng != null) {
    // Filter to destinations with at least 1 shared vibe
    const withVibes = candidates.filter(d =>
      vibeOverlap(d.vibes as string[], matchedVibes) >= 1 && !selected.has(d.id),
    );

    // Distance from matched destination to user
    const matchedDest = DESTINATIONS.find(d => d.id === matchedDestinationId);
    const matchedDistKm = matchedDest
      ? haversineKm(userLat, userLng, matchedDest.latitude, matchedDest.longitude)
      : Infinity;

    // Score by actual distance to user (closest first), must be closer than the match
    const scored = withVibes
      .map(d => ({
        dest: d,
        distKm: haversineKm(userLat, userLng, d.latitude, d.longitude),
        vibeRatio: vibeOverlapRatio(d.vibes as string[], matchedVibes),
      }))
      .filter(s => s.distKm < matchedDistKm); // must actually be closer

    // Sort by distance ascending, then vibe overlap descending as tiebreaker
    scored.sort((a, b) => a.distKm - b.distKm || b.vibeRatio - a.vibeRatio);

    const closer = scored[0];

    if (closer) {
      selected.add(closer.dest.id);
      const travelCat = userAirportCode
        ? getTravelTimeCategory(userAirportCode, closer.dest)
        : undefined;
      const closerDailyCost = closer.dest.dailyCosts
        ? closer.dest.dailyCosts.foodPerDay + closer.dest.dailyCosts.activitiesPerDay + closer.dest.dailyCosts.transportPerDay
        : undefined;
      tiles.push({
        role: 'closer',
        label: 'Closer to You',
        destination: toMatchedDestination(closer.dest),
        reasoning: buildCloserReasoning(closer.dest, matchedVibes, travelCat, closer.distKm),
        averageCost: closer.dest.averageCost,
        dailyCostPerPerson: closerDailyCost,
        travelTimeCategory: travelCat,
      });
    }
  }

  // ── 2. Budget-Friendly Alternative (same region preferred) ──────────
  {
    const matchedDest = DESTINATIONS.find(d => d.id === matchedDestinationId);
    const matchedDailyCost = matchedDest?.dailyCosts
      ? matchedDest.dailyCosts.foodPerDay + matchedDest.dailyCosts.activitiesPerDay + matchedDest.dailyCosts.transportPerDay
      : null;

    const getDailyCostTotal = (d: Destination): number | null =>
      d.dailyCosts
        ? d.dailyCosts.foodPerDay + d.dailyCosts.activitiesPerDay + d.dailyCosts.transportPerDay
        : null;

    const findBudgetInPool = (pool: Destination[], threshold: number, useDailyCost: boolean): Destination | null => {
      let filtered = pool.filter(d => {
        if (useDailyCost) {
          const dc = getDailyCostTotal(d);
          return dc != null && dc < threshold && vibeOverlap(d.vibes as string[], matchedVibes) >= 1 && !selected.has(d.id);
        }
        return d.averageCost < threshold && vibeOverlap(d.vibes as string[], matchedVibes) >= 1 && !selected.has(d.id);
      });
      filtered.sort((a, b) => {
        const vibeA = vibeOverlapRatio(a.vibes as string[], matchedVibes);
        const vibeB = vibeOverlapRatio(b.vibes as string[], matchedVibes);
        if (vibeB !== vibeA) return vibeB - vibeA;
        if (useDailyCost) return (getDailyCostTotal(a) ?? Infinity) - (getDailyCostTotal(b) ?? Infinity);
        return a.averageCost - b.averageCost;
      });
      return filtered[0] ?? null;
    };

    // Split candidates into same-region and global
    const sameRegion = candidates.filter(d => d.region === matchedRegion);
    const allCandidates = candidates;

    let budget: Destination | null = null;

    if (matchedDailyCost != null) {
      // Try same region first at 70%, then 85%
      budget = findBudgetInPool(sameRegion, matchedDailyCost * 0.7, true);
      if (!budget) budget = findBudgetInPool(sameRegion, matchedDailyCost * 0.85, true);
      // Fall back to global if nothing in same region
      if (!budget) budget = findBudgetInPool(allCandidates, matchedDailyCost * 0.7, true);
      if (!budget) budget = findBudgetInPool(allCandidates, matchedDailyCost * 0.85, true);
    } else {
      // No dailyCosts — use averageCost
      budget = findBudgetInPool(sameRegion, matchedAverageCost * 0.7, false);
      if (!budget) budget = findBudgetInPool(sameRegion, matchedAverageCost * 0.9, false);
      if (!budget) budget = findBudgetInPool(allCandidates, matchedAverageCost * 0.7, false);
      if (!budget) budget = findBudgetInPool(allCandidates, matchedAverageCost * 0.9, false);
    }

    if (budget) {
      selected.add(budget.id);
      const budgetDailyCost = getDailyCostTotal(budget);
      let reasoning: string;
      if (matchedDailyCost != null && budgetDailyCost != null && budgetDailyCost < matchedDailyCost) {
        const dailySavings = matchedDailyCost - budgetDailyCost;
        const savingsPercent = Math.round((dailySavings / matchedDailyCost) * 100);
        reasoning = buildBudgetReasoning(budget, matchedVibes, dailySavings, savingsPercent);
      } else {
        const savings = Math.round((1 - budget.averageCost / matchedAverageCost) * 100);
        reasoning = `${savings}% cheaper · ${describeSharedVibes(budget.vibes as string[], matchedVibes)}`;
      }
      tiles.push({
        role: 'budget',
        label: 'Budget-Friendly',
        destination: toMatchedDestination(budget),
        reasoning,
        averageCost: budget.averageCost,
        dailyCostPerPerson: budgetDailyCost ?? undefined,
        travelTimeCategory: userAirportCode
          ? getTravelTimeCategory(userAirportCode, budget)
          : undefined,
      });
    }
  }

  // ── 3. Similar Vibe — different region, high vibe overlap (inspiration) ──
  {
    const vibePool = candidates.filter(d =>
      d.region !== matchedRegion &&
      vibeOverlap(d.vibes as string[], matchedVibes) >= 2 &&
      !selected.has(d.id),
    );

    // Sort by vibe overlap desc, then seasonal fit
    const dateStr2 = currentMonthDateString();
    vibePool.sort((a, b) => {
      const vibeA = vibeOverlapRatio(a.vibes as string[], matchedVibes);
      const vibeB = vibeOverlapRatio(b.vibes as string[], matchedVibes);
      if (vibeB !== vibeA) return vibeB - vibeA;
      // Tiebreak: prefer destinations currently in season
      return scoreSeasonalFit(b, dateStr2) - scoreSeasonalFit(a, dateStr2);
    });

    const similarVibe = vibePool[0];
    if (similarVibe) {
      selected.add(similarVibe.id);
      const getDailyCostTotal = (d: Destination): number | null =>
        d.dailyCosts
          ? d.dailyCosts.foodPerDay + d.dailyCosts.activitiesPerDay + d.dailyCosts.transportPerDay
          : null;
      tiles.push({
        role: 'similar_vibe',
        label: 'Similar Vibe',
        destination: toMatchedDestination(similarVibe),
        reasoning: `${describeSharedVibes(similarVibe.vibes as string[], matchedVibes)} in ${similarVibe.region.replace('_', ' ')}`,
        averageCost: similarVibe.averageCost,
        dailyCostPerPerson: getDailyCostTotal(similarVibe) ?? undefined,
        travelTimeCategory: userAirportCode
          ? getTravelTimeCategory(userAirportCode, similarVibe)
          : undefined,
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

  // Pick top 3 with region diversity (no two from the same region)
  const tiles: AlternativeTile[] = [];
  const usedRegions = new Set<string>();

  for (const item of scored) {
    if (tiles.length >= 3) break;

    // Allow same region only for the 3rd tile if we're stuck
    if (usedRegions.has(item.dest.region) && tiles.length < 2) continue;

    usedRegions.add(item.dest.region);
    const trendDailyCost = item.dest.dailyCosts
      ? item.dest.dailyCosts.foodPerDay + item.dest.dailyCosts.activitiesPerDay + item.dest.dailyCosts.transportPerDay
      : undefined;
    tiles.push({
      role: tiles.length === 0 ? 'best_match' : 'similar_vibe',
      label: tiles.length === 0 ? 'Popular Pick' : 'Trending Now',
      destination: toMatchedDestination(item.dest),
      reasoning: buildTrendingReasoning(item.dest, currentMonth),
      averageCost: item.dest.averageCost,
      dailyCostPerPerson: trendDailyCost,
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
  distKm?: number,
): string {
  const vibeText = describeSharedVibes(dest.vibes as string[], targetVibes);
  // Show distance in human-friendly format
  let distText = '';
  if (distKm != null) {
    if (distKm < 500) distText = `Only ${Math.round(distKm)} km away`;
    else if (distKm < 2000) distText = `~${Math.round(distKm / 100) * 100} km away`;
    else distText = travelCat === 'short' ? 'Short flight away'
      : travelCat === 'medium' ? 'Medium-haul flight'
      : '';
  }
  return [vibeText, distText].filter(Boolean).join(' · ');
}

function buildBudgetReasoning(
  dest: Destination,
  targetVibes: string[],
  dailySavings: number,
  savingsPercent: number,
): string {
  const vibeText = describeSharedVibes(dest.vibes as string[], targetVibes);
  const dailyCost = dest.dailyCosts
    ? dest.dailyCosts.foodPerDay + dest.dailyCosts.activitiesPerDay + dest.dailyCosts.transportPerDay
    : null;
  // Show concrete dollar savings: "Save ~$40/day · Great for food & culture"
  if (dailySavings >= 10) {
    return `Save ~$${Math.round(dailySavings / 5) * 5}/day · ${vibeText}`;
  }
  return `${savingsPercent}% cheaper · ${vibeText}`;
}

function buildTrendingReasoning(dest: Destination, currentMonth: number): string {
  const inSeason = dest.bestMonths.includes(currentMonth);
  const vibeSnippet = (dest.vibes as string[]).slice(0, 2).join(' & ');
  if (inSeason) return `Perfect season for ${vibeSnippet}`;
  return `Known for ${vibeSnippet}`;
}
