import type { CabinClass, PassengerType } from './flight';

export interface ParsedIntent {
  intent: IntentType;
  message: string;
  extractedParams: ExtractedParams;
  missingRequired: string[];
  readyToSearch: boolean;
  selectedHotelId?: string;
  selectedFlightId?: string;
  action: IntentAction;
}

export type IntentType =
  | 'search'
  | 'search_hotels'
  | 'search_flights'
  | 'search_trip' // Combined hotel + flight
  | 'clarify'
  | 'select'
  | 'select_flight'
  | 'book'
  | 'book_flight'
  | 'plan_trip'
  | 'info'
  | 'other';

export type IntentAction =
  | 'search'
  | 'search_hotels'
  | 'search_flights'
  | 'search_trip'
  | 'show_results'
  | 'show_flights'
  | 'ask_clarification'
  | 'collect_guest_info'
  | 'collect_passenger_info'
  | 'confirm_booking'
  | 'confirm_flight_booking'
  | 'generate_itinerary'
  | null;

export interface ExtractedParams {
  // Common
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  currency?: string;
  preferences?: string[];
  travelerType?: string;

  // Hotel-specific
  guests?: number;
  rooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  neighborhood?: string;

  // Flight-specific
  origin?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  passengerTypes?: { type: PassengerType; count: number }[];
  cabinClass?: CabinClass;
  flightBudgetMax?: number;

  // Trip type
  tripType?: 'one_way' | 'round_trip' | 'hotel_only' | 'flight_only' | 'flight_and_hotel';
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  stage?: string;
  preferences?: ExtractedParams;
  lastSearchResultsCount?: number;
  selectedHotelId?: string;
}
