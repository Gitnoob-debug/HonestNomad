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
  // joshua-tree: Removed - destination doesn't exist in database (referenced in palm-springs highlights)
  'palm-springs': {
    hubAirportCode: 'LAX',
    hubCity: 'Los Angeles',
    groundTransferMinutes: 120, // 2 hours
    transferType: 'drive',
  },
  // napa-valley: Removed - 90min drive under 2hr threshold
  // yosemite: Removed - destination doesn't exist in database
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
  // page: Removed - destination doesn't exist in database (Antelope Canyon area)

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
  // bryce-canyon: Removed - destination doesn't exist in database

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
  // telluride: Removed - destination doesn't exist in database

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
  // olympic-national-park: Removed - destination doesn't exist in database

  // New England
  // acadia: Removed - destination doesn't exist in database
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
  // amalfi: Removed - 90min drive under 2hr threshold
  // cinque-terre: Removed - 90min train under 2hr threshold
  // lake-como: Removed - 75min drive under 2hr threshold

  // France
  // provence: Removed - 75min drive under 2hr threshold
  // french-riviera: Removed - use 'nice' instead (same area)
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
  // lake-district: Removed - 105min drive under 2hr threshold
  // cotswolds: Removed - 105min drive under 2hr threshold

  // Spain
  'ibiza': {
    hubAirportCode: 'BCN',
    hubCity: 'Barcelona',
    groundTransferMinutes: 50, // Short flight
    transferType: 'connecting_flight',
  },
  // san-sebastian: Removed - 75min drive under 2hr threshold

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
  // hvar: Removed - destination doesn't exist in database (Croatian island)

  // Portugal
  // algarve: Removed - destination doesn't exist in database (Portugal coast)
  'madeira': {
    hubAirportCode: 'LIS',
    hubCity: 'Lisbon',
    groundTransferMinutes: 95, // 1.5 hour flight
    transferType: 'connecting_flight',
  },

  // ===================
  // CARIBBEAN / CENTRAL AMERICA
  // ===================

  'turks-caicos': {
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
  // koh-samui: Removed - destination doesn't exist in database (Thai island)
  // krabi: Removed - destination doesn't exist in database (Thai coast)
  'chiang-mai': {
    hubAirportCode: 'BKK',
    hubCity: 'Bangkok',
    groundTransferMinutes: 70, // 1+ hour flight
    transferType: 'connecting_flight',
  },

  // Indonesia
  // gili-islands: Removed - destination doesn't exist in database (Indonesian islands)
  // komodo: Removed - destination doesn't exist in database

  // Vietnam
  // ha-long-bay: Removed - destination doesn't exist (day trip from hanoi)
  // hoi-an: Removed - 40min drive under 2hr threshold

  // Japan
  // hakone: Removed - destination doesn't exist (day trip from tokyo)
  // nara: Removed - destination doesn't exist (day trip from osaka/kyoto)

  // Australia
  'great-barrier-reef': {
    hubAirportCode: 'SYD',
    hubCity: 'Sydney',
    groundTransferMinutes: 160, // Flight to Cairns
    transferType: 'connecting_flight',
    transferNote: 'Fly to Cairns for reef access'
  },
  // uluru: Removed - destination doesn't exist in database

  // New Zealand
  'new-zealand': {
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
