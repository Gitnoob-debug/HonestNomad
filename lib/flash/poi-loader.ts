import type { CachedPOI, DestinationPOICache, ItineraryPathType } from '@/types/poi';
import type { ItineraryStop } from './itinerary-generator';

// Load POI cache for a destination
export async function loadDestinationPOIs(destinationId: string): Promise<DestinationPOICache | null> {
  try {
    // In Next.js, we need to use dynamic import for JSON files in data folder
    const data = await import(`@/data/pois/${destinationId}.json`);
    return data.default as DestinationPOICache;
  } catch (error) {
    console.warn(`No POI cache found for ${destinationId}`);
    return null;
  }
}

// Map our simplified path choices to detailed path types
export type SimplePathChoice = 'classic' | 'trendy' | 'foodie' | 'adventure' | 'cultural' | 'relaxation' | 'nightlife';

// Get the relevant path types for a user's choice
export function getPathTypesForChoice(choice: SimplePathChoice): ItineraryPathType[] {
  switch (choice) {
    case 'classic':
      // Classic = main landmarks + cultural sites
      return ['classic', 'cultural'];
    case 'trendy':
      // Trendy = hidden gems, local spots, nightlife
      return ['trendy', 'nightlife', 'foodie'];
    case 'foodie':
      return ['foodie', 'trendy'];
    case 'adventure':
      return ['adventure', 'classic'];
    case 'cultural':
      return ['cultural', 'classic'];
    case 'relaxation':
      return ['relaxation', 'cultural'];
    case 'nightlife':
      return ['nightlife', 'trendy', 'foodie'];
    default:
      return ['classic', 'cultural'];
  }
}

// Convert CachedPOI to ItineraryStop format
export function poiToItineraryStop(poi: CachedPOI, day: number, stopIndex: number): ItineraryStop {
  // Map POI category to stop type
  const typeMap: Record<string, ItineraryStop['type']> = {
    landmark: 'landmark',
    restaurant: 'restaurant',
    cafe: 'restaurant',
    bar: 'restaurant',
    museum: 'landmark',
    park: 'activity',
    market: 'activity',
    activity: 'activity',
    nightclub: 'activity',
    viewpoint: 'landmark',
    neighborhood: 'activity',
  };

  return {
    id: `day${day}-stop${stopIndex + 1}`,
    name: poi.name,
    description: poi.description,
    type: typeMap[poi.category] || 'activity',
    latitude: poi.latitude,
    longitude: poi.longitude,
    duration: poi.suggestedDuration,
    imageUrl: poi.imageUrl,
    day,
    // Extended data from Google Places
    googleRating: poi.googleRating,
    googleReviewCount: poi.googleReviewCount,
    googlePrice: poi.googlePrice,
    address: poi.address,
    websiteUrl: poi.websiteUrl,
    googleMapsUrl: poi.googleMapsUrl,
    bestTimeOfDay: poi.bestTimeOfDay,
    category: poi.category,
  };
}

// Select POIs for an itinerary based on path choice and number of days
export function selectPOIsForItinerary(
  cache: DestinationPOICache,
  pathChoice: SimplePathChoice,
  numDays: number,
  stopsPerDay: number = 4
): CachedPOI[] {
  const pathTypes = getPathTypesForChoice(pathChoice);
  const allPOIs: CachedPOI[] = [];
  const seenIds = new Set<string>();

  // Collect POIs from relevant path types, prioritizing primary path
  for (const pathType of pathTypes) {
    const pathPOIs = cache.paths[pathType] || [];
    for (const poi of pathPOIs) {
      if (!seenIds.has(poi.id)) {
        seenIds.add(poi.id);
        allPOIs.push(poi);
      }
    }
  }

  // Sort by rank (lower is better)
  allPOIs.sort((a, b) => a.rank - b.rank);

  // Calculate total stops needed
  const totalStops = numDays * stopsPerDay;

  return allPOIs.slice(0, totalStops);
}

// Organize stops by time of day for better itinerary flow
export function organizeStopsByTimeOfDay(stops: CachedPOI[]): CachedPOI[] {
  const timeOrder = ['morning', 'afternoon', 'evening', 'night', 'any'];

  return [...stops].sort((a, b) => {
    const aTime = a.bestTimeOfDay || 'any';
    const bTime = b.bestTimeOfDay || 'any';
    return timeOrder.indexOf(aTime) - timeOrder.indexOf(bTime);
  });
}

// Get a mix of POI types for variety in the itinerary
export function getBalancedPOISelection(
  cache: DestinationPOICache,
  pathChoice: SimplePathChoice,
  numDays: number,
  stopsPerDay: number = 4
): CachedPOI[] {
  const pathTypes = getPathTypesForChoice(pathChoice);
  const primaryPath = pathTypes[0];
  const secondaryPaths = pathTypes.slice(1);

  const selected: CachedPOI[] = [];
  const seenIds = new Set<string>();
  const totalStops = numDays * stopsPerDay;

  // Get ~70% from primary path
  const primaryPOIs = cache.paths[primaryPath] || [];
  const primaryCount = Math.ceil(totalStops * 0.7);

  for (const poi of primaryPOIs.slice(0, primaryCount)) {
    if (!seenIds.has(poi.id)) {
      seenIds.add(poi.id);
      selected.push(poi);
    }
  }

  // Get remaining from secondary paths
  for (const pathType of secondaryPaths) {
    if (selected.length >= totalStops) break;

    const pathPOIs = cache.paths[pathType] || [];
    for (const poi of pathPOIs) {
      if (selected.length >= totalStops) break;
      if (!seenIds.has(poi.id)) {
        seenIds.add(poi.id);
        selected.push(poi);
      }
    }
  }

  // If still not enough, grab from any path
  if (selected.length < totalStops) {
    const allPathTypes: ItineraryPathType[] = ['classic', 'foodie', 'adventure', 'cultural', 'relaxation', 'nightlife', 'trendy'];
    for (const pathType of allPathTypes) {
      if (selected.length >= totalStops) break;

      const pathPOIs = cache.paths[pathType] || [];
      for (const poi of pathPOIs) {
        if (selected.length >= totalStops) break;
        if (!seenIds.has(poi.id)) {
          seenIds.add(poi.id);
          selected.push(poi);
        }
      }
    }
  }

  return selected;
}

// Check if we have POI data for a destination
export function hasPoiData(destinationId: string): boolean {
  // This is a simple check - in production you might want to validate the file exists
  const supportedDestinations = [
    'paris', 'rome', 'milan', 'dubrovnik', 'lisbon',
    'barcelona', 'madrid', 'amsterdam', 'vienna', 'munich',
    'prague', 'budapest', 'florence', 'venice', 'athens'
  ];
  return supportedDestinations.includes(destinationId.toLowerCase());
}
