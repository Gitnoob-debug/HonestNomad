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

// All 410 destinations with cached POI data from Google Places
const SUPPORTED_DESTINATIONS = new Set([
  'aarhus', 'abu-dhabi', 'addis-ababa', 'agra', 'albuquerque', 'alula', 'amalfi',
  'amsterdam', 'anchorage', 'antigua', 'antigua-guatemala', 'antwerp', 'arenal',
  'arequipa', 'aruba', 'asheville', 'aspen', 'atacama', 'athens', 'atlanta',
  'auckland', 'austin', 'azores', 'bahamas', 'bahrain', 'bali', 'banff', 'bangkok',
  'banos', 'barbados', 'barcelona', 'bariloche', 'basel', 'bath', 'beijing',
  'beirut', 'belfast', 'belgrade', 'belize', 'bergen', 'berlin', 'bhutan',
  'big-sur', 'bilbao', 'black-forest', 'bogota', 'bologna', 'bonaire', 'bora-bora',
  'boracay', 'bordeaux', 'boston', 'botswana', 'bratislava', 'brighton', 'bristol',
  'bruges', 'brussels', 'bucharest', 'budapest', 'buenos-aires', 'busan', 'cabo',
  'calgary', 'cambridge', 'canary-islands', 'cancun', 'cape-cod', 'cape-town',
  'cardiff', 'carmel', 'cartagena', 'caye-caulker', 'cayman-islands', 'chamonix',
  'chania', 'charleston', 'charlotte', 'chefchaouen', 'chiang-mai', 'chicago',
  'cinque-terre', 'cleveland', 'cologne', 'colonia', 'cook-islands', 'copenhagen',
  'cordoba', 'corfu', 'cork', 'corsica', 'costa-rica', 'cotswolds', 'cozumel',
  'crete', 'cuenca', 'curacao', 'da-nang', 'dallas', 'dead-sea', 'delhi', 'denver',
  'detroit', 'doha', 'dominican-republic', 'dresden', 'dubai', 'dublin', 'dubrovnik',
  'dusseldorf', 'easter-island', 'edinburgh', 'edmonton', 'egypt', 'essaouira',
  'fes', 'fiji', 'florence', 'florianopolis', 'frankfurt', 'galapagos', 'galway',
  'gdansk', 'geneva', 'ghana', 'ghent', 'glasgow', 'goa', 'gold-coast', 'gothenburg',
  'gran-canaria', 'granada', 'grand-canyon', 'graz', 'great-barrier-reef', 'grenada',
  'guadalajara', 'guadeloupe', 'guam', 'guanajuato', 'guilin', 'halifax', 'hamburg',
  'hanoi', 'hawaii', 'heidelberg', 'helsinki', 'hoi-an', 'hong-kong', 'houston',
  'hurghada', 'ibiza', 'iguazu-falls', 'indianapolis', 'innsbruck', 'israel',
  'jackson-hole', 'jaipur', 'jamaica', 'jasper', 'jeddah', 'jerusalem', 'johannesburg',
  'jordan', 'kansas-city', 'kathmandu', 'kefalonia', 'kelowna', 'kenya', 'key-west',
  'kochi', 'kotor', 'krakow', 'kruger', 'kuala-lumpur', 'kuwait', 'kyoto',
  'la-paz', 'lake-atitlan', 'lake-bled', 'lake-como', 'lake-district', 'lake-tahoe',
  'langkawi', 'lanzarote', 'lapland', 'las-vegas', 'leipzig', 'lille', 'lima',
  'limassol', 'lisbon', 'liverpool', 'ljubljana', 'lofoten', 'lombok', 'london',
  'los-angeles', 'luang-prabang', 'lucerne', 'luxembourg', 'luxor', 'lyon', 'madeira',
  'madrid', 'majorca', 'malaga', 'maldives', 'malmö', 'malta', 'manchester', 'manila',
  'manuel-antonio', 'marbella', 'marseille', 'martha-vineyard', 'martinique', 'maui',
  'mauritius', 'medellin', 'melbourne', 'memphis', 'mendoza', 'menorca', 'merida',
  'mexico-city', 'miami', 'milan', 'milford-sound', 'milwaukee', 'minneapolis',
  'moab', 'monaco', 'mont-saint-michel', 'monteverde', 'montevideo', 'montreal',
  'morocco', 'mostar', 'mumbai', 'munich', 'mykonos', 'namibia', 'nantes', 'nantucket',
  'napa-valley', 'naples', 'nashville', 'naxos', 'new-caledonia', 'new-orleans',
  'new-york', 'new-zealand', 'nha-trang', 'niagara-falls', 'nice', 'nuremberg',
  'oaxaca', 'oman', 'orlando', 'osaka', 'oslo', 'ottawa', 'oxford', 'palau', 'palawan',
  'palm-springs', 'panama', 'paphos', 'paris', 'park-city', 'paros', 'patagonia',
  'perth', 'peru', 'philadelphia', 'phoenix', 'phuket', 'pittsburgh', 'playa-del-carmen',
  'plovdiv', 'portland', 'portland-maine', 'porto', 'prague', 'prince-edward-island',
  'provence', 'puebla', 'puerto-madryn', 'puerto-rico', 'puerto-vallarta', 'puglia',
  'puno', 'punta-del-este', 'quebec-city', 'quito', 'raleigh', 'reunion', 'reykjavik',
  'rhodes', 'riga', 'rio', 'riyadh', 'roatan', 'rome', 'rotorua', 'rotterdam',
  'rwanda', 'sacred-valley', 'salar-de-uyuni', 'salt-lake-city', 'salta', 'salvador',
  'salzburg', 'samoa', 'san-antonio', 'san-diego', 'san-francisco', 'san-miguel',
  'san-sebastian', 'santa-barbara', 'santa-fe', 'santa-marta', 'santiago', 'santorini',
  'sao-paulo', 'sarajevo', 'sardinia', 'savannah', 'scottish-highlands', 'scottsdale',
  'seattle', 'sedona', 'senegal', 'seoul', 'seville', 'seychelles', 'shanghai',
  'sicily', 'siem-reap', 'singapore', 'sofia', 'sonoma', 'split', 'sri-lanka',
  'st-barts', 'st-johns', 'st-kitts', 'st-louis', 'st-lucia', 'stockholm', 'strasbourg',
  'stuttgart', 'swiss-alps', 'sydney', 'tahiti', 'taipei', 'tallinn', 'tamarindo',
  'tampa', 'tanzania', 'tasmania', 'tayrona', 'the-hague', 'thessaloniki', 'tirana',
  'todos-santos', 'tokyo', 'toledo', 'toronto', 'torres-del-paine', 'toulouse',
  'tromso', 'tucson', 'tulum', 'tunis', 'turin', 'turks-caicos', 'uganda', 'ushuaia',
  'vail', 'valencia', 'valparaiso', 'vancouver', 'vanuatu', 'venice', 'verona',
  'victoria-bc', 'victoria-falls', 'vienna', 'vietnam', 'vilnius', 'vina-del-mar',
  'virgin-islands', 'warsaw', 'washington-dc', 'wellington', 'whistler', 'wroclaw',
  'xian', 'yangon', 'yellowstone', 'yogyakarta', 'york', 'zagreb', 'zakynthos',
  'zanzibar', 'zermatt', 'zion', 'zurich',
]);

// Check if we have POI data for a destination
export function hasPoiData(destinationId: string): boolean {
  return SUPPORTED_DESTINATIONS.has(destinationId.toLowerCase().replace(/\s+/g, '-'));
}
