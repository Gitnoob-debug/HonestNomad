import type { FlashVacationPreferences, Destination, DestinationVibe } from '@/types/flash';
import { DESTINATIONS, getDestinationsForMonth } from './destinations';
import type { RevealedPreferences } from './preferenceEngine';
import { scoreDestination, hasEnoughSignals } from './preferenceEngine';
import { estimateTravelTime } from './travelTimeMatrix';

interface ScoredDestination {
  destination: Destination;
  scores: {
    seasonalFit: number;      // 0-1: How appropriate for travel dates
    vibeMatch: number;        // 0-1: How well it matches requested vibes
    budgetFit: number;        // 0-1: How well it fits budget
    reachability: number;     // 0-1: How practical to get to from user's location
    revealedPref: number;     // 0-1: How well it matches revealed preferences
    total: number;            // Weighted sum
  };
}

interface SelectionParams {
  profile: FlashVacationPreferences;
  departureDate: string;
  returnDate: string;
  vibes?: string[];
  region?: string;
  count: number;
  originAirport: string;
  revealedPreferences?: RevealedPreferences; // User's learned preferences from swipe behavior
  excludeDestinations?: string[]; // Cities to exclude (for lazy loading)
}

/**
 * Score how appropriate the destination is for the travel dates
 */
export function scoreSeasonalFit(destination: Destination, departureDate: string): number {
  const month = new Date(departureDate).getMonth() + 1; // 1-12

  if (destination.bestMonths.includes(month)) {
    return 1.0;
  }

  // Check adjacent months
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;

  if (destination.bestMonths.includes(prevMonth) || destination.bestMonths.includes(nextMonth)) {
    return 0.7;
  }

  return 0.3;
}

/**
 * Score how well the destination matches requested vibes
 */
export function scoreVibeMatch(destination: Destination, requestedVibes: string[]): number {
  if (!requestedVibes || requestedVibes.length === 0) {
    return 1.0; // No preference = all destinations valid
  }

  const matchCount = requestedVibes.filter(v =>
    destination.vibes.includes(v as DestinationVibe)
  ).length;

  return matchCount / requestedVibes.length;
}

/**
 * Score how well the destination fits the budget
 */
export function scoreBudgetFit(destination: Destination, profile: FlashVacationPreferences): number {
  const budget = profile.budget;
  if (!budget || !budget.perTripMax) {
    return 1.0;
  }

  const avgCost = destination.averageCost;
  const maxBudget = budget.perTripMax;
  const minBudget = budget.perTripMin || 0;

  // Perfect fit if within range
  if (avgCost >= minBudget && avgCost <= maxBudget) {
    return 1.0;
  }

  // Slightly over budget
  if (avgCost > maxBudget && avgCost <= maxBudget * 1.2) {
    return budget.flexibility === 'splurge_ok' ? 0.8 :
           budget.flexibility === 'flexible' ? 0.5 : 0.2;
  }

  // Way over budget
  if (avgCost > maxBudget * 1.2) {
    return budget.flexibility === 'splurge_ok' ? 0.4 : 0.1;
  }

  // Under budget (usually fine)
  if (avgCost < minBudget) {
    return 0.7;
  }

  return 0.5;
}

/**
 * Score how reachable/practical the destination is from the user's location.
 * Nearby destinations score higher — not as a penalty for far ones, but as a
 * boost for equally-good options that are actually convenient to book.
 *
 * A beach trip to Cancun from Toronto beats Bali from Toronto (unless the user
 * specifically craves Bali's vibe and nothing else matches).
 *
 * Scoring curve:
 *   0-4 hours  → 1.0  (short haul, very practical)
 *   4-8 hours  → 0.8  (medium haul, still easy)
 *   8-14 hours → 0.5  (long haul, doable)
 *   14+ hours  → 0.3  (ultra long, aspirational)
 *   No data    → 0.5  (neutral — don't penalize when we can't estimate)
 */
export function scoreReachability(destination: Destination, originAirport: string): number {
  if (!originAirport) return 0.5; // No origin = neutral

  const estimate = estimateTravelTime(originAirport, destination);
  if (!estimate) return 0.5; // Can't estimate = neutral

  const hours = estimate.totalHours;
  if (hours <= 4) return 1.0;
  if (hours <= 8) return 0.8;
  if (hours <= 14) return 0.5;
  return 0.3;
}

