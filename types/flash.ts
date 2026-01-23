// Flash Vacation Feature Types

export interface FlashVacationPreferences {
  // Step 1: Travelers
  travelers: TravelerConfig;

  // Step 2: Home Base
  homeBase: HomeBase;

  // Step 3: Budget
  budget: BudgetConfig;

  // Step 4: Accommodation
  accommodation: AccommodationPreferences;

  // Step 5: Travel Style
  travelStyle: TravelStyleConfig;

  // Step 6: Interests
  interests: InterestConfig;

  // Step 7: Restrictions
  restrictions: RestrictionConfig;

  // Step 8: Surprise Tolerance (1-5)
  surpriseTolerance: number;

  // Profile completion status
  profileCompleted: boolean;
  profileCompletedAt?: string;
}

export interface TravelerConfig {
  type: 'solo' | 'couple' | 'family' | 'group';
  adults: number;
  children?: ChildTraveler[];
  infants?: number;
}

export interface ChildTraveler {
  age: number;
}

export interface HomeBase {
  airportCode: string;
  city: string;
  country: string;
}

export interface BudgetConfig {
  perTripMin: number;
  perTripMax: number;
  currency: string;
  flexibility: 'strict' | 'flexible' | 'splurge_ok';
}

export interface AccommodationPreferences {
  minStars: number;
  mustHaveAmenities: string[];
  niceToHaveAmenities: string[];
  roomPreferences: string[];
}

export interface TravelStyleConfig {
  adventureRelaxation: number; // 1=relaxation, 5=adventure
  earlyBirdNightOwl: number;   // 1=early bird, 5=night owl
  plannedSpontaneous: number;  // 1=planned, 5=spontaneous
  pace: 'relaxed' | 'moderate' | 'packed';
}

export interface InterestConfig {
  primary: string[];   // Top 3 interests
  secondary: string[]; // Nice-to-have interests
}

export interface RestrictionConfig {
  dietary: string[];
  allergies: string[];
  accessibility: string[];
  medical: string[];
}

// Wizard step definitions
export type WizardStep =
  | 'travelers'
  | 'homeBase'
  | 'budget'
  | 'accommodation'
  | 'travelStyle'
  | 'interests'
  | 'restrictions'
  | 'surpriseTolerance';

export const WIZARD_STEPS: WizardStep[] = [
  'travelers',
  'homeBase',
  'budget',
  'accommodation',
  'travelStyle',
  'interests',
  'restrictions',
  'surpriseTolerance',
];

export const WIZARD_STEP_TITLES: Record<WizardStep, string> = {
  travelers: 'Who\'s Traveling?',
  homeBase: 'Where Do You Fly From?',
  budget: 'What\'s Your Budget?',
  accommodation: 'Where Do You Stay?',
  travelStyle: 'How Do You Travel?',
  interests: 'What Do You Love?',
  restrictions: 'Any Restrictions?',
  surpriseTolerance: 'Surprise Me?',
};

// Flash Plan generation types
export interface FlashGenerateParams {
  departureDate: string;
  returnDate: string;
  vibe?: string[];
  region?: string;
  count?: number;
  excludeDestinations?: string[]; // For lazy loading - don't repeat cities
}

export interface FlashGenerateResponse {
  sessionId: string;
  trips: FlashTripPackage[];
  generationTime: number;
  diversityScore: number;
}

export interface FlashTripPackage {
  id: string;
  destination: DestinationInfo;
  flight: FlightSummary;
  hotel?: HotelSummary; // Optional - flights-only mode
  itinerary: ItinerarySummary;
  pricing: TripPricing;
  highlights: string[];
  matchScore: number;
  imageUrl: string;
  images?: DestinationImage[];      // Multiple images for carousel
  transferInfo?: TransferInfo;       // For remote destinations
}

export interface DestinationInfo {
  city: string;
  country: string;
  airportCode: string;
  region: string;
  vibes: string[];
  transferInfo?: TransferInfo;       // Transfer info at destination level too
}

