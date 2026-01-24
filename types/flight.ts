// Flight-related type definitions

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type PassengerType = 'adult' | 'child' | 'infant_without_seat';

export interface Passenger {
  type: PassengerType;
  age?: number;
}

export interface FlightSearchParams {
  origin: string; // Airport code (e.g., 'JFK') or city name
  destination: string; // Airport code or city name
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD for round trips
  passengers: Passenger[];
  cabinClass?: CabinClass;
  budget?: {
    max?: number;
    currency?: string;
  };
  maxConnections?: number;
}

export interface FlightSegment {
  id: string;
  departureAirport: {
    code: string;
    name: string;
    city: string;
  };
  arrivalAirport: {
    code: string;
    name: string;
    city: string;
  };
  departureTerminal?: string;
  arrivalTerminal?: string;
  departureTime: string; // ISO 8601
  arrivalTime: string; // ISO 8601
  duration: string; // ISO 8601 duration (e.g., PT2H30M)
  flightNumber: string;
  airline: {
    code: string;
    name: string;
    logoUrl?: string;
  };
  marketingCarrier?: {
    code: string;
    name: string;
    flightNumber: string;
  };
  aircraft?: string;
  cabinClass: CabinClass;
  cabinClassMarketingName?: string;
  // Amenities
  wifi?: {
    available: boolean;
    cost?: string;
  };
  power?: {
    available: boolean;
    types?: string[];
  };
  seatPitch?: string;
}

export interface FlightSlice {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  segments: FlightSegment[];
  stops: number;
  fareBrandName?: string;
}

export interface NormalizedFlight {
  id: string;
  duffelOfferId: string;
  slices: FlightSlice[];
  passengers: {
    type: PassengerType;
    count: number;
  }[];
  pricing: {
    totalAmount: number;
    currency: string;
    perPassenger: number;
  };
  cabinClass: CabinClass;
  airlines: {
    code: string;
    name: string;
    logoUrl?: string;
  }[];
  restrictions: {
    changeable: boolean;
    refundable: boolean;
    changesFee?: number;
    cancellationFee?: number;
  };
  baggageAllowance?: {
    carryOn: boolean;
    checkedBags: number;
    checkedBagWeightKg?: number;
  };
  totalEmissionsKg?: number;
  expiresAt?: string;
}

export interface LoyaltyProgramAccount {
  airlineIataCode: string;  // e.g., "AA", "UA", "DL"
  accountNumber: string;
}

export interface FlightBookingPassenger {
  type: PassengerType;
  givenName: string;
  familyName: string;
  dateOfBirth: string; // YYYY-MM-DD
  email?: string;
  phone?: string;
  gender?: 'male' | 'female';
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  loyaltyProgramAccounts?: LoyaltyProgramAccount[];  // Frequent flyer numbers
}

export interface FlightBookingParams {
  offerId: string;
  passengers: FlightBookingPassenger[];
  payment: {
    type: 'card' | 'balance';
    cardToken?: string;
  };
}

export interface FlightBookingResult {
  id: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'ticketed';
  flights: NormalizedFlight;
  passengers: FlightBookingPassenger[];
  totalAmount: number;
  currency: string;
  ticketedAt?: string;
}

// TripSearchParams is now defined in @/types/trip
