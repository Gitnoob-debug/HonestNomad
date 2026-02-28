import { NextRequest, NextResponse } from 'next/server';
import { getBooking, updateBookingStatus } from '@/lib/supabase/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await getBooking(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get booking error:', message);
    return NextResponse.json(
      { error: 'Failed to get booking', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await getBooking(params.id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // TODO: Cancel via LiteAPI when integrated
    // await liteapi.cancelBooking(booking.provider_booking_id);

    // Update status in database
    await updateBookingStatus(booking.provider_booking_id, 'cancelled');

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cancel booking error:', message);
    return NextResponse.json(
      { error: 'Failed to cancel booking', details: message },
      { status: 500 }
    );
  }
}
