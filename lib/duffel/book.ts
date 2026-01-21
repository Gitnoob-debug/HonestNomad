import { duffel, getDuffelClient } from './client';
import type { BookingParams, BookingResult } from '@/types/hotel';
import { createHotelQuote } from './search';

export interface HotelBookingParams extends BookingParams {
  quoteId?: string; // If provided, use directly. Otherwise create from rateId
}

export async function createHotelBooking(
  params: HotelBookingParams
): Promise<BookingResult> {
  // Lead guest info
  const leadGuest = params.guests[0];

  // Step 1: Get or create quote
  let quoteId = params.quoteId;
  if (!quoteId) {
    console.log('Creating quote for rate:', params.rateId);
    const quote = await createHotelQuote(params.rateId);
    if (!quote) {
      throw new Error('Failed to create hotel booking quote');
    }
    quoteId = quote.quoteId;
    console.log('Quote created:', quoteId);
  }

  // Build guests array for Duffel API
  const guests = params.guests.map((g) => ({
    given_name: g.givenName,
    family_name: g.familyName,
  }));

  // Build booking payload per Duffel API spec
  const bookingPayload: {
    quote_id: string;
    guests: Array<{ given_name: string; family_name: string }>;
    email: string;
    phone_number: string;
    payment?: { card_id: string };
  } = {
    quote_id: quoteId,
    guests,
    email: leadGuest.email,
    phone_number: leadGuest.phone || '',
  };

  // Add payment if card token provided
  if (params.payment.cardToken) {
    bookingPayload.payment = {
      card_id: params.payment.cardToken,
    };
  }

  console.log('Creating hotel booking with quote:', quoteId);
  const order = await getDuffelClient().stays.bookings.create(bookingPayload);

  const booking = order.data as any;

  return {
    id: booking.id,
    bookingReference: booking.reference || booking.id,
    status: mapStatus(booking.status),
    hotel: {
      name: booking.accommodation?.name || 'Hotel',
      address: booking.accommodation?.location?.address?.line_one || '',
    },
    checkIn: booking.check_in_date,
    checkOut: booking.check_out_date,
    guests: params.guests,
    totalAmount: booking.total_amount || '0',
    currency: booking.total_currency || 'USD',
    cancellationPolicy: {
      refundable: booking.cancellation_policy?.refundable || false,
    },
  };
}

// Legacy function name for backwards compatibility
export const createBooking = createHotelBooking;

export async function getBooking(bookingId: string): Promise<any> {
  const booking = await duffel.stays.bookings.get(bookingId);
  return booking.data;
}

export async function cancelBooking(bookingId: string): Promise<any> {
  const result = await duffel.stays.bookings.cancel(bookingId);
  return result.data;
}

function mapStatus(
  status: string
): 'pending' | 'confirmed' | 'cancelled' | 'completed' {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
}

// Duffel Pay integration helpers
export function getDuffelPayConfig() {
  return {
    publishableKey: process.env.NEXT_PUBLIC_DUFFEL_PUBLISHABLE_KEY,
    environment:
      process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  };
}
