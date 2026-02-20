/**
 * Deterministic Packing List Generator
 *
 * Generates packing recommendations based on:
 * - Weather data for travel month
 * - Vibe/path type (activity-specific gear)
 * - POI categories from actual itinerary
 * - Traveler type (solo/couple/family/group)
 * - Trip duration
 * - Plug types from country facts
 *
 * NO destination-specific items. Everything derived from weather + activity logic.
 * Zero API calls — pure rules engine.
 */

import type {
  PackingList,
  PackingItem,
  PackingCategory,
  MonthlyWeather,
  RainLevel,
  HumidityLevel,
} from '@/types/destination-intelligence';

// ── Input ────────────────────────────────────────────────────────────
export interface PackingEngineInput {
  weather: MonthlyWeather;
  pathType: string;           // classic, foodie, adventure, etc.
  vibes: string[];            // beach, culture, nightlife, etc.
  travelerType: string;       // solo, couple, family, group
  nights: number;
  plugTypes: string[];        // From country facts (e.g., ["Type C", "Type E"])
  poiCategories: string[];    // Categories from actual POIs (landmark, museum, bar, etc.)
}

// ── Rules ────────────────────────────────────────────────────────────

function getAlwaysPackItems(): PackingItem[] {
  return [
    { item: 'Passport and travel documents', reason: 'Essential for international travel', category: 'documents' },
    { item: 'Phone charger and portable battery', reason: 'For navigation, photos, and staying connected', category: 'tech' },
    { item: 'Any personal medications', reason: 'Bring enough for the full trip plus a few extra days', category: 'health' },
    { item: 'Copies of booking confirmations', reason: 'Digital or printed backups of hotel and activity bookings', category: 'documents' },
    { item: 'Travel insurance details', reason: 'Keep policy number and emergency contact accessible', category: 'documents' },
  ];
}

function getWeatherClothingItems(weather: MonthlyWeather): PackingItem[] {
  const items: PackingItem[] = [];
  const { avgHighC, avgLowC, rainProbability, humidity } = weather;

  // Hot weather (>28°C high)
  if (avgHighC >= 28) {
    items.push({
      item: 'Lightweight, breathable clothing',
      reason: `Expect highs around ${avgHighC}°C — light fabrics will keep you comfortable`,
      category: 'clothing',
    });
    items.push({
      item: 'Sunscreen (SPF 30+)',
      reason: 'Strong sun exposure likely at these temperatures',
      category: 'health',
    });
    items.push({
      item: 'Sunglasses and hat',
      reason: 'Sun protection for outdoor activities',
      category: 'clothing',
    });
  }

  // Warm weather (20-28°C)
  if (avgHighC >= 20 && avgHighC < 28) {
    items.push({
      item: 'Light layers and a mix of short and long sleeves',
      reason: `Comfortable temperatures around ${avgLowC}–${avgHighC}°C — layers help with varying conditions`,
      category: 'clothing',
    });
  }

  // Cool weather (10-20°C)
  if (avgHighC >= 10 && avgHighC < 20) {
    items.push({
      item: 'Medium layers and a light jacket',
      reason: `Temperatures around ${avgLowC}–${avgHighC}°C — mornings and evenings can be cool`,
      category: 'clothing',
    });
  }

  // Cold weather (<10°C high)
  if (avgHighC < 10) {
    items.push({
      item: 'Warm layers, insulated jacket, and scarf',
      reason: `Cold weather expected with highs around ${avgHighC}°C and lows near ${avgLowC}°C`,
      category: 'clothing',
    });
    items.push({
      item: 'Warm hat and gloves',
      reason: 'Essential for spending time outdoors in cold temperatures',
      category: 'clothing',
    });
  }

  // Rain gear
  if (rainProbability === 'high') {
    items.push({
      item: 'Rain jacket or compact umbrella',
      reason: 'High chance of rain — a waterproof layer is essential',
      category: 'clothing',
    });
    items.push({
      item: 'Waterproof bag or dry pouch',
      reason: 'Protect your phone and documents from rain',
      category: 'gear',
    });
  } else if (rainProbability === 'moderate') {
    items.push({
      item: 'Compact umbrella or light rain layer',
      reason: 'Occasional rain is possible — good to be prepared',
      category: 'clothing',
    });
  }

  // Humidity
  if (humidity === 'high' && avgHighC >= 25) {
    items.push({
      item: 'Moisture-wicking fabrics',
      reason: 'High humidity makes cotton uncomfortable — synthetic or linen fabrics breathe better',
      category: 'clothing',
    });
  }

  // Universal
  items.push({
    item: 'Comfortable walking shoes',
    reason: 'You\'ll be on your feet exploring — supportive shoes make a big difference',
    category: 'clothing',
  });

  return items;
}

