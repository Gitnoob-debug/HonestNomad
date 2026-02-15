/**
 * Major airport coordinates for geolocation-based nearest-airport detection.
 * ~100 airports covering major international departure points.
 * Used client-side to auto-detect user's nearest departure airport.
 */

export interface AirportInfo {
  code: string;    // IATA code
  city: string;    // Human-readable city name
  lat: number;
  lng: number;
}

// Major international airports with coordinates
// Sorted roughly by passenger volume / importance
export const MAJOR_AIRPORTS: AirportInfo[] = [
  // === North America — East ===
  { code: 'ATL', city: 'Atlanta', lat: 33.6407, lng: -84.4277 },
  { code: 'JFK', city: 'New York', lat: 40.6413, lng: -73.7781 },
  { code: 'EWR', city: 'Newark', lat: 40.6895, lng: -74.1745 },
  { code: 'LGA', city: 'New York LaGuardia', lat: 40.7769, lng: -73.8740 },
  { code: 'MIA', city: 'Miami', lat: 25.7959, lng: -80.2870 },
  { code: 'FLL', city: 'Fort Lauderdale', lat: 26.0742, lng: -80.1506 },
  { code: 'MCO', city: 'Orlando', lat: 28.4312, lng: -81.3081 },
  { code: 'BOS', city: 'Boston', lat: 42.3656, lng: -71.0096 },
  { code: 'PHL', city: 'Philadelphia', lat: 39.8744, lng: -75.2424 },
  { code: 'DCA', city: 'Washington DC', lat: 38.8512, lng: -77.0402 },
  { code: 'IAD', city: 'Washington Dulles', lat: 38.9531, lng: -77.4565 },
  { code: 'CLT', city: 'Charlotte', lat: 35.2140, lng: -80.9431 },
  { code: 'DTW', city: 'Detroit', lat: 42.2124, lng: -83.3534 },
  { code: 'MSP', city: 'Minneapolis', lat: 44.8848, lng: -93.2223 },
  { code: 'TPA', city: 'Tampa', lat: 27.9755, lng: -82.5332 },
  { code: 'BWI', city: 'Baltimore', lat: 39.1754, lng: -76.6684 },
  { code: 'PIT', city: 'Pittsburgh', lat: 40.4957, lng: -80.2413 },
  { code: 'RDU', city: 'Raleigh', lat: 35.8776, lng: -78.7875 },
  { code: 'BNA', city: 'Nashville', lat: 36.1263, lng: -86.6774 },

  // === North America — Central ===
  { code: 'ORD', city: 'Chicago', lat: 41.9742, lng: -87.9073 },
  { code: 'DFW', city: 'Dallas', lat: 32.8998, lng: -97.0403 },
  { code: 'IAH', city: 'Houston', lat: 29.9902, lng: -95.3368 },
  { code: 'DEN', city: 'Denver', lat: 39.8561, lng: -104.6737 },
  { code: 'STL', city: 'St. Louis', lat: 38.7487, lng: -90.3700 },
  { code: 'AUS', city: 'Austin', lat: 30.1975, lng: -97.6664 },
  { code: 'SAT', city: 'San Antonio', lat: 29.5337, lng: -98.4698 },
  { code: 'MSY', city: 'New Orleans', lat: 29.9934, lng: -90.2580 },
  { code: 'MCI', city: 'Kansas City', lat: 39.2976, lng: -94.7139 },

  // === North America — West ===
  { code: 'LAX', city: 'Los Angeles', lat: 33.9425, lng: -118.4081 },
  { code: 'SFO', city: 'San Francisco', lat: 37.6213, lng: -122.3790 },
  { code: 'SEA', city: 'Seattle', lat: 47.4502, lng: -122.3088 },
  { code: 'LAS', city: 'Las Vegas', lat: 36.0840, lng: -115.1537 },
  { code: 'PHX', city: 'Phoenix', lat: 33.4373, lng: -112.0078 },
  { code: 'SAN', city: 'San Diego', lat: 32.7338, lng: -117.1933 },
  { code: 'PDX', city: 'Portland', lat: 45.5898, lng: -122.5951 },
  { code: 'SLC', city: 'Salt Lake City', lat: 40.7884, lng: -111.9778 },
  { code: 'OAK', city: 'Oakland', lat: 37.7213, lng: -122.2208 },
  { code: 'HNL', city: 'Honolulu', lat: 21.3187, lng: -157.9224 },

  // === Canada ===
  { code: 'YYZ', city: 'Toronto', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', city: 'Vancouver', lat: 49.1967, lng: -123.1815 },
  { code: 'YUL', city: 'Montreal', lat: 45.4706, lng: -73.7408 },
  { code: 'YYC', city: 'Calgary', lat: 51.1215, lng: -114.0076 },
  { code: 'YOW', city: 'Ottawa', lat: 45.3225, lng: -75.6692 },

  // === Mexico / Caribbean ===
  { code: 'MEX', city: 'Mexico City', lat: 19.4363, lng: -99.0721 },
  { code: 'CUN', city: 'Cancun', lat: 21.0365, lng: -86.8771 },
  { code: 'GDL', city: 'Guadalajara', lat: 20.5218, lng: -103.3113 },

  // === Europe — West ===
  { code: 'LHR', city: 'London Heathrow', lat: 51.4700, lng: -0.4543 },
  { code: 'LGW', city: 'London Gatwick', lat: 51.1537, lng: -0.1821 },
  { code: 'CDG', city: 'Paris', lat: 49.0097, lng: 2.5479 },
  { code: 'AMS', city: 'Amsterdam', lat: 52.3105, lng: 4.7683 },
  { code: 'FRA', city: 'Frankfurt', lat: 50.0379, lng: 8.5622 },
  { code: 'MAD', city: 'Madrid', lat: 40.4983, lng: -3.5676 },
  { code: 'BCN', city: 'Barcelona', lat: 41.2974, lng: 2.0833 },
  { code: 'MUC', city: 'Munich', lat: 48.3537, lng: 11.7750 },
  { code: 'FCO', city: 'Rome', lat: 41.8003, lng: 12.2389 },
  { code: 'LIS', city: 'Lisbon', lat: 38.7756, lng: -9.1354 },
  { code: 'DUB', city: 'Dublin', lat: 53.4264, lng: -6.2499 },
  { code: 'ZRH', city: 'Zurich', lat: 47.4647, lng: 8.5492 },
  { code: 'BRU', city: 'Brussels', lat: 50.9014, lng: 4.4844 },
  { code: 'MXP', city: 'Milan', lat: 45.6306, lng: 8.7281 },
  { code: 'VIE', city: 'Vienna', lat: 48.1103, lng: 16.5697 },

  // === Europe — North ===
  { code: 'CPH', city: 'Copenhagen', lat: 55.6181, lng: 12.6561 },
  { code: 'ARN', city: 'Stockholm', lat: 59.6519, lng: 17.9186 },
  { code: 'OSL', city: 'Oslo', lat: 60.1939, lng: 11.1004 },
  { code: 'HEL', city: 'Helsinki', lat: 60.3172, lng: 24.9633 },

  // === Europe — East ===
  { code: 'IST', city: 'Istanbul', lat: 41.2753, lng: 28.7519 },
  { code: 'WAW', city: 'Warsaw', lat: 52.1657, lng: 20.9671 },
  { code: 'PRG', city: 'Prague', lat: 50.1008, lng: 14.2600 },
  { code: 'BUD', city: 'Budapest', lat: 47.4298, lng: 19.2611 },
  { code: 'ATH', city: 'Athens', lat: 37.9364, lng: 23.9445 },

  // === Middle East ===
  { code: 'DXB', city: 'Dubai', lat: 25.2532, lng: 55.3657 },
  { code: 'DOH', city: 'Doha', lat: 25.2731, lng: 51.6081 },
  { code: 'AUH', city: 'Abu Dhabi', lat: 24.4331, lng: 54.6511 },
  { code: 'TLV', city: 'Tel Aviv', lat: 32.0055, lng: 34.8854 },

  // === Asia — East ===
  { code: 'NRT', city: 'Tokyo Narita', lat: 35.7720, lng: 140.3929 },
  { code: 'HND', city: 'Tokyo Haneda', lat: 35.5494, lng: 139.7798 },
  { code: 'ICN', city: 'Seoul', lat: 37.4602, lng: 126.4407 },
  { code: 'PEK', city: 'Beijing', lat: 40.0799, lng: 116.6031 },
  { code: 'PVG', city: 'Shanghai', lat: 31.1443, lng: 121.8083 },
  { code: 'HKG', city: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  { code: 'TPE', city: 'Taipei', lat: 25.0797, lng: 121.2342 },

  // === Asia — Southeast ===
  { code: 'SIN', city: 'Singapore', lat: 1.3644, lng: 103.9915 },
  { code: 'BKK', city: 'Bangkok', lat: 13.6900, lng: 100.7501 },
  { code: 'KUL', city: 'Kuala Lumpur', lat: 2.7456, lng: 101.7099 },
  { code: 'CGK', city: 'Jakarta', lat: -6.1256, lng: 106.6558 },
  { code: 'MNL', city: 'Manila', lat: 14.5086, lng: 121.0197 },

  // === Asia — South ===
  { code: 'DEL', city: 'Delhi', lat: 28.5562, lng: 77.1000 },
  { code: 'BOM', city: 'Mumbai', lat: 19.0896, lng: 72.8656 },

  // === Oceania ===
  { code: 'SYD', city: 'Sydney', lat: -33.9461, lng: 151.1772 },
  { code: 'MEL', city: 'Melbourne', lat: -37.6690, lng: 144.8410 },
  { code: 'AKL', city: 'Auckland', lat: -37.0082, lng: 174.7850 },
  { code: 'BNE', city: 'Brisbane', lat: -27.3842, lng: 153.1175 },

  // === Africa ===
  { code: 'JNB', city: 'Johannesburg', lat: -26.1392, lng: 28.2460 },
  { code: 'CPT', city: 'Cape Town', lat: -33.9649, lng: 18.6017 },
  { code: 'CAI', city: 'Cairo', lat: 30.1219, lng: 31.4056 },
  { code: 'NBO', city: 'Nairobi', lat: -1.3192, lng: 36.9278 },
  { code: 'ADD', city: 'Addis Ababa', lat: 8.9779, lng: 38.7993 },
  { code: 'CMN', city: 'Casablanca', lat: 33.3675, lng: -7.5898 },

  // === South America ===
  { code: 'GRU', city: 'São Paulo', lat: -23.4356, lng: -46.4731 },
  { code: 'EZE', city: 'Buenos Aires', lat: -34.8222, lng: -58.5358 },
  { code: 'BOG', city: 'Bogotá', lat: 4.7016, lng: -74.1469 },
  { code: 'SCL', city: 'Santiago', lat: -33.3930, lng: -70.7858 },
  { code: 'LIM', city: 'Lima', lat: -12.0219, lng: -77.1143 },
  { code: 'GIG', city: 'Rio de Janeiro', lat: -22.8100, lng: -43.2505 },
];

/**
 * Find the nearest airport to a given lat/lng using Haversine distance.
 * Returns the closest airport from MAJOR_AIRPORTS.
 */
export function findNearestAirport(lat: number, lng: number): AirportInfo {
  let nearest = MAJOR_AIRPORTS[0];
  let minDist = Infinity;

  for (const airport of MAJOR_AIRPORTS) {
    const dist = haversineDistance(lat, lng, airport.lat, airport.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = airport;
    }
  }

  return nearest;
}

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
