import { duffel } from './client';
import type { BookingParams, BookingResult } from '@/types/hotel';

export async function createBooking(
  params: BookingParams
): Promise<BookingResult> {
  // Lead guest info
  const leadGuest = params.guests[0];

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
    quote_id: params.rateId, // rateId is actually the quote_id from search
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

  const order = await duffel.stays.bookings.create(bookingPayload);

  const booking = order.data;

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
    totalAmount: '0', // Will be set from quote data
    currency: 'USD',
    cancellationPolicy: {
      refundable: false,
    },
  };
}

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
