// OpenClaw Agent Integration Types
// All types for the HN Agent layer that sits between OpenClaw and our internal APIs

import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';

// ── Agent Conversation ──────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentChatRequest {
  /** Conversation history (OpenClaw sends full history each time) */
  messages: AgentMessage[];
  /** Optional session ID for continuing a conversation */
  sessionId?: string;
}

export interface AgentChatResponse {
  /** Agent's natural language response */
  response: string;
  /** Image URLs to display (hotel photos, destination images, static maps) */
  images?: AgentImage[];
  /** Booking link when user has selected a hotel */
  bookingLink?: string;
  /** Session ID for conversation continuity */
  sessionId: string;
  /** Structured data for the agent platform to render (optional) */
  structuredData?: AgentStructuredData;
}

export interface AgentImage {
  url: string;
  alt: string;
  type: 'destination' | 'hotel' | 'map';
}

export interface AgentStructuredData {
  /** Current step in the flow */
  step: 'destination_search' | 'destination_results' | 'hotel_search' | 'hotel_results' | 'hotel_selected' | 'booking_ready';
  /** Destination info (when resolved) */
  destination?: {
    city: string;
    country: string;
    vibes: string[];
    highlights: string[];
    dailyCostPerPerson?: number;
  };
  /** Hotel options (when searched) */
  hotels?: AgentHotelSummary[];
  /** Selected hotel (when chosen) */
  selectedHotel?: AgentHotelSummary;
}

/** Lightweight hotel representation for agent responses (not the full HotelOption) */
export interface AgentHotelSummary {
  id: string;
  name: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  walkTime: string | null; // "4 min walk to your spot" or "12 min drive"
  amenities: string[];
  refundable: boolean;
  cancelDeadline?: string;
  chain?: string;
  boardName: string;
  photoUrl: string;
  role: 'closest' | 'budget' | 'high_end' | 'other';
}

// ── Booking Sessions ────────────────────────────────────────────────

export interface BookingSession {
  id: string; // UUID token
  hotel: HotelOption;
  destination: MatchedDestination;
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  guests: {
    adults: number;
    children: number[];
  };
  /** Landmark GPS for walk-time display */
  landmarkLat: number;
  landmarkLng: number;
  /** Source tracking */
  source: 'openclaw' | 'direct';
  /** Token lifecycle */
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (30 min after creation)
  used: boolean;
}

/** What we store in Supabase (JSON-serialized hotel + destination) */
export interface BookingSessionRow {
  id: string;
  hotel_data: string; // JSON
  destination_data: string; // JSON
  checkin: string;
  checkout: string;
  guests_data: string; // JSON
  landmark_lat: number;
  landmark_lng: number;
  source: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

// ── Agent Internal State ────────────────────────────────────────────

export interface AgentConversationState {
  /** Current step in the discovery flow */
  step: 'idle' | 'searching_destination' | 'destination_found' | 'searching_hotels' | 'hotels_found' | 'hotel_selected';
  /** Resolved destination (if any) */
  destination?: MatchedDestination;
  /** Landmark coordinates from destination */
  landmarkLat?: number;
  landmarkLng?: number;
  /** Search parameters */
  checkin?: string;
  checkout?: string;
  guests?: { adults: number; children: number[] };
  /** All hotels from search */
  allHotels?: HotelOption[];
  /** Featured 3 */
  featured?: {
    closest: HotelOption;
    budget: HotelOption;
    highEnd: HotelOption;
  };
  /** Selected hotel */
  selectedHotel?: HotelOption;
  /** Rate expiry timestamp */
  rateExpiresAt?: number;
}

// ── Rate Limiting ───────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfterMs?: number;
}
