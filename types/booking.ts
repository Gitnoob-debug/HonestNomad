export interface Booking {
  id: string;
  conversationId: string;
  createdAt: string;

  // Duffel references
  duffelBookingId: string;
  duffelOrderId?: string;

  // Hotel details
  hotelName: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomType?: string;

  // Guest info
  guestName: string;
  guestEmail: string;
  guestPhone?: string;

  // Pricing
  totalAmount: number;
  currency: string;
  commissionAmount?: number;

  // Status
  status: BookingStatus;

  // Itinerary reference
  itineraryId?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface BookingListItem {
  id: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
}

export interface CreateBookingParams {
  conversationId: string;
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
  duffelResponse?: any;
}
