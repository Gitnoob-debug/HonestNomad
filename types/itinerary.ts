export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  duration: string;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: ItineraryCategory;
  costEstimate?: string;
  bookingRequired?: boolean;
  bookingUrl?: string;
  completed?: boolean;
}

export type ItineraryCategory =
  | 'transport'
  | 'activity'
  | 'food'
  | 'rest'
  | 'checkin'
  | 'checkout';

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  theme: string;
  items: ItineraryItem[];
  weatherNote?: string;
}

export interface Itinerary {
  id: string;
  destination: string;
  hotel: {
    name: string;
    neighborhood: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  dates: {
    start: string;
    end: string;
    nights: number;
  };
  days: ItineraryDay[];
  packingTips: string[];
  localTips: string[];
  emergencyInfo: {
    embassy?: string;
    emergencyNumber: string;
    hospitalNearby?: string;
  };
  generatedAt: string;
}

export interface ItineraryGenerateParams {
  hotelName: string;
  hotelNeighborhood: string;
  hotelLat: number;
  hotelLng: number;
  destination: string;
  checkIn: string;
  checkOut: string;
  travelerType?: string;
  interests?: string[];
  pace?: 'relaxed' | 'moderate' | 'packed';
  budgetLevel?: 'budget' | 'moderate' | 'luxury';
}
