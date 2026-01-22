import type { TransferInfo } from '@/types/flash';

// Hub airport definitions - major international airports that serve as connection points
export const MAJOR_HUBS = {
  // North America
  US_WEST: ['LAX', 'SFO', 'SEA', 'DEN', 'PHX', 'LAS'],
  US_CENTRAL: ['ORD', 'DFW', 'IAH', 'MSP', 'DTW'],
  US_EAST: ['JFK', 'ATL', 'MIA', 'BOS', 'PHL', 'DCA', 'IAD'],
  CANADA: ['YYZ', 'YVR', 'YUL', 'YYC'],
  MEXICO: ['MEX', 'CUN', 'GDL'],

  // Europe
  WESTERN_EUROPE: ['LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'BCN'],
  CENTRAL_EUROPE: ['MUC', 'VIE', 'ZRH', 'BRU'],
  SOUTHERN_EUROPE: ['FCO', 'MXP', 'LIS'],
  NORTHERN_EUROPE: ['CPH', 'ARN', 'OSL', 'HEL'],
  EASTERN_EUROPE: ['WAW', 'PRG', 'BUD'],

  // Asia
  EAST_ASIA: ['NRT', 'HND', 'ICN', 'PEK', 'PVG', 'HKG'],
  SOUTHEAST_ASIA: ['SIN', 'BKK', 'KUL'],
  SOUTH_ASIA: ['DEL', 'BOM'],
  MIDDLE_EAST: ['DXB', 'DOH', 'AUH', 'IST'],

  // Oceania
  AUSTRALIA_NZ: ['SYD', 'MEL', 'AKL'],

  // Africa
  AFRICA: ['JNB', 'CAI', 'ADD', 'NBO'],

  // South America
  SOUTH_AMERICA: ['GRU', 'EZE', 'BOG', 'SCL', 'LIM'],
};

// Transfer info for remote destinations (>2 hours from their airport)
// This maps destination IDs to their transfer info
export const REMOTE_DESTINATION_TRANSFERS: Record<string, TransferInfo> = {
  // ===================
  // USA - REMOTE DESTINATIONS
  // ===================

  // California
  'big-sur': {
    hubAirportCode: 'SFO',
    hubCity: 'San Francisco',
    groundTransferMinutes: 180, // 3 hours
    transferType: 'drive',
    transferNote: 'Scenic Highway 1 coastal drive'
  },
  'joshua-tree': {
    hubAirportCode: 'LAX',
    hubCity: 'Los Angeles',
    groundTransferMinutes: 150, // 2.5 hours
    transferType: 'drive',
    transferNote: 'Desert highway through Palm Springs area'
  },
  'palm-springs': {
    hubAirportCode: 'LAX',
    hubCity: 'Los Angeles',
    groundTransferMinutes: 120, // 2 hours
    transferType: 'drive',
  },
  'napa-valley': {
    hubAirportCode: 'SFO',
    hubCity: 'San Francisco',
    groundTransferMinutes: 90, // 1.5 hours (note: under 2hr but useful to show)
    transferType: 'drive',
    transferNote: 'Wine country drive through scenic valleys'
  },
  'yosemite': {
    hubAirportCode: 'SFO',
    hubCity: 'San Francisco',
    groundTransferMinutes: 210, // 3.5 hours
    transferType: 'drive',
    transferNote: 'Mountain road through Sierra Nevada foothills'
  },
  'lake-tahoe': {
    hubAirportCode: 'SFO',
    hubCity: 'San Francisco',
    groundTransferMinutes: 210, // 3.5 hours
    transferType: 'drive',
  },
  'carmel': {
    hubAirportCode: 'SFO',
    hubCity: 'San Francisco',
    groundTransferMinutes: 150, // 2.5 hours
    transferType: 'drive',
    transferNote: 'Coastal highway drive'
  },
  'santa-barbara': {
    hubAirportCode: 'LAX',
    hubCity: 'Los Angeles',
    groundTransferMinutes: 120, // 2 hours
    transferType: 'drive',
    transferNote: 'Pacific Coast Highway route available'
  },

  // Arizona
  'sedona': {
    hubAirportCode: 'PHX',
    hubCity: 'Phoenix',
    groundTransferMinutes: 120, // 2 hours
    transferType: 'drive',
    transferNote: 'Scenic red rock drive through Verde Valley'
  },
  'grand-canyon': {
    hubAirportCode: 'PHX',
    hubCity: 'Phoenix',
    groundTransferMinutes: 240, // 4 hours
    transferType: 'drive',
    transferNote: 'High desert drive to South Rim'
  },
  'page': {
    hubAirportCode: 'PHX',
    hubCity: 'Phoenix',
    groundTransferMinutes: 270, // 4.5 hours
    transferType: 'drive',
    transferNote: 'Gateway to Antelope Canyon and Horseshoe Bend'
  },

  // Utah
  'moab': {
    hubAirportCode: 'SLC',
    hubCity: 'Salt Lake City',
    groundTransferMinutes: 240, // 4 hours
    transferType: 'drive',
    transferNote: 'Gateway to Arches and Canyonlands National Parks'
  },
  'zion': {
    hubAirportCode: 'LAS',
    hubCity: 'Las Vegas',
    groundTransferMinutes: 165, // 2.75 hours
    transferType: 'drive',
    transferNote: 'Desert drive to Zion National Park'
  },
  'bryce-canyon': {
    hubAirportCode: 'LAS',
    hubCity: 'Las Vegas',
    groundTransferMinutes: 255, // 4.25 hours
    transferType: 'drive',
  },

  // Colorado
  'aspen': {
    hubAirportCode: 'DEN',
    hubCity: 'Denver',
    groundTransferMinutes: 210, // 3.5 hours
    transferType: 'drive',
    transferNote: 'Mountain pass drive through Rocky Mountains'
  },
  'vail': {
    hubAirportCode: 'DEN',
    hubCity: 'Denver',
    groundTransferMinutes: 120, // 2 hours
    transferType: 'drive',
    transferNote: 'Interstate 70 through mountains'
  },
  'telluride': {
    hubAirportCode: 'DEN',
    hubCity: 'Denver',
    groundTransferMinutes: 330, // 5.5 hours
    transferType: 'drive',
    transferNote: 'Scenic mountain drive or 45-min connecting flight'
  },

  // Montana/Wyoming
  'jackson-hole': {
    hubAirportCode: 'SLC',
    hubCity: 'Salt Lake City',
    groundTransferMinutes: 300, // 5 hours
    transferType: 'drive',
    transferNote: 'Gateway to Grand Teton and Yellowstone'
  },
  'yellowstone': {
    hubAirportCode: 'SLC',
    hubCity: 'Salt Lake City',
    groundTransferMinutes: 330, // 5.5 hours
    transferType: 'drive',
    transferNote: 'Jackson Hole Airport is closer (seasonal)'
  },

  // Pacific Northwest
  'olympic-national-park': {
    hubAirportCode: 'SEA',
    hubCity: 'Seattle',
    groundTransferMinutes: 150, // 2.5 hours
    transferType: 'drive',
    transferNote: 'Ferry crossing may be required'
  },

  // New England
  'acadia': {
    hubAirportCode: 'BOS',
    hubCity: 'Boston',
    groundTransferMinutes: 270, // 4.5 hours
    transferType: 'drive',
    transferNote: 'Coastal New England drive to Bar Harbor'
  },
  'nantucket': {
    hubAirportCode: 'BOS',
    hubCity: 'Boston',
    groundTransferMinutes: 150, // 2.5 hours total
    transferType: 'ferry',
    transferNote: 'Drive to Hyannis + 1hr fast ferry'
  },
  'martha-vineyard': {
    hubAirportCode: 'BOS',
    hubCity: 'Boston',
    groundTransferMinutes: 135, // 2.25 hours
    transferType: 'ferry',
    transferNote: 'Drive to Woods Hole + 45-min ferry'
  },

  // Florida Keys
  'key-west': {
    hubAirportCode: 'MIA',
    hubCity: 'Miami',
    groundTransferMinutes: 210, // 3.5 hours
    transferType: 'drive',
    transferNote: 'Iconic Overseas Highway across the Keys'
  },

  // ===================
  // EUROPE - REMOTE DESTINATIONS
  // ===================

  // Italy
  'amalfi': {
    hubAirportCode: 'NAP',
    hubCity: 'Naples',
    groundTransferMinutes: 90, // 1.5 hours
    transferType: 'drive',
    transferNote: 'Winding coastal road with stunning views'
  },
  'cinque-terre': {
    hubAirportCode: 'GOA',
    hubCity: 'Genoa',
    groundTransferMinutes: 90, // 1.5 hours (or train)
    transferType: 'train',
    transferNote: 'Scenic train along the coast'
  },
  'lake-como': {
    hubAirportCode: 'MXP',
    hubCity: 'Milan',
    groundTransferMinutes: 75, // 1.25 hours
    transferType: 'drive',
  },

  // France
  'provence': {
    hubAirportCode: 'MRS',
    hubCity: 'Marseille',
    groundTransferMinutes: 75, // 1.25 hours
    transferType: 'drive',
    transferNote: 'Lavender fields and hilltop villages'
  },
  'french-riviera': {
    hubAirportCode: 'NCE',
    hubCity: 'Nice',
    groundTransferMinutes: 30, // Close to airport
    transferType: 'drive',
  },
  'mont-saint-michel': {
    hubAirportCode: 'CDG',
    hubCity: 'Paris',
    groundTransferMinutes: 240, // 4 hours
    transferType: 'train',
    transferNote: 'TGV to Rennes + shuttle to island'
  },

  // UK
  'scottish-highlands': {
    hubAirportCode: 'EDI',
    hubCity: 'Edinburgh',
    groundTransferMinutes: 180, // 3 hours
    transferType: 'drive',
    transferNote: 'Dramatic Highland scenery'
  },
  'lake-district': {
    hubAirportCode: 'MAN',
    hubCity: 'Manchester',
    groundTransferMinutes: 105, // 1.75 hours
    transferType: 'drive',
  },
  'cotswolds': {
    hubAirportCode: 'LHR',
    hubCity: 'London',
    groundTransferMinutes: 105, // 1.75 hours
    transferType: 'drive',
    transferNote: 'Quintessential English countryside'
  },

  // Spain
  'ibiza': {
    hubAirportCode: 'BCN',
    hubCity: 'Barcelona',
    groundTransferMinutes: 50, // Short flight
    transferType: 'connecting_flight',
  },
  'san-sebastian': {
    hubAirportCode: 'BIO',
    hubCity: 'Bilbao',
    groundTransferMinutes: 75, // 1.25 hours
    transferType: 'drive',
    transferNote: 'Basque Country coastal drive'
  },

  // Greece
  'mykonos': {
    hubAirportCode: 'ATH',
    hubCity: 'Athens',
    groundTransferMinutes: 45, // Short flight
    transferType: 'connecting_flight',
    transferNote: 'Or 5-hour ferry'
  },
  'santorini': {
    hubAirportCode: 'ATH',
    hubCity: 'Athens',
    groundTransferMinutes: 50, // Short flight
    transferType: 'connecting_flight',
    transferNote: 'Or 8-hour ferry'
  },
  'crete': {
    hubAirportCode: 'ATH',
    hubCity: 'Athens',
    groundTransferMinutes: 55, // Short flight to HER
    transferType: 'connecting_flight',
  },

  // Croatia
  'hvar': {
    hubAirportCode: 'SPU',
    hubCity: 'Split',
    groundTransferMinutes: 75, // 1+ hour ferry
    transferType: 'ferry',
  },

  // Portugal
  'algarve': {
    hubAirportCode: 'FAO',
    hubCity: 'Faro',
    groundTransferMinutes: 60, // Within region
    transferType: 'drive',
    transferNote: 'Southern Portugal beach coast'
  },
  'madeira': {
    hubAirportCode: 'LIS',
    hubCity: 'Lisbon',
    groundTransferMinutes: 95, // 1.5 hour flight
    transferType: 'connecting_flight',
  },

  // ===================
  // CARIBBEAN / CENTRAL AMERICA
  // ===================

  'turks-and-caicos': {
    hubAirportCode: 'MIA',
    hubCity: 'Miami',
    groundTransferMinutes: 75, // Flight time
    transferType: 'connecting_flight',
  },
  'st-barts': {
    hubAirportCode: 'SXM',
    hubCity: 'St. Maarten',
    groundTransferMinutes: 15, // Quick hop
    transferType: 'connecting_flight',
    transferNote: 'Small prop plane or ferry from St. Maarten'
  },

  // ===================
  // ASIA / PACIFIC
  // ===================

  // Thailand
  'koh-samui': {
    hubAirportCode: 'BKK',
    hubCity: 'Bangkok',
    groundTransferMinutes: 70, // 1+ hour flight
    transferType: 'connecting_flight',
  },
  'krabi': {
    hubAirportCode: 'BKK',
    hubCity: 'Bangkok',
    groundTransferMinutes: 80, // 1.25 hour flight
    transferType: 'connecting_flight',
    transferNote: 'Gateway to Phi Phi Islands and Railay Beach'
  },
  'chiang-mai': {
    hubAirportCode: 'BKK',
    hubCity: 'Bangkok',
    groundTransferMinutes: 70, // 1+ hour flight
    transferType: 'connecting_flight',
  },

  // Indonesia
  'gili-islands': {
    hubAirportCode: 'DPS',
    hubCity: 'Bali (Denpasar)',
    groundTransferMinutes: 120, // Fast boat
    transferType: 'ferry',
    transferNote: 'Fast boat from Bali'
  },
  'komodo': {
    hubAirportCode: 'DPS',
    hubCity: 'Bali (Denpasar)',
    groundTransferMinutes: 90, // Flight to Labuan Bajo
    transferType: 'connecting_flight',
  },

  // Vietnam
  'ha-long-bay': {
    hubAirportCode: 'HAN',
    hubCity: 'Hanoi',
    groundTransferMinutes: 150, // 2.5 hours
    transferType: 'drive',
    transferNote: 'Most visitors stay overnight on boats'
  },
  'hoi-an': {
    hubAirportCode: 'DAD',
    hubCity: 'Da Nang',
    groundTransferMinutes: 40,
    transferType: 'drive',
  },

  // Japan
  'hakone': {
    hubAirportCode: 'NRT',
    hubCity: 'Tokyo',
    groundTransferMinutes: 120, // 2 hours by train
    transferType: 'train',
    transferNote: 'Mt. Fuji views and hot springs'
  },
  'nara': {
    hubAirportCode: 'KIX',
    hubCity: 'Osaka',
    groundTransferMinutes: 60,
    transferType: 'train',
    transferNote: 'Famous for friendly deer in parks'
  },

  // Australia
  'great-barrier-reef': {
    hubAirportCode: 'SYD',
    hubCity: 'Sydney',
    groundTransferMinutes: 160, // Flight to Cairns
    transferType: 'connecting_flight',
    transferNote: 'Fly to Cairns for reef access'
  },
  'uluru': {
    hubAirportCode: 'SYD',
    hubCity: 'Sydney',
    groundTransferMinutes: 200, // Flight to Ayers Rock
    transferType: 'connecting_flight',
    transferNote: 'Direct flights from Sydney/Melbourne'
  },

  // New Zealand
  'queenstown': {
    hubAirportCode: 'AKL',
    hubCity: 'Auckland',
    groundTransferMinutes: 110, // 2 hour flight
    transferType: 'connecting_flight',
    transferNote: 'Adventure capital of NZ'
  },
  'milford-sound': {
    hubAirportCode: 'ZQN',
    hubCity: 'Queenstown',
    groundTransferMinutes: 240, // 4 hour scenic drive
    transferType: 'drive',
    transferNote: 'One of the most scenic drives in the world'
  },
};

// Helper function to get transfer info for a destination
export function getTransferInfo(destinationId: string): TransferInfo | undefined {
  return REMOTE_DESTINATION_TRANSFERS[destinationId];
}

// Check if destination is remote (has transfer info)
export function isRemoteDestination(destinationId: string): boolean {
  return destinationId in REMOTE_DESTINATION_TRANSFERS;
}

// Get formatted transfer time string
export function formatTransferTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}
