/**
 * Generate compelling one-liner taglines for destinations
 * Uses vibes, highlights, and region to create unique selling points
 */

import type { Destination } from '@/types/flash';

// Vibe-based tagline templates
const VIBE_TAGLINES: Record<string, string[]> = {
  beach: [
    'Crystal waters and endless coastline',
    'Where the sand meets paradise',
    'Sun-soaked shores waiting for you',
  ],
  romance: [
    'The most romantic city in the world',
    'Where every corner tells a love story',
    'Made for couples and dreamers',
  ],
  culture: [
    'Centuries of history around every corner',
    'Where ancient meets modern',
    'A cultural treasure trove',
  ],
  food: [
    'A food lover\'s dream destination',
    'Eat your way through the city',
    'Where every meal is an adventure',
  ],
  history: [
    'Walk through living history',
    'Where empires left their mark',
    'Centuries of stories in every street',
  ],
  nightlife: [
    'The city that never sleeps',
    'World-class nightlife and energy',
    'After dark, the city comes alive',
  ],
  adventure: [
    'Adventure around every corner',
    'For the thrill-seekers and explorers',
    'Where nature puts on a show',
  ],
  nature: [
    'Breathtaking natural landscapes',
    'Nature at its most dramatic',
    'Where wilderness meets wonder',
  ],
  city: [
    'Urban energy and hidden gems',
    'A world-class city experience',
    'Big city vibes, local soul',
  ],
  luxury: [
    'Where luxury meets authenticity',
    'Five-star everything',
    'Indulgence at its finest',
  ],
  spiritual: [
    'A journey for the soul',
    'Where spirituality meets beauty',
    'Find peace in ancient traditions',
  ],
  islands: [
    'Island paradise perfected',
    'Escape to island time',
    'Where every island has a story',
  ],
  mountains: [
    'Peaks, valleys, and pure air',
    'Mountain majesty awaits',
    'Where altitude meets attitude',
  ],
  diving: [
    'World-class diving and marine life',
    'Underwater paradise',
    'Dive into crystal-clear waters',
  ],
  surfing: [
    'Legendary waves and surf culture',
    'Ride the perfect wave',
    'Surf, sand, and good vibes',
  ],
  wine: [
    'World-renowned wine country',
    'Sip your way through vineyards',
    'Where every glass tells a story',
  ],
  art: [
    'A living canvas of creativity',
    'Where art is everywhere you look',
    'Galleries, murals, and masterpieces',
  ],
  shopping: [
    'Shopper\'s paradise',
    'From boutiques to bazaars',
    'Retail therapy at its finest',
  ],
  wellness: [
    'Recharge your mind and body',
    'Where wellness is a way of life',
    'Spa, serenity, and self-care',
  ],
  safari: [
    'The Big Five and beyond',
    'Wildlife encounters of a lifetime',
    'Where the wild things roam',
  ],
};

// City-specific taglines that override vibe-based ones
const CITY_TAGLINES: Record<string, string> = {
  'paris': 'The city of light, love, and legendary cuisine',
  'tokyo': 'Where ancient temples meet neon-lit streets',
  'rome': 'Every cobblestone has a story to tell',
  'barcelona': 'Gaudí, tapas, and Mediterranean sunsets',
  'amsterdam': 'Canals, culture, and creative energy',
  'new-york': 'The city that defines what cities can be',
  'london': 'Royal heritage meets modern cool',
  'bangkok': 'Street food capital of the world',
  'istanbul': 'Where East meets West in spectacular fashion',
  'lisbon': 'Colorful hills, pastéis, and ocean breezes',
  'marrakech': 'A feast for every sense',
  'kyoto': 'Zen gardens and ancient traditions preserved',
  'rio': 'Samba, sunsets, and Sugarloaf views',
  'dubai': 'Where the future is already built',
  'cape-town': 'Mountains, vineyards, and ocean in one city',
  'buenos-aires': 'Tango, steak, and endless charm',
  'prague': 'A fairytale city with real personality',
  'vienna': 'Coffee culture and classical grandeur',
  'singapore': 'A futuristic garden city that works perfectly',
  'bali': 'Temples, rice terraces, and spiritual energy',
  'havana': 'Frozen in time and full of soul',
  'reykjavik': 'Northern lights and volcanic landscapes',
  'cartagena': 'Colombia\'s colorful Caribbean gem',
  'cusco': 'Gateway to the Inca empire',
  'cairo': 'Pyramids, chaos, and ancient wonder',
  'mexico-city': 'Murals, mezcal, and magnificent food',
  'florence': 'Renaissance art in every direction',
  'seoul': 'K-culture, street food, and futuristic style',
  'sydney': 'Harbour views and beach culture perfected',
  'san-francisco': 'Innovation, fog, and iconic bridges',
  'athens': 'The birthplace of Western civilization',
  'budapest': 'Thermal baths and Danube panoramas',
  'copenhagen': 'Hygge, design, and world-class dining',
  'vietnam': 'Motorbikes, phở, and stunning coastlines',
  'morocco': 'Spices, souks, and Saharan sunsets',
  'zanzibar': 'Spice island paradise',
  'maldives': 'Overwater bungalows and liquid turquoise',
  'santorini': 'White-washed cliffs above a volcanic caldera',
  'amalfi': 'Cliffside villages and limoncello sunsets',
  'maui': 'Where rainforests meet volcanic beaches',
  'queenstown': 'Adventure capital of the world',
  'petra': 'A lost city carved from rose-red cliffs',
  'hong-kong': 'Dim sum, skyscrapers, and harbor views',
  'jaipur': 'The Pink City of palaces and color',
  'edinburgh': 'Castle views and whisky trails',
  'dubrovnik': 'The pearl of the Adriatic',
  'vancouver': 'Mountains meet ocean meets city',
  'stockholm': 'Scandinavian cool on 14 islands',
  'nairobi': 'Safari gateway with urban energy',
  'bogota': 'Colombia\'s cultural heartbeat at altitude',
  'osaka': 'Japan\'s kitchen and comedy capital',
  'seville': 'Flamenco, tapas, and orange-scented plazas',
  'porto': 'Port wine and tiled beauty along the Douro',
  'hanoi': 'Ancient streets and the best phở on earth',
  'medellín': 'From gritty to gorgeous — a city transformed',
  'tbilisi': 'Wine, mountains, and post-Soviet cool',
  'oaxaca': 'Mexico\'s culinary and cultural soul',
};

/**
 * Generate a tagline for a destination
 * Prefers city-specific taglines, falls back to vibe-based generation
 */
export function generateTagline(destination: Destination): string {
  // Check for city-specific tagline first
  const cityTagline = CITY_TAGLINES[destination.id];
  if (cityTagline) return cityTagline;

  // Fall back to vibe-based tagline
  // Pick the most distinctive vibe (less common = more interesting)
  const vibePool: string[] = [];
  for (const vibe of destination.vibes) {
    const templates = VIBE_TAGLINES[vibe];
    if (templates) {
      vibePool.push(...templates);
    }
  }

  if (vibePool.length > 0) {
    // Use destination id as seed for consistent selection
    const hash = destination.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return vibePool[hash % vibePool.length];
  }

  // Ultimate fallback using highlights
  if (destination.highlights.length >= 2) {
    return `${destination.highlights[0]} and ${destination.highlights[1].toLowerCase()}`;
  }

  return `Discover ${destination.city}`;
}
