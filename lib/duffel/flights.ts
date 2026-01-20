import { duffel } from './client';
import type {
  FlightSearchParams,
  FlightBookingParams,
  FlightBookingResult,
  NormalizedFlight,
  FlightSlice,
  FlightSegment,
  CabinClass,
} from '@/types/flight';
import { getMockFlights, isFlightMockMode } from './mock-flights';

export async function searchFlights(
  params: FlightSearchParams
): Promise<NormalizedFlight[]> {
  // Use mock data if in mock mode
  if (isFlightMockMode()) {
    console.log('Using mock flight data');
    return getMockFlights(params);
  }

  // Build passengers array for Duffel
  // Adults have type, children/infants have age
  const passengers = params.passengers.map((p) => {
    if (p.type === 'adult') {
      return { type: 'adult' as const };
    } else {
      return { age: p.age || 10 }; // Default age for children
    }
  });

  // Build slices (outbound + optional return)
  const slices: Array<{
    origin: string;
    destination: string;
    departure_date: string;
    arrival_time: null;
    departure_time: null;
  }> = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
      arrival_time: null,
      departure_time: null,
    },
  ];

  // Add return slice for round trips
  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
      arrival_time: null,
      departure_time: null,
    });
  }

  // Create offer request
  const offerRequest = await duffel.offerRequests.create({
    slices,
    passengers,
    cabin_class: mapCabinClass(params.cabinClass),
    max_connections: (params.maxConnections ?? 1) as 0 | 1 | 2,
  });

  // Get offers from the request
  const offers = await duffel.offers.list({
    offer_request_id: offerRequest.data.id,
    sort: 'total_amount',
    max_connections: params.maxConnections ?? 1,
  });

  // Normalize offers to our format
  let flights = offers.data.map(normalizeOffer);

  // Filter by budget if specified
  if (params.budget?.max) {
    flights = flights.filter(
      (f) => f.pricing.perPassenger <= (params.budget?.max || Infinity)
    );
  }

  return flights.slice(0, 20); // Return top 20 options
}