/**
 * Select a diverse set of destinations based on profile and preferences
 */
export function selectDestinations(params: SelectionParams): Destination[] {
  const { profile, departureDate, returnDate, vibes, region, count, originAirport, revealedPreferences, excludeDestinations } = params;

  // Start with all destinations (POI data cleaned - garbage POIs removed Jan 2026)
  let candidates = [...DESTINATIONS];

  // Filter by region if specified
  if (region) {
    candidates = candidates.filter(d => d.region === region);
  }

  // Don't suggest the origin city
  candidates = candidates.filter(d => d.airportCode !== originAirport);

  // Filter out excluded destinations (for lazy loading - exclude already shown cities)
  if (excludeDestinations && excludeDestinations.length > 0) {
    const excludeSet = new Set(excludeDestinations.map(d => d.toLowerCase()));
    candidates = candidates.filter(d => !excludeSet.has(d.city.toLowerCase()));
  }

  // Check if we have enough revealed preference data to use it
  const useRevealedPrefs = revealedPreferences && hasEnoughSignals(revealedPreferences);

  // Score each destination
  // Scoring is driven by form inputs (vibes, dates, budget), reachability, and learned behavior
  // No saved profile required — everything comes from the search form or swipe history
  const hasOrigin = !!originAirport;

  const scoredDestinations: ScoredDestination[] = candidates.map(destination => {
    const seasonalFit = scoreSeasonalFit(destination, departureDate);
    const vibeMatch = scoreVibeMatch(destination, vibes || []);
    const budgetFit = scoreBudgetFit(destination, profile);
    const reachability = scoreReachability(destination, originAirport);

    // Calculate revealed preference score (0.5 neutral if not enough data)
    const revealedPref = useRevealedPrefs
      ? scoreDestination(revealedPreferences!, destination)
      : 0.5;

    // Weighted total — vibes and season are king, reachability gives a gentle
    // nudge toward practical bookable destinations, budget is a sanity check,
    // revealed prefs take over once the user has swiped enough
    let total: number;
    if (useRevealedPrefs) {
      // With behavioral data — reachability still matters but behavior dominates
      total = hasOrigin
        ? seasonalFit * 0.15 +
          vibeMatch * 0.20 +
          budgetFit * 0.10 +
          reachability * 0.15 +
          revealedPref * 0.40
        : seasonalFit * 0.20 +
          vibeMatch * 0.25 +
          budgetFit * 0.15 +
          revealedPref * 0.40;
    } else {
      // Fresh user — reachability makes destinations feel actionable
      total = hasOrigin
        ? seasonalFit * 0.30 +
          vibeMatch * 0.35 +
          budgetFit * 0.20 +
          reachability * 0.15    // Gentle nudge toward nearby gems
        : seasonalFit * 0.35 +
          vibeMatch * 0.40 +
          budgetFit * 0.25;
    }

    return {
      destination,
      scores: { seasonalFit, vibeMatch, budgetFit, reachability, revealedPref, total },
    };
  });

  // Sort by score
  scoredDestinations.sort((a, b) => b.scores.total - a.scores.total);

  // Apply diversity based on surprise tolerance
  const surpriseTolerance = profile.surpriseTolerance || 3;

  // Use discovery-aware selection when revealed preferences are active
  if (useRevealedPrefs) {
    return selectWithDiscovery(scoredDestinations, count, surpriseTolerance);
  }

  return selectDiverseSet(scoredDestinations, count, surpriseTolerance);
}

/**
 * Select a diverse set of destinations, balancing quality and variety
 */
