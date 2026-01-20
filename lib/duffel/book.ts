import { duffel } from './client';
import type { BookingParams, BookingResult } from '@/types/hotel';

export async function createBooking(
  params: BookingParams
): Promise<BookingResult> {
  const guests = params.guests.map((g) => ({
    given_name: g.givenName,
    family_name: g.familyName,
    email: g.email,
    phone_number: g.phone,
  }));

  // Build payment object
  const payments: any[] = [];
  if (params.payment.type === 'balance') {
    payments.push({ type: 'balance' });
  } else if (params.payment.cardToken) {
    payments.push({
      type: 'card',
      token: params.payment.cardToken,
    });
  }

  const order = await duffel.stays.bookings.create({
    rate_id: params.rateId,
    guests,
    payments,
    metadata: {
      source: 'honest-nomad',
      timestamp: new Date().toISOString(),
    },
  });

  const booking = order.data;

  return {
    id: booking.id,
    bookingReference: booking.booking_reference || booking.id,
    status: mapStatus(booking.status),
    hotel: {
      name: booking.accommodation?.name || 'Hotel',
      address: booking.accommodation?.location?.address?.line_1 || '',
    },
    checkIn: booking.check_in_date,
    checkOut: booking.check_out_date,
    guests: params.guests,
    totalAmount: booking.total_amount || '0',
    currency: booking.total_currency || 'USD',
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