export async function createFlightBooking(
  params: FlightBookingParams
): Promise<FlightBookingResult> {
  // For now, return a mock booking response
  // Real Duffel integration requires more complex type handling
  if (isFlightMockMode()) {
    return {
      id: `ord_mock_${Math.random().toString(36).slice(2, 11)}`,
      bookingReference: `HN${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'confirmed',
      flights: {} as any, // Would be populated from the offer
      passengers: params.passengers,
      totalAmount: 0,
      currency: 'USD',
      ticketedAt: new Date().toISOString(),
    };
  }

  // Build passengers array for Duffel order
  const passengers = params.passengers.map((p, index) => ({
    id: `pas_${index}`,
    type: p.type,
    title: 'mr' as const, // Required field
    given_name: p.givenName,
    family_name: p.familyName,
    born_on: p.dateOfBirth,
    email: p.email,
    phone_number: p.phone,
    gender: (p.gender === 'male' ? 'm' : p.gender === 'female' ? 'f' : 'm') as 'm' | 'f',
    ...(p.passportNumber && {
      identity_documents: [
        {
          type: 'passport' as const,
          unique_identifier: p.passportNumber,
          expires_on: p.passportExpiry,
          issuing_country_code: p.nationality,
        },
      ],
    }),
  }));

  // Build payment object
  const payment: { type: 'balance' } | { type: 'card'; card_id: string } =
    params.payment.type === 'balance'
      ? { type: 'balance' }
      : { type: 'card', card_id: params.payment.cardToken! };

  // Create the order
  const order = await duffel.orders.create({
    selected_offers: [params.offerId],
    passengers: passengers as any,
    type: 'instant',
    payments: [
      {
        ...payment,
        amount: '0', // Will be filled by Duffel
        currency: 'USD',
      } as any,
    ],
  });

  const orderData = order.data;

  return {
    id: orderData.id,
    bookingReference: orderData.booking_reference,
    status: mapOrderStatus(orderData.booking_reference ? 'confirmed' : 'pending'),
    flights: normalizeOffer(orderData as any), // Order has similar structure to offer
    passengers: params.passengers,
    totalAmount: parseFloat(orderData.total_amount),
    currency: orderData.total_currency,
    ticketedAt: orderData.created_at,
  };
}

export async function getFlightBooking(orderId: string): Promise<any> {
  const order = await duffel.orders.get(orderId);
  return order.data;
}

function normalizeOffer(offer: any): NormalizedFlight {
  const slices: FlightSlice[] = (offer.slices || []).map((slice: any) => ({
    id: slice.id,
    origin: slice.origin?.iata_code || slice.origin,
    destination: slice.destination?.iata_code || slice.destination,
    departureTime: slice.segments?.[0]?.departing_at,
    arrivalTime: slice.segments?.[slice.segments.length - 1]?.arriving_at,
    duration: slice.duration,
    segments: (slice.segments || []).map(normalizeSegment),
    stops: (slice.segments?.length || 1) - 1,
  }));

  // Collect unique airlines
  const airlinesMap = new Map<string, { code: string; name: string; logoUrl?: string }>();
  slices.forEach((slice) => {
    slice.segments.forEach((seg) => {
      if (!airlinesMap.has(seg.airline.code)) {
        airlinesMap.set(seg.airline.code, seg.airline);
      }
    });
  });

  // Count passengers by type
  const passengerCounts = new Map<string, number>();
  (offer.passengers || []).forEach((p: any) => {
    const type = p.type || 'adult';
    passengerCounts.set(type, (passengerCounts.get(type) || 0) + 1);
  });

  const totalPassengers = offer.passengers?.length || 1;
  const totalAmount = parseFloat(offer.total_amount || '0');

  return {
    id: offer.id,
    duffelOfferId: offer.id,
    slices,
    passengers: Array.from(passengerCounts.entries()).map(([type, count]) => ({
      type: type as any,
      count,
    })),
    pricing: {
      totalAmount,
      currency: offer.total_currency || 'USD',
      perPassenger: totalAmount / totalPassengers,
    },
    cabinClass: offer.cabin_class || 'economy',
    airlines: Array.from(airlinesMap.values()),
    restrictions: {
      changeable: offer.conditions?.change_before_departure?.allowed ?? false,
      refundable: offer.conditions?.refund_before_departure?.allowed ?? false,
      changesFee: offer.conditions?.change_before_departure?.penalty_amount
        ? parseFloat(offer.conditions.change_before_departure.penalty_amount)
        : undefined,
      cancellationFee: offer.conditions?.refund_before_departure?.penalty_amount
        ? parseFloat(offer.conditions.refund_before_departure.penalty_amount)
        : undefined,
    },
    baggageAllowance: {
      carryOn: true,
      checkedBags: offer.passengers?.[0]?.baggages?.filter(
        (b: any) => b.type === 'checked'
      ).length || 0,
    },
    expiresAt: offer.expires_at,
  };
}

function normalizeSegment(segment: any): FlightSegment {
  return {
    id: segment.id,
    departureAirport: {
      code: segment.origin?.iata_code || '',
      name: segment.origin?.name || '',
      city: segment.origin?.city_name || segment.origin?.city?.name || '',
    },
    arrivalAirport: {
      code: segment.destination?.iata_code || '',
      name: segment.destination?.name || '',
      city: segment.destination?.city_name || segment.destination?.city?.name || '',
    },
    departureTime: segment.departing_at,
    arrivalTime: segment.arriving_at,
    duration: segment.duration,
    flightNumber: `${segment.operating_carrier?.iata_code || segment.marketing_carrier?.iata_code || ''}${segment.operating_carrier_flight_number || segment.marketing_carrier_flight_number || ''}`,
    airline: {
      code: segment.operating_carrier?.iata_code || segment.marketing_carrier?.iata_code || '',
      name: segment.operating_carrier?.name || segment.marketing_carrier?.name || '',
      logoUrl: segment.operating_carrier?.logo_symbol_url || segment.marketing_carrier?.logo_symbol_url,
    },
    aircraft: segment.aircraft?.name,
    cabinClass: segment.passengers?.[0]?.cabin_class || 'economy',
  };
}

function mapCabinClass(cabin?: CabinClass): 'economy' | 'premium_economy' | 'business' | 'first' {
  switch (cabin) {
    case 'first':
      return 'first';
    case 'business':
      return 'business';
    case 'premium_economy':
      return 'premium_economy';
    case 'economy':
    default:
      return 'economy';
  }
}

function mapOrderStatus(status: string): 'pending' | 'confirmed' | 'cancelled' | 'ticketed' {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'booked':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'ticketed':
      return 'ticketed';
    default:
      return 'pending';
  }
}
