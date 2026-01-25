import type { FlashVacationPreferences, Destination, DestinationVibe } from '@/types/flash';
import { DESTINATIONS, getDestinationsForMonth } from './destinations';
import type { RevealedPreferences } from './preferenceEngine';
import { scoreDestination, hasEnoughSignals } from './preferenceEngine';

interface ScoredDestination {
  destination: Destination;
  scores: {
    profileMatch: number;     // 0-1: How well it matches user interests
    seasonalFit: number;      // 0-1: How appropriate for travel dates
    vibeMatch: number;        // 0-1: How well it matches requested vibes
    budgetFit: number;        // 0-1: How well it fits budget
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
 * Score how well a destination matches the user's interests
 */
function scoreProfileMatch(destination: Destination, profile: FlashVacationPreferences): number {
  const primaryInterests = profile.interests?.primary || [];
  const secondaryInterests = profile.interests?.secondary || [];
  const travelStyle = profile.travelStyle;

  let score = 0;
  let maxScore = 0;

  // Primary interests (higher weight)
  primaryInterests.forEach(interest => {
    maxScore += 3;
    // Map interests to vibes
    const vibeMap: Record<string, DestinationVibe[]> = {
      museums: ['culture', 'history'],
      food_tours: ['food'],
      nightlife: ['nightlife'],
      hiking: ['adventure', 'nature'],
      beaches: ['beach', 'relaxation'],
      history: ['history', 'culture'],
      shopping: ['city'],
      photography: ['nature', 'city', 'culture'],
      water_sports: ['beach', 'adventure'],
      wine_tasting: ['food', 'relaxation'],
      wildlife: ['nature', 'adventure'],
      architecture: ['history', 'culture', 'city'],
      local_markets: ['culture', 'food'],
      spa_wellness: ['relaxation', 'luxury'],
      adventure_sports: ['adventure'],
      art_galleries: ['culture', 'city'],
    };

    const matchingVibes = vibeMap[interest] || [];
    if (matchingVibes.some(v => destination.vibes.includes(v))) {
      score += 3;
    }
  });

  // Secondary interests (lower weight)
  secondaryInterests.forEach(interest => {
    maxScore += 1;
    const vibeMap: Record<string, DestinationVibe[]> = {
      museums: ['culture', 'history'],
      food_tours: ['food'],
      nightlife: ['nightlife'],
      hiking: ['adventure', 'nature'],
      beaches: ['beach', 'relaxation'],
      history: ['history', 'culture'],
      shopping: ['city'],
      photography: ['nature', 'city', 'culture'],
      water_sports: ['beach', 'adventure'],
      wine_tasting: ['food', 'relaxation'],
      wildlife: ['nature', 'adventure'],
      architecture: ['history', 'culture', 'city'],
      local_markets: ['culture', 'food'],
      spa_wellness: ['relaxation', 'luxury'],
      adventure_sports: ['adventure'],
      art_galleries: ['culture', 'city'],
    };

    const matchingVibes = vibeMap[interest] || [];
    if (matchingVibes.some(v => destination.vibes.includes(v))) {
      score += 1;
    }
  });

  // Travel style matching
  if (travelStyle) {
    maxScore += 2;
    // Adventure vs relaxation
    if (travelStyle.adventureRelaxation >= 4 && destination.vibes.includes('adventure')) {
      score += 1;
    } else if (travelStyle.adventureRelaxation <= 2 && destination.vibes.includes('relaxation')) {
      score += 1;
    }
    // Pace matching
    if (travelStyle.pace === 'packed' && destination.vibes.includes('city')) {
      score += 1;
    } else if (travelStyle.pace === 'relaxed' && (destination.vibes.includes('beach') || destination.vibes.includes('relaxation'))) {
      score += 1;
    }
  }

  // Family-friendly if traveling with kids
  if (profile.travelers?.children && profile.travelers.children.length > 0) {
    maxScore += 2;
    if (destination.vibes.includes('family')) {
      score += 2;
    }
  }

  return maxScore > 0 ? score / maxScore : 0.5;
}

/**
 * Score how appropriate the destination is for the travel dates
 */
function scoreSeasonalFit(destination: Destination, departureDate: string): number {
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
function scoreVibeMatch(destination: Destination, requestedVibes: string[]): number {
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
function scoreBudgetFit(destination: Destination, profile: FlashVacationPreferences): number {
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
  const scoredDestinations: ScoredDestination[] = candidates.map(destination => {
    const profileMatch = scoreProfileMatch(destination, profile);
    const seasonalFit = scoreSeasonalFit(destination, departureDate);
    const vibeMatch = scoreVibeMatch(destination, vibes || []);
    const budgetFit = scoreBudgetFit(destination, profile);

    // Calculate revealed preference score (0.5 neutral if not enough data)
    const revealedPref = useRevealedPrefs
      ? scoreDestination(revealedPreferences!, destination)
      : 0.5;

    // Weighted total - adjust weights when revealed prefs are available
    let total: number;
    if (useRevealedPrefs) {
      // When we have revealed preferences, they get significant weight
      // Reduce profile match weight since revealed prefs are more accurate
      total =
        profileMatch * 0.20 +     // Reduced from 0.35
        seasonalFit * 0.20 +      // Reduced from 0.25
        vibeMatch * 0.20 +        // Reduced from 0.25
        budgetFit * 0.10 +        // Reduced from 0.15
        revealedPref * 0.30;      // New: 30% weight for learned preferences
    } else {
      // Without revealed preferences, use original weights
      total =
        profileMatch * 0.35 +
        seasonalFit * 0.25 +
        vibeMatch * 0.25 +
        budgetFit * 0.15;
    }

    return {
      destination,
      scores: { profileMatch, seasonalFit, vibeMatch, budgetFit, revealedPref, total },
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
      const baseQuality = (s.scores.profileMatch + s.scores.seasonalFit) / 2;
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
