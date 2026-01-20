import { NextRequest, NextResponse } from 'next/server';
import { getBooking, updateBookingStatus } from '@/lib/supabase/bookings';
import { cancelBooking } from '@/lib/duffel/book';

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
  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get booking' },
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

    // Cancel via Duffel
    await cancelBooking(booking.duffelBookingId);

    // Update status in database
    await updateBookingStatus(booking.duffelBookingId, 'cancelled');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
