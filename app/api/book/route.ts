import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/duffel/book';
import { createBookingRecord } from '@/lib/supabase/bookings';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rateId,
      hotelId,
      hotelName,
      checkIn,
      checkOut,
      guestDetails,
      paymentToken,
      conversationId,
    } = body;

    // Validate required fields
    if (!rateId || !guestDetails || !paymentToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create booking via Duffel
    const booking = await createBooking({
      rateId,
      guests: [guestDetails],
      payment: {
        type: 'card',
        cardToken: paymentToken,
      },
    });

    // Get user if logged in
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Store booking in database
    const dbBooking = await createBookingRecord({
      conversationId,
      duffelBookingId: booking.id,
      hotelName: hotelName || booking.hotel.name,
      hotelId: hotelId || '',
      checkIn,
      checkOut,
      guestName: `${guestDetails.givenName} ${guestDetails.familyName}`,
      guestEmail: guestDetails.email,
      guestPhone: guestDetails.phone,
      totalAmount: parseFloat(booking.totalAmount),
      currency: booking.currency,
      duffelResponse: booking,
    });

    return NextResponse.json({
      booking: {
        ...booking,
        id: dbBooking.id,
        duffelBookingId: booking.id,
      },
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