export interface FlightSegmentSummary {
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
  departure: {
    time: string;
    airport: {
      code: string;
      name: string;
      city: string;
    };
    terminal?: string;
  };
  arrival: {
    time: string;
    airport: {
      code: string;
      name: string;
      city: string;
    };
    terminal?: string;
  };
  duration: string;
  cabinClass: string;
  cabinClassMarketingName?: string;
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

export interface FlightSliceSummary {
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  segments: FlightSegmentSummary[];
  fareBrandName?: string;
}

export interface FlightSummary {
  offerId: string;
  airline: string;
  airlines: {
    code: string;
    name: string;
    logoUrl?: string;
  }[];
  outbound: FlightSliceSummary;
  return: FlightSliceSummary;
  price: number;
  currency: string;
  cabinClass: string;
  // Baggage info
  baggage: {
    carryOn: boolean;
    checkedBags: number;
    checkedBagWeightKg?: number;
  };
  // Fare conditions
  conditions: {
    changeable: boolean;
    refundable: boolean;
    changesFee?: number;
    cancellationFee?: number;
  };
  // Optional extras
  co2EmissionsKg?: number;
  expiresAt?: string;
}

export interface HotelSummary {
  name: string;
  stars: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  imageUrl: string;
}

export interface ItinerarySummary {
  days: number;
  highlights: string[];
  activities: string[];
}

export interface TripPricing {
  flight: number;
  hotel: number;
  total: number;
  currency: string;
  perPerson?: number;
}

// Destination image for carousel
export interface DestinationImage {
  url: string;
  caption?: string;      // e.g., "Eiffel Tower", "Champs-Élysées"
  credit?: string;       // Photo attribution
}

// Transfer info for remote destinations (>2hr from airport)
export interface TransferInfo {
  hubAirportCode: string;           // Major hub IATA code (e.g., "LAX")
  hubCity: string;                  // "Los Angeles"
  groundTransferMinutes: number;    // Minutes from destination's airport to actual destination
  transferType: 'drive' | 'connecting_flight' | 'ferry' | 'train';
  transferNote?: string;            // Optional note like "Scenic coastal drive"
}

// Destination database types
export interface Destination {
  id: string;
  city: string;
  country: string;
  airportCode: string;
  region: 'europe' | 'asia' | 'americas' | 'africa' | 'oceania' | 'middle_east' | 'caribbean';
  vibes: DestinationVibe[];
  bestMonths: number[]; // 1-12
  averageCost: number; // USD estimate for 1 week, 2 adults
  highlights: string[];
  imageUrl: string;     // Primary image (backward compatible)
  images?: DestinationImage[];  // Multiple images for carousel (5-10)
  latitude: number;
  longitude: number;
  transferInfo?: TransferInfo;  // Only for remote destinations >2hr from airport
}

export type DestinationVibe =
  | 'beach'
  | 'adventure'
  | 'culture'
  | 'romance'
  | 'nightlife'
  | 'nature'
  | 'city'
  | 'history'
  | 'food'
  | 'relaxation'
  | 'family'
  | 'luxury';

// Vibe options for UI
export const VIBE_OPTIONS: { value: DestinationVibe; label: string; emoji: string }[] = [
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { value: 'culture', label: 'Culture', emoji: '🏛️' },
  { value: 'romance', label: 'Romance', emoji: '💕' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🎉' },
  { value: 'nature', label: 'Nature', emoji: '🌿' },
  { value: 'city', label: 'City Break', emoji: '🌆' },
  { value: 'history', label: 'History', emoji: '🏰' },
  { value: 'food', label: 'Food & Wine', emoji: '🍷' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { value: 'luxury', label: 'Luxury', emoji: '✨' },
];

// Region options
export const REGION_OPTIONS: { value: string; label: string }[] = [
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'americas', label: 'Americas' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'middle_east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'oceania', label: 'Oceania' },
];

// Amenity options
export const AMENITY_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'pool', label: 'Pool', icon: '🏊' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'wifi', label: 'Free WiFi', icon: '📶' },
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'spa', label: 'Spa', icon: '💆' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
  { value: 'beachfront', label: 'Beachfront', icon: '🏖️' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'room_service', label: 'Room Service', icon: '🛎️' },
  { value: 'kids_club', label: 'Kids Club', icon: '👶' },
];

// Interest options
export const INTEREST_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'museums', label: 'Museums', icon: '🏛️' },
  { value: 'food_tours', label: 'Food Tours', icon: '🍜' },
  { value: 'nightlife', label: 'Nightlife', icon: '🎉' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'beaches', label: 'Beaches', icon: '🏖️' },
  { value: 'history', label: 'History', icon: '📜' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'water_sports', label: 'Water Sports', icon: '🏄' },
  { value: 'wine_tasting', label: 'Wine Tasting', icon: '🍷' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
  { value: 'architecture', label: 'Architecture', icon: '🏰' },
  { value: 'local_markets', label: 'Local Markets', icon: '🏪' },
  { value: 'spa_wellness', label: 'Spa & Wellness', icon: '🧘' },
  { value: 'adventure_sports', label: 'Adventure Sports', icon: '🪂' },
  { value: 'art_galleries', label: 'Art Galleries', icon: '🎨' },
];

// Dietary options
export const DIETARY_OPTIONS: string[] = [
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'pescatarian',
];

// Accessibility options
export const ACCESSIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'wheelchair', label: 'Wheelchair Access' },
  { value: 'limited_mobility', label: 'Limited Mobility' },
  { value: 'hearing', label: 'Hearing Assistance' },
  { value: 'vision', label: 'Vision Assistance' },
  { value: 'service_animal', label: 'Service Animal' },
];

// Default empty preferences
export const DEFAULT_FLASH_PREFERENCES: FlashVacationPreferences = {
  travelers: {
    type: 'couple',
    adults: 2,
    children: [],
    infants: 0,
  },
  homeBase: {
    airportCode: '',
    city: '',
    country: '',
  },
  budget: {
    perTripMin: 1000,
    perTripMax: 5000,
    currency: 'USD',
    flexibility: 'flexible',
  },
  accommodation: {
    minStars: 3,
    mustHaveAmenities: ['wifi'],
    niceToHaveAmenities: [],
    roomPreferences: [],
  },
  travelStyle: {
    adventureRelaxation: 3,
    earlyBirdNightOwl: 3,
    plannedSpontaneous: 3,
    pace: 'moderate',
  },
  interests: {
    primary: [],
    secondary: [],
  },
  restrictions: {
    dietary: [],
    allergies: [],
    accessibility: [],
    medical: [],
  },
  surpriseTolerance: 3,
  profileCompleted: false,
};