function getVibeItems(pathType: string, vibes: string[]): PackingItem[] {
  const items: PackingItem[] = [];
  const allSignals = new Set([pathType, ...vibes]);

  if (allSignals.has('adventure')) {
    items.push({
      item: 'Hiking or trail shoes',
      reason: 'Adventure activities often involve uneven terrain',
      category: 'gear',
    });
    items.push({
      item: 'Daypack or small backpack',
      reason: 'Carry water, snacks, and gear for day trips',
      category: 'gear',
    });
    items.push({
      item: 'Reusable water bottle',
      reason: 'Stay hydrated during active excursions',
      category: 'gear',
    });
  }

  if (allSignals.has('beach') || allSignals.has('relaxation')) {
    items.push({
      item: 'Swimwear',
      reason: 'For beaches, pools, or waterfront activities',
      category: 'clothing',
    });
    items.push({
      item: 'Quick-dry towel or sarong',
      reason: 'Useful at beaches and saves hotel towels',
      category: 'gear',
    });
  }

  if (allSignals.has('nightlife')) {
    items.push({
      item: 'One smart-casual outfit',
      reason: 'Some venues have dress codes — a collared shirt or nice top goes a long way',
      category: 'clothing',
    });
  }

  if (allSignals.has('foodie') || allSignals.has('food')) {
    items.push({
      item: 'Antacid or digestive aid',
      reason: 'Trying lots of new food — your stomach may need some help adjusting',
      category: 'health',
    });
  }

  if (allSignals.has('culture') || allSignals.has('cultural') || allSignals.has('history')) {
    items.push({
      item: 'Small notebook or journal',
      reason: 'For jotting down thoughts, recommendations, or sketching what you see',
      category: 'comfort',
    });
  }

  if (allSignals.has('nature')) {
    items.push({
      item: 'Insect repellent',
      reason: 'Nature areas often have mosquitoes or other biting insects',
      category: 'health',
    });
    items.push({
      item: 'Binoculars (optional)',
      reason: 'Great for wildlife spotting and scenic viewpoints',
      category: 'gear',
    });
  }

  return items;
}

function getPOICategoryItems(poiCategories: string[]): PackingItem[] {
  const items: PackingItem[] = [];
  const cats = new Set(poiCategories);

  // Religious sites / temples
  if (cats.has('landmark') || cats.has('cultural')) {
    items.push({
      item: 'Modest clothing option (covers shoulders and knees)',
      reason: 'Some landmarks and cultural sites may have dress requirements',
      category: 'clothing',
    });
  }

  if (cats.has('viewpoint') || cats.has('activity')) {
    items.push({
      item: 'Sturdy, closed-toe shoes',
      reason: 'Viewpoints and activities may involve hiking or uneven ground',
      category: 'clothing',
    });
  }

  if (cats.has('market')) {
    items.push({
      item: 'Small crossbody bag or money belt',
      reason: 'Markets can be crowded — keep belongings secure and accessible',
      category: 'gear',
    });
  }

  return items;
}

function getTravelerTypeItems(travelerType: string): PackingItem[] {
  const items: PackingItem[] = [];

  if (travelerType === 'family') {
    items.push({
      item: 'Snacks and entertainment for travel days',
      reason: 'Kids get restless during transit — come prepared',
      category: 'comfort',
    });
    items.push({
      item: 'Basic first-aid kit',
      reason: 'Band-aids, antiseptic, and child-safe pain relief for minor issues',
      category: 'health',
    });
  }

  if (travelerType === 'solo') {
    items.push({
      item: 'Portable door lock or doorstop alarm',
      reason: 'Extra security for solo travelers in accommodations',
      category: 'gear',
    });
  }

  return items;
}

function getDurationItems(nights: number): PackingItem[] {
  const items: PackingItem[] = [];

  if (nights > 5) {
    items.push({
      item: 'Travel laundry supplies or plan for laundry service',
      reason: `${nights} nights is long enough that you\'ll likely need to wash clothes`,
      category: 'comfort',
    });
  }

  if (nights <= 3) {
    items.push({
      item: 'Pack light — carry-on only if possible',
      reason: `A ${nights}-night trip doesn't need much — saves time at airports`,
      category: 'comfort',
    });
  }

  return items;
}

function getPlugItems(plugTypes: string[]): PackingItem[] {
  if (!plugTypes.length) return [];

  // Common plug types by region — if the destination uses non-US/UK types, mention adapter
  const commonTypes = new Set(['Type A', 'Type B']); // US/Canada/Mexico
  const needsAdapter = plugTypes.some(t => !commonTypes.has(t));

  if (needsAdapter) {
    return [{
      item: `Travel power adapter (${plugTypes.join(' / ')})`,
      reason: `Local outlets use ${plugTypes.join(' and ')} — your devices may need an adapter`,
      category: 'tech',
    }];
  }

  return [];
}

// ── Main export ──────────────────────────────────────────────────────

export function generatePackingList(input: PackingEngineInput): PackingList {
  const {
    weather,
    pathType,
    vibes,
    travelerType,
    nights,
    plugTypes,
    poiCategories,
  } = input;

  // Collect all items from rules
  const alwaysPack = getAlwaysPackItems();
  const weatherItems = getWeatherClothingItems(weather);
  const vibeItems = getVibeItems(pathType, vibes);
  const poiItems = getPOICategoryItems(poiCategories);
  const travelerItems = getTravelerTypeItems(travelerType);
  const durationItems = getDurationItems(nights);
  const plugItems = getPlugItems(plugTypes);

  // Essential items: always-pack + weather + plugs
  const essentialCandidates = [
    ...alwaysPack,
    ...weatherItems,
    ...plugItems,
  ];

  // Nice-to-have: vibe + poi + traveler + duration items
  const niceToHaveCandidates = [
    ...vibeItems,
    ...poiItems,
    ...travelerItems,
    ...durationItems,
  ];

  // Deduplicate by item name (keep first occurrence — usually has best reason)
  const dedup = (items: PackingItem[]): PackingItem[] => {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Also deduplicate across essential and nice-to-have (essentials win)
  const essentials = dedup(essentialCandidates);
  const essentialKeys = new Set(essentials.map(e => e.item.toLowerCase()));
  const niceToHave = dedup(niceToHaveCandidates).filter(
    item => !essentialKeys.has(item.item.toLowerCase())
  );

  return { essentials, niceToHave };
}
