// Trip planning types - bundles hotels and itinerary (flights removed from product)

import type { NormalizedHotel } from './hotel';

export interface TripDestination {
  city: string;
  country?: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
}

export interface TripDay {
  date: string;
  dayNumber: number;
  location: string;
  isTravel: boolean;
  activities: TripActivity[];
  notes?: string;
}

export interface TripActivity {
  id: string;
  time?: string;
  title: string;
  description?: string;
  type: 'check_in' | 'check_out' | 'sightseeing' | 'dining' | 'activity' | 'free_time' | 'transfer';
  location?: string;
  duration?: string;
  cost?: {
    amount: number;
    currency: string;
  };
  bookingRequired?: boolean;
  bookingUrl?: string;
}

export interface TripPricing {
  accommodation: {
    amount: number;
    currency: string;
    perNight: number;
  };
  estimated: {
    activities: number;
    food: number;
    transport: number;
  };
  total: {
    amount: number;
    currency: string;
  };
}

export interface TripPlan {
  id: string;
  status: 'draft' | 'ready' | 'booked' | 'confirmed';
  createdAt: string;
  updatedAt: string;

  // Trip overview
  title: string;
  summary: string;

  // Travel details
  origin: string;
  destinations: TripDestination[];

  // Dates
  startDate: string;
  endDate: string;
  totalNights: number;

  // Travelers
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };

  // Bookings
  accommodation?: NormalizedHotel;

  // Day-by-day itinerary
  itinerary: TripDay[];

  // Pricing
  pricing: TripPricing;

  // AI-generated recommendations
  highlights?: string[];
  tips?: string[];
  weatherInfo?: {
    averageTemp: string;
    conditions: string;
    packingTips: string[];
  };
}

export interface TripSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  preferences?: {
    hotelStars?: number;
    budget?: {
      max: number;
      currency: string;
    };
    interests?: string[];
  };
}

export interface TripPlanGenerationResult {
  tripPlan: TripPlan;
  alternatives?: {
    hotels: NormalizedHotel[];
  };
  messages: string[];
}

// Helper to create empty trip plan structure
export function createEmptyTripPlan(params: TripSearchParams): TripPlan {
  const startDate = new Date(params.departureDate);
  const endDate = new Date(params.returnDate);
  const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: `trip_${Math.random().toString(36).slice(2, 11)}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    title: `Trip to ${params.destination}`,
    summary: '',

    origin: params.origin,
    destinations: [{
      city: params.destination,
      arrivalDate: params.departureDate,
      departureDate: params.returnDate,
      nights: totalNights,
    }],

    startDate: params.departureDate,
    endDate: params.returnDate,
    totalNights,

    travelers: {
      adults: params.travelers.adults,
      children: params.travelers.children || 0,
      infants: params.travelers.infants || 0,
    },

    itinerary: [],

    pricing: {
      accommodation: { amount: 0, currency: 'USD', perNight: 0 },
      estimated: { activities: 0, food: 0, transport: 0 },
      total: { amount: 0, currency: 'USD' },
    },
  };
}

// Helper to calculate total trip cost (hotel-only)
export function calculateTripPricing(
  hotel: NormalizedHotel | undefined,
  nights: number,
  travelers: number
): TripPricing {
  const hotelCost = hotel ? (hotel.pricing.nightlyRate * nights) : 0;

  // Rough estimates for other costs
  const dailyFood = 50 * travelers;
  const dailyActivities = 30 * travelers;
  const dailyTransport = 20 * travelers;

  return {
    accommodation: {
      amount: hotelCost,
      currency: hotel?.pricing.currency || 'USD',
      perNight: hotel?.pricing.nightlyRate || 0,
    },
    estimated: {
      activities: dailyActivities * nights,
      food: dailyFood * nights,
      transport: dailyTransport * nights,
    },
    total: {
      amount: hotelCost + (dailyFood + dailyActivities + dailyTransport) * nights,
      currency: 'USD',
    },
  };
}
