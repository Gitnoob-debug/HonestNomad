import type { BookingStatus } from './booking';
import type { FlashVacationPreferences } from './flash';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Profile, 'id' | 'createdAt'>>;
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
      draft_trips: {
        Row: DbDraftTrip;
        Insert: Omit<DbDraftTrip, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<DbDraftTrip, 'id' | 'createdAt'>>;
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
  // Flash Vacation preferences
  flashVacation?: FlashVacationPreferences;
}

export interface DbBooking {
  id: string;
  createdAt: string;
  providerBookingId: string;
  providerOrderId?: string;
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
  status: BookingStatus;
  providerResponse?: any;
  itinerary?: any;
}

export interface DbItinerary {
  id: string;
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

export interface DbDraftTrip {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  tripData: any; // FlashTripPackage JSON
  itinerary?: any;
  itineraryType?: string;
  favorites?: string[];
  favoriteStops?: any[];
  currentStep?: string;
}

export interface SearchLog {
  id: string;
  createdAt: string;
  searchParams: any;
  resultsCount: number;
  minPrice?: number;
  maxPrice?: number;
  responseTimeMs: number;
  rawResponse?: any;
}
