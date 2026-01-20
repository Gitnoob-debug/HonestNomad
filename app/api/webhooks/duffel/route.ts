import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/supabase/bookings';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('duffel-signature');

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'booking.confirmed':
        await updateBookingStatus(event.data.id, 'confirmed');
        break;

      case 'booking.cancelled':
        await updateBookingStatus(event.data.id, 'cancelled');
        break;

      case 'booking.amended':
        // Handle booking modifications
        console.log('Booking amended:', event.data.id);
        break;

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.DUFFEL_WEBHOOK_SECRET) {
    // In development, allow without signature
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.DUFFEL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
