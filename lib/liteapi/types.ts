// LiteAPI Types based on sandbox testing

export interface LiteAPIHotel {
  id: string;
  name: string;
  hotelDescription: string;
  chain?: string;
  chainId?: number;
  stars: number;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  zip?: string;
  currency: string;
  main_photo: string;
  thumbnail: string;
  facilityIds: number[];
}

export interface LiteAPIHotelDetails extends LiteAPIHotel {
  hotelImportantInformation?: string;
  checkinCheckoutTimes: {
    checkin: string;
    checkout: string;
  };
  hotelImages: LiteAPIImage[];
  hotelFacilities: string[];
  facilities: LiteAPIFacility[];
  rooms: LiteAPIRoom[];
}

export interface LiteAPIImage {
  url: string;
  urlHd: string;
  caption: string;
  order: number;
  defaultImage: boolean;
}

export interface LiteAPIFacility {
  facilityId: number;
  name: string;
}

export interface LiteAPIRoom {
  id: number;
  roomName: string;
  description: string;
  roomSizeSquare: number;
  roomSizeUnit: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  bedTypes: LiteAPIBedType[];
  roomAmenities: LiteAPIAmenity[];
  photos: LiteAPIRoomPhoto[];
  views: LiteAPIView[];
}

export interface LiteAPIBedType {
  quantity: number;
  bedType: string;
  bedSize: string;
  id: number;
}

export interface LiteAPIAmenity {
  amenitiesId: number;
  name: string;
  sort: number;
}

export interface LiteAPIRoomPhoto {
  url: string;
  hd_url: string;
  mainPhoto: boolean;
}

export interface LiteAPIView {
  view: string;
  id: number;
}

// Rates types
export interface LiteAPIRatesRequest {
  hotelIds: string[];
  checkin: string;
  checkout: string;
  occupancies: LiteAPIOccupancy[];
  currency: string;
  guestNationality: string;
}

export interface LiteAPIOccupancy {
  adults: number;
  children?: number[];
}

export interface LiteAPIRatesResponse {
  data: LiteAPIHotelRates[];
  guestLevel: number;
  sandbox: boolean;
}

export interface LiteAPIHotelRates {
  hotelId: string;
  roomTypes: LiteAPIRoomType[];
  et: number; // expiration time in seconds
}

export interface LiteAPIRoomType {
  roomTypeId: string;
  offerId: string;
  supplier: string;
  supplierId: number;
  rates: LiteAPIRate[];
  offerRetailRate: LiteAPIMoney;
  suggestedSellingPrice: LiteAPIMoney;
  offerInitialPrice: LiteAPIMoney;
  priceType: string;
  rateType: string;
  paymentTypes: string[];
}

export interface LiteAPIRate {
  rateId: string;
  occupancyNumber: number;
  name: string;
  maxOccupancy: number;
  adultCount: number;
  childCount: number;
  childrenAges: number[];
  boardType: string;
  boardName: string;
  remarks: string;
  priceType: string;
  commission: LiteAPIMoney[];
  retailRate: {
    total: LiteAPIMoney[];
    suggestedSellingPrice: LiteAPIMoney[];
    initialPrice: LiteAPIMoney[];
    taxesAndFees: LiteAPITax[];
  };
  cancellationPolicies: {
    cancelPolicyInfos: any[];
    hotelRemarks: string[];
    refundableTag: 'RFN' | 'NRFN' | 'PRFN';
  };
  paymentTypes: string[];
}

export interface LiteAPIMoney {
  amount: number;
  currency: string;
  source?: string;
}

export interface LiteAPITax {
  included: boolean;
  description: string;
  amount: number;
  currency: string;
}

// Review types
export interface LiteAPIReview {
  averageScore: number;
  country: string;
  type: string;
  name: string;
  date: string;
  headline: string;
  language: string;
  pros: string;
  cons: string;
  source: string;
}

// Search params
export interface HotelSearchParams {
  latitude: number;
  longitude: number;
  checkin: string;
  checkout: string;
  adults: number;
  children?: number[];
  currency?: string;
  guestNationality?: string;
  // Filtering
  minStars?: number;
  maxPrice?: number;
  amenities?: string[];
  limit?: number;
}

// Simplified hotel for display
export interface HotelOption {
  id: string;
  name: string;
  description: string;
  stars: number;
  rating: number;
  reviewCount: number;
  address: string;
  latitude: number;
  longitude: number;
  mainPhoto: string;
  photos: string[];
  amenities: string[];
  checkinTime: string;
  checkoutTime: string;
  // Pricing
  totalPrice: number;
  pricePerNight: number;
  currency: string;
  taxesIncluded: boolean;
  refundable: boolean;
  boardType: string;
  boardName: string;
  // Booking details
  offerId: string;
  rateId: string;
  roomName: string;
  roomDescription: string;
  expiresAt: number; // timestamp
  // Zone info
  distanceFromZoneCenter?: number; // meters from ideal hotel zone center
  insideZone?: boolean;
  // ── Enrichment fields (Discover flow) ──────────────────────
  // Chain branding
  chain?: string;
  // HD images + captions (parallel arrays matching `photos`)
  photosHd?: string[];
  photoCaptions?: string[];
  // Room details (from first room in details response)
  roomDetails?: {
    roomSizeSquare?: number;
    roomSizeUnit?: string;
    maxOccupancy?: number;
    maxAdults?: number;
    maxChildren?: number;
    bedTypes?: Array<{ bedType: string; bedSize: string; quantity: number }>;
    views?: string[];
  };
  // Guest reviews (top 3)
  reviews?: Array<{
    averageScore: number;
    name: string;
    country: string;
    date: string;
    headline: string;
    pros: string;
    cons: string;
  }>;
  reviewsTotal?: number;
  // Important hotel information (resort fees, policies, etc.)
  hotelImportantInformation?: string;
  // Cancellation deadline detail
  cancelDeadline?: string; // e.g. "Free cancellation until March 13, 2026"
}
