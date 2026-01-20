export interface NormalizedHotel {
  id: string;
  duffelId: string;
  name: string;
  description: string;

  location: {
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };

  rating: {
    stars: number | null;
    reviewScore: number | null;
    reviewCount: number | null;
  };

  photos: Array<{
    url: string;
    caption: string | null;
  }>;

  amenities: string[];

  pricing: {
    totalAmount: number;
    currency: string;
    nightlyRate: number;
  };

  cheapestRateId: string;

  rooms: Room[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  beds: string;
  maxOccupancy: number;
  rates: Rate[];
}

export interface Rate {
  id: string;
  totalAmount: number;
  currency: string;
  cancellationPolicy: CancellationPolicy;
  boardType: BoardType;
}

export type BoardType =
  | 'room_only'
  | 'breakfast'
  | 'half_board'
  | 'full_board'
  | 'all_inclusive';

export interface CancellationPolicy {
  refundable: boolean;
  deadline?: string;
  penaltyAmount?: number;
  penaltyCurrency?: string;
}

export interface HotelSearchParams {
  location: {
    city?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
}

export interface BookingParams {
  rateId: string;
  guests: BookingGuest[];
  payment: {
    type: 'balance' | 'card';
    cardToken?: string;
  };
  specialRequests?: string;
}

export interface BookingGuest {
  givenName: string;
  familyName: string;
  email: string;
  phone?: string;
}

export interface BookingResult {
  id: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  hotel: {
    name: string;
    address: string;
  };
  checkIn: string;
  checkOut: string;
  guests: BookingGuest[];
  totalAmount: string;
  currency: string;
  cancellationPolicy: CancellationPolicy;
}
