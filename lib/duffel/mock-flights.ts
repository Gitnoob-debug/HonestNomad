// Mock flight data for demo/testing

import type { FlightSearchParams, NormalizedFlight, FlightSlice, FlightSegment } from '@/types/flight';

// Common airport data
const AIRPORTS: Record<string, { code: string; name: string; city: string }> = {
  JFK: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York' },
  LGA: { code: 'LGA', name: 'LaGuardia Airport', city: 'New York' },
  EWR: { code: 'EWR', name: 'Newark Liberty International', city: 'Newark' },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco' },
  ORD: { code: 'ORD', name: "O'Hare International", city: 'Chicago' },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami' },
  BOS: { code: 'BOS', name: 'Boston Logan International', city: 'Boston' },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle' },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas' },
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta' },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver' },
  LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London' },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
  AMS: { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam' },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  FCO: { code: 'FCO', name: 'Leonardo da Vinci Airport', city: 'Rome' },
  BCN: { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona' },
  MAD: { code: 'MAD', name: 'Adolfo Suarez Madrid-Barajas', city: 'Madrid' },
  DXB: { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
  SIN: { code: 'SIN', name: 'Singapore Changi', city: 'Singapore' },
  HND: { code: 'HND', name: 'Tokyo Haneda', city: 'Tokyo' },
  NRT: { code: 'NRT', name: 'Narita International', city: 'Tokyo' },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney' },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto' },
  YVR: { code: 'YVR', name: 'Vancouver International', city: 'Vancouver' },
  MEX: { code: 'MEX', name: 'Mexico City International', city: 'Mexico City' },
  GRU: { code: 'GRU', name: 'Sao Paulo-Guarulhos', city: 'Sao Paulo' },
};

// Common airlines
const AIRLINES = {
  AA: { code: 'AA', name: 'American Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AA.png' },
  UA: { code: 'UA', name: 'United Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/UA.png' },
  DL: { code: 'DL', name: 'Delta Air Lines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/DL.png' },
  WN: { code: 'WN', name: 'Southwest Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/WN.png' },
  B6: { code: 'B6', name: 'JetBlue Airways', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/B6.png' },
  AS: { code: 'AS', name: 'Alaska Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AS.png' },
  BA: { code: 'BA', name: 'British Airways', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/BA.png' },
  AF: { code: 'AF', name: 'Air France', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AF.png' },
  LH: { code: 'LH', name: 'Lufthansa', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/LH.png' },
  EK: { code: 'EK', name: 'Emirates', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/EK.png' },
  SQ: { code: 'SQ', name: 'Singapore Airlines', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/SQ.png' },
  AC: { code: 'AC', name: 'Air Canada', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/AC.png' },
  QF: { code: 'QF', name: 'Qantas', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/QF.png' },
  KL: { code: 'KL', name: 'KLM', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/KL.png' },
  VS: { code: 'VS', name: 'Virgin Atlantic', logoUrl: 'https://www.gstatic.com/flights/airline_logos/70px/VS.png' },
};

// City name to airport code mapping
const CITY_TO_AIRPORT: Record<string, string> = {
  'new york': 'JFK',
  'nyc': 'JFK',
  'los angeles': 'LAX',
  'la': 'LAX',
  'san francisco': 'SFO',
  'sf': 'SFO',
  'chicago': 'ORD',
  'miami': 'MIA',
  'boston': 'BOS',
  'seattle': 'SEA',
  'dallas': 'DFW',
  'atlanta': 'ATL',
  'denver': 'DEN',
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'rome': 'FCO',
  'barcelona': 'BCN',
  'madrid': 'MAD',
  'dubai': 'DXB',
  'singapore': 'SIN',
  'tokyo': 'HND',
  'sydney': 'SYD',
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'mexico city': 'MEX',
  'sao paulo': 'GRU',
};

function resolveAirportCode(input: string): string {
  const normalized = input.toLowerCase().trim();
  // If it's already a 3-letter code
  if (normalized.length === 3 && AIRPORTS[normalized.toUpperCase()]) {
    return normalized.toUpperCase();
  }
  // Try city mapping
  return CITY_TO_AIRPORT[normalized] || 'JFK'; // Default to JFK
}

function getAirport(code: string) {
  return AIRPORTS[code] || { code, name: `${code} Airport`, city: code };
}

function generateFlightNumber(airlineCode: string): string {
  return `${airlineCode}${Math.floor(Math.random() * 9000 + 1000)}`;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `PT${hours}H${mins}M`;
}

function generateMockSegment(
  origin: string,
  destination: string,
  departureTime: Date,
  durationMinutes: number,
  airlineCode: string
): FlightSegment {
  const airline = AIRLINES[airlineCode as keyof typeof AIRLINES] || AIRLINES.AA;
  const arrivalTime = addHours(departureTime, durationMinutes / 60);

  return {
    id: `seg_${Math.random().toString(36).slice(2, 11)}`,
    departureAirport: getAirport(origin),
    arrivalAirport: getAirport(destination),
    departureTime: departureTime.toISOString(),
    arrivalTime: arrivalTime.toISOString(),
    duration: formatDuration(durationMinutes),
    flightNumber: generateFlightNumber(airlineCode),
    airline,
    aircraft: ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300', 'Airbus A350'][Math.floor(Math.random() * 4)],
    cabinClass: 'economy',
  };
}

function generateMockSlice(
  origin: string,
  destination: string,
  date: string,
  stops: number,
  airlines: string[]
): FlightSlice {
  const segments: FlightSegment[] = [];
  const departureDate = new Date(`${date}T${String(6 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}:00`);

  if (stops === 0) {
    // Direct flight
    const duration = 120 + Math.floor(Math.random() * 480); // 2-10 hours
    segments.push(generateMockSegment(origin, destination, departureDate, duration, airlines[0]));
  } else {
    // Connection flight
    const hubs = ['ORD', 'ATL', 'DFW', 'DEN', 'LHR', 'FRA', 'AMS'];
    const hub = hubs[Math.floor(Math.random() * hubs.length)];

    const firstLegDuration = 90 + Math.floor(Math.random() * 180);
    segments.push(generateMockSegment(origin, hub, departureDate, firstLegDuration, airlines[0]));

    const layoverMinutes = 60 + Math.floor(Math.random() * 120);
    const connectionTime = addHours(departureDate, (firstLegDuration + layoverMinutes) / 60);
    const secondLegDuration = 90 + Math.floor(Math.random() * 180);
    segments.push(generateMockSegment(hub, destination, connectionTime, secondLegDuration, airlines[Math.min(1, airlines.length - 1)]));
  }

  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const totalDurationMs = new Date(lastSeg.arrivalTime).getTime() - new Date(firstSeg.departureTime).getTime();
  const totalMinutes = Math.floor(totalDurationMs / (60 * 1000));

  return {
    id: `sli_${Math.random().toString(36).slice(2, 11)}`,
    origin,
    destination,
    departureTime: firstSeg.departureTime,
    arrivalTime: lastSeg.arrivalTime,
    duration: formatDuration(totalMinutes),
    segments,
    stops,
  };
}

export function getMockFlights(params: FlightSearchParams): NormalizedFlight[] {
  const origin = resolveAirportCode(params.origin);
  const destination = resolveAirportCode(params.destination);
  const passengerCount = params.passengers.length || 1;

  const flights: NormalizedFlight[] = [];
  const airlineKeys = Object.keys(AIRLINES);

  // Generate 8-12 flight options
  const numFlights = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < numFlights; i++) {
    const stops = i < 3 ? 0 : (Math.random() > 0.5 ? 1 : 0); // First 3 are direct
    const selectedAirlines = [
      airlineKeys[Math.floor(Math.random() * airlineKeys.length)],
      airlineKeys[Math.floor(Math.random() * airlineKeys.length)],
    ];

    const slices: FlightSlice[] = [];

    // Outbound flight
    slices.push(generateMockSlice(origin, destination, params.departureDate, stops, selectedAirlines));

    // Return flight if round trip
    if (params.returnDate) {
      slices.push(generateMockSlice(destination, origin, params.returnDate, stops, selectedAirlines));
    }

    // Price based on factors
    let basePrice = 150 + Math.floor(Math.random() * 300);
    if (stops === 0) basePrice += 75; // Premium for direct
    if (params.returnDate) basePrice *= 1.8; // Round trip discount from 2x
    if (params.cabinClass === 'business') basePrice *= 3;
    if (params.cabinClass === 'first') basePrice *= 5;

    const totalAmount = basePrice * passengerCount;

    // Collect airlines from slices
    const airlinesSet = new Map();
    slices.forEach(slice => {
      slice.segments.forEach(seg => {
        airlinesSet.set(seg.airline.code, seg.airline);
      });
    });

    flights.push({
      id: `off_mock_${Math.random().toString(36).slice(2, 11)}`,
      duffelOfferId: `off_mock_${Math.random().toString(36).slice(2, 11)}`,
      slices,
      passengers: [{ type: 'adult', count: passengerCount }],
      pricing: {
        totalAmount,
        currency: 'USD',
        perPassenger: Math.round(totalAmount / passengerCount),
      },
      cabinClass: params.cabinClass || 'economy',
      airlines: Array.from(airlinesSet.values()),
      restrictions: {
        changeable: Math.random() > 0.3,
        refundable: Math.random() > 0.6,
        changesFee: Math.random() > 0.5 ? Math.floor(Math.random() * 150) + 50 : undefined,
        cancellationFee: Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 100 : undefined,
      },
      baggageAllowance: {
        carryOn: true,
        checkedBags: Math.random() > 0.3 ? 1 : 0,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Sort by price
  flights.sort((a, b) => a.pricing.totalAmount - b.pricing.totalAmount);

  // Filter by budget
  if (params.budget?.max) {
    return flights.filter(f => f.pricing.perPassenger <= params.budget!.max!);
  }

  return flights;
}

export function isFlightMockMode(): boolean {
  // Default to mock mode until Duffel integration is fully tested
  // Set DUFFEL_FLIGHTS_ENABLED=true to use real API
  return process.env.DUFFEL_FLIGHTS_ENABLED !== 'true';
}
