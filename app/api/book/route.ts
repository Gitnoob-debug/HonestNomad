import { NextRequest, NextResponse } from 'next/server';
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
      roomType,
      guestDetails,
      paymentToken,
    } = body;

    // Validate required fields
    if (!rateId || !guestDetails || !paymentToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Create booking via LiteAPI
    // const booking = await liteapi.book({ rateId, guests: [guestDetails], payment: paymentToken });
    // For now, return a stub response
    const providerBookingId = `pending_${Date.now()}`;

    // Get user if logged in
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Store booking in database
    const dbBooking = await createBookingRecord({
      providerBookingId,
      hotelName: hotelName || '',
      hotelId: hotelId || '',
      checkIn,
      checkOut,
      roomType,
      guestName: `${guestDetails.givenName} ${guestDetails.familyName}`,
      guestEmail: guestDetails.email,
      guestPhone: guestDetails.phone,
      totalAmount: 0, // TODO: get from LiteAPI response
      currency: 'USD', // TODO: get from LiteAPI response
    });

    return NextResponse.json({
      booking: {
        id: dbBooking.id,
        providerBookingId,
        status: 'pending',
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
