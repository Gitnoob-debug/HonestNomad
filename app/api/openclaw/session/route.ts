// Booking Session API for OpenClaw checkout flow
// GET /api/openclaw/session?token=<uuid> — Retrieve session data
// POST /api/openclaw/session — Mark session as used
//
// Used by the /book/[token] page to hydrate checkout data
// from Supabase instead of sessionStorage.

import { NextRequest, NextResponse } from 'next/server';
import { getBookingSession, markSessionUsed } from '@/lib/openclaw/sessions';

/**
 * GET — Retrieve a booking session by token.
 * Returns hotel, destination, dates, and guest data.
 * Does NOT mark as used (page might reload).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token parameter' },
      { status: 400 }
    );
  }

  try {
    const session = await getBookingSession(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found, expired, or already used' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hotel: session.hotel,
      destination: session.destination,
      checkin: session.checkin,
      checkout: session.checkout,
      guests: session.guests,
      landmarkLat: session.landmarkLat,
      landmarkLng: session.landmarkLng,
      source: session.source,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('[openclaw/session] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

/**
 * POST — Mark a booking session as used.
 * Call this when the user initiates checkout (clicks "Proceed to payment").
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    const success = await markSessionUsed(token);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark session as used (may already be used)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[openclaw/session] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