function selectDiverseSet(
  scored: ScoredDestination[],
  count: number,
  surpriseTolerance: number
): Destination[] {
  const selected: Destination[] = [];
  const usedCountries = new Set<string>();
  const usedRegions = new Set<string>();
  const usedVibes = new Set<string>();

  // Diversity weight based on surprise tolerance
  // Low tolerance (1-2): Pick top scoring destinations
  // High tolerance (4-5): Maximize diversity
  const diversityWeight = (surpriseTolerance - 1) / 4; // 0 to 1

  for (const item of scored) {
    if (selected.length >= count) break;

    const dest = item.destination;

    // Calculate diversity penalty
    let diversityPenalty = 0;

    if (usedCountries.has(dest.country)) {
      diversityPenalty += 0.3;
    }

    if (usedRegions.has(dest.region)) {
      diversityPenalty += 0.2;
    }

    const sharedVibes = dest.vibes.filter(v => usedVibes.has(v)).length;
    diversityPenalty += (sharedVibes / dest.vibes.length) * 0.2;

    // Apply diversity weight
    const effectivePenalty = diversityPenalty * diversityWeight;
    const effectiveScore = item.scores.total - effectivePenalty;

    // For low surprise tolerance, skip heavily penalized destinations
    if (surpriseTolerance <= 2 && selected.length > 0) {
      // Just pick top destinations regardless of diversity
      selected.push(dest);
      usedCountries.add(dest.country);
      usedRegions.add(dest.region);
      dest.vibes.forEach(v => usedVibes.add(v));
    } else if (surpriseTolerance >= 4) {
      // For high tolerance, enforce diversity
      const hasCountry = usedCountries.has(dest.country);
      const hasRegion = usedRegions.has(dest.region);

      // Skip if we already have a destination from this country (unless few options)
      if (hasCountry && selected.length < count - 2) {
        continue;
      }

      // Skip if we have too many from this region (count region occurrences differently)
      // For simplicity, just check if region exists
      if (hasRegion && selected.length < count - 3) {
        continue;
      }

      selected.push(dest);
      usedCountries.add(dest.country);
      usedRegions.add(dest.region);
      dest.vibes.forEach(v => usedVibes.add(v));
    } else {
      // Moderate tolerance - balanced approach
      if (effectiveScore > 0.3 || selected.length >= count - 2) {
        selected.push(dest);
        usedCountries.add(dest.country);
        usedRegions.add(dest.region);
        dest.vibes.forEach(v => usedVibes.add(v));
      }
    }
  }

  // If we didn't get enough, fill from remaining
  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(item.destination)) {
        selected.push(item.destination);
      }
    }
  }

  return selected;
}

/**
 * Select destinations with discovery slots for variety
 * 25% of results are "discovery" picks - destinations the user might not typically choose
 * but could help expand their preferences
 */
function selectWithDiscovery(
  scored: ScoredDestination[],
  count: number,
  surpriseTolerance: number
): Destination[] {
  const DISCOVERY_RATIO = 0.25; // 25% discovery, 75% preference-matched
  const discoveryCount = Math.max(1, Math.floor(count * DISCOVERY_RATIO));
  const preferenceCount = count - discoveryCount;

  // Get top preference-matched destinations
  const topPicks = selectDiverseSet(scored, preferenceCount, surpriseTolerance);

  // For discovery picks, look at destinations that scored lower in revealed prefs
  // but still have decent profile/seasonal fit (avoid truly bad matches)
  const usedCities = new Set(topPicks.map(d => d.city.toLowerCase()));

  // Filter candidates for discovery:
  // - Not already selected
  // - Has reasonable base quality (profile + seasonal > 0.4)
  // - Lower revealed preference score (the "discovery" aspect)
  const discoveryPool = scored
    .filter(s => !usedCities.has(s.destination.city.toLowerCase()))
    .filter(s => {
      const baseQuality = (s.scores.vibeMatch + s.scores.seasonalFit) / 2;
      return baseQuality > 0.4; // Still a reasonable trip
    })
    .filter(s => s.scores.revealedPref < 0.6); // Lower preference = discovery opportunity

  // Shuffle and pick discovery destinations
  const shuffled = shuffleArray(discoveryPool);
  const discoveryPicks = shuffled
    .slice(0, discoveryCount)
    .map(s => s.destination);

  // Interleave: put discovery picks at positions 3, 6, etc (every 3rd slot starting at index 2)
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
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate overall diversity score for a set of destinations
 */
export function calculateDiversityScore(destinations: Destination[]): number {
  if (destinations.length <= 1) return 1;

  const countries = new Set(destinations.map(d => d.country));
  const regions = new Set(destinations.map(d => d.region));
  const allVibes = destinations.flatMap(d => d.vibes);
  const uniqueVibes = new Set(allVibes);

  const countryDiversity = countries.size / destinations.length;
  const regionDiversity = regions.size / Math.min(destinations.length, 7); // max 7 regions
  const vibeDiversity = uniqueVibes.size / 12; // 12 possible vibes

  return (countryDiversity * 0.4 + regionDiversity * 0.3 + vibeDiversity * 0.3);
}
