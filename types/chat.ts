export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  hotels?: NormalizedHotel[];
  selectedHotelId?: string;
  action?: ChatAction;
  itinerary?: Itinerary;
}

export type ChatAction =
  | 'search'
  | 'show_results'
  | 'ask_clarification'
  | 'collect_guest_info'
  | 'confirm_booking'
  | 'booking_complete'
  | 'generate_itinerary'
  | 'continue';

export interface ConversationState {
  stage: 'gathering_info' | 'showing_results' | 'booking' | 'complete';
  searchParams?: SearchParams;
  selectedHotelId?: string;
  guestDetails?: GuestDetails;
}

export interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  preferences?: string[];
  neighborhood?: string;
}

export interface GuestDetails {
  givenName: string;
  familyName: string;
  email: string;
  phone?: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  conversationId?: string;
  guestDetails?: GuestDetails;
  paymentToken?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  action?: ChatAction;
  hotels?: NormalizedHotel[];
  selectedHotel?: NormalizedHotel;
  booking?: BookingResult;
  itinerary?: Itinerary;
  requiredFields?: string[];
  offerItinerary?: boolean;
}

// Re-export related types
import type { NormalizedHotel, BookingResult } from './hotel';
import type { Itinerary } from './itinerary';
export type { NormalizedHotel, BookingResult, Itinerary };
