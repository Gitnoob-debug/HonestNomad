import type { BookingStatus } from './booking';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Profile, 'id' | 'createdAt'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Conversation, 'id' | 'createdAt'>>;
      };
      messages: {
        Row: DbMessage;
        Insert: Omit<DbMessage, 'id' | 'createdAt'>;
        Update: Partial<Omit<DbMessage, 'id' | 'createdAt'>>;
      };
      bookings: {
        Row: DbBooking;
        Insert: Omit<DbBooking, 'id' | 'createdAt'>;
        Update: Partial<Omit<DbBooking, 'id' | 'createdAt'>>;
      };
      itineraries: {
        Row: DbItinerary;
        Insert: Omit<DbItinerary, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<DbItinerary, 'id' | 'createdAt'>>;
      };
      search_logs: {
        Row: SearchLog;
        Insert: Omit<SearchLog, 'id' | 'createdAt'>;
        Update: never;
      };
    };
  };
}

export interface Profile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  email?: string;
  phone?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultCurrency?: string;
  budgetRange?: {
    min?: number;
    max?: number;
  };
  preferredAmenities?: string[];
  travelerType?: string;
  dietaryRestrictions?: string[];
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  userId?: string;
  state: DbConversationState;
  preferences: ConversationPreferences;
  lastSearchResults: any[];
  userAgent?: string;
  ipCountry?: string;
}

export interface DbConversationState {
  stage: 'gathering_info' | 'showing_results' | 'booking' | 'complete';
  selectedHotelId?: string;
  guestDetails?: {
    givenName: string;
    familyName: string;
    email: string;
    phone?: string;
  };
}

export interface ConversationPreferences {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  guests?: number;
  rooms?: number;
  vibe?: string[];
  requirements?: string[];
  locationPreference?: string;
}

export interface DbMessage {
  id: string;
  conversationId: string;
  createdAt: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  inputTokens?: number;
  outputTokens?: number;
}

export interface DbBooking {
  id: string;
  conversationId: string;
  createdAt: string;
  duffelBookingId: string;
  duffelOrderId?: string;
  hotelName: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomType?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  totalAmount: number;
  currency: string;
  commissionAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  duffelResponse?: any;
  itinerary?: any;
}

export interface DbItinerary {
  id: string;
  conversationId?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
  destination: string;
  startDate: string;
  endDate: string;
  content: any;
  userEdits: any[];
  preferencesUsed: any;
  generationModel: string;
}

export interface SearchLog {
  id: string;
  conversationId?: string;
  createdAt: string;
  searchParams: any;
  resultsCount: number;
  minPrice?: number;
  maxPrice?: number;
  responseTimeMs: number;
  rawResponse?: any;
}
