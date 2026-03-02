// Booking Session Management for OpenClaw Agent
// Creates and validates single-use, time-limited booking tokens in Supabase

import { createServiceRoleClient, isServiceRoleConfigured } from '@/lib/supabase/server';
import type { BookingSession, BookingSessionRow } from './types';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';
import { randomUUID } from 'crypto';

/** Session expiry in minutes */
const SESSION_EXPIRY_MINUTES = 30;

/**
 * Create a new booking session with a single-use token.
 * Stores hotel + destination + trip details in Supabase.
 * Returns the token (UUID) for the booking link.
 */
export async function createBookingSession(params: {
  hotel: HotelOption;
  destination: MatchedDestination;
  checkin: string;
  checkout: string;
  guests: { adults: number; children: number[] };
  landmarkLat: number;
  landmarkLng: number;
  source: 'openclaw' | 'direct';
}): Promise<{ token: string; expiresAt: string }> {
  if (!isServiceRoleConfigured()) {
    throw new Error('Supabase service role not configured — cannot create booking sessions');
  }

  const supabase = createServiceRoleClient();
  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MINUTES * 60 * 1000);

  const row: BookingSessionRow = {
    id: token,
    hotel_data: JSON.stringify(params.hotel),
    destination_data: JSON.stringify(params.destination),
    checkin: params.checkin,
    checkout: params.checkout,
    guests_data: JSON.stringify(params.guests),
    landmark_lat: params.landmarkLat,
    landmark_lng: params.landmarkLng,
    source: params.source,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    used: false,
  };

  const { error } = await supabase
    .from('booking_sessions')
    .insert(row);

  if (error) {
    console.error('[openclaw/sessions] Failed to create booking session:', error);
    throw new Error(`Failed to create booking session: ${error.message}`);
  }

  console.log(`[openclaw/sessions] Created session ${token} (expires ${expiresAt.toISOString()})`);

  return { token, expiresAt: expiresAt.toISOString() };
}

/**
 * Retrieve a booking session by token.
 * Validates: exists, not expired, not already used.
 * Does NOT mark as used — call markSessionUsed() separately after checkout loads.
 */
export async function getBookingSession(token: string): Promise<BookingSession | null> {
  if (!isServiceRoleConfigured()) {
    throw new Error('Supabase service role not configured');
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('booking_sessions')
    .select('*')
    .eq('id', token)
    .single();

  if (error || !data) {
    console.log(`[openclaw/sessions] Session not found: ${token}`);
    return null;
  }

  const row = data as BookingSessionRow;

  // Check expiry
  const now = new Date();
  const expiresAt = new Date(row.expires_at);
  if (now > expiresAt) {
    console.log(`[openclaw/sessions] Session expired: ${token} (expired ${row.expires_at})`);
    return null;
  }

  // Check if already used
  if (row.used) {
    console.log(`[openclaw/sessions] Session already used: ${token}`);
    return null;
  }

  // Parse JSON fields
  try {
    const session: BookingSession = {
      id: row.id,
      hotel: JSON.parse(row.hotel_data),
      destination: JSON.parse(row.destination_data),
      checkin: row.checkin,
      checkout: row.checkout,
      guests: JSON.parse(row.guests_data),
      landmarkLat: row.landmark_lat,
      landmarkLng: row.landmark_lng,
      source: row.source as 'openclaw' | 'direct',
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      used: row.used,
    };

    return session;
  } catch (parseError) {
    console.error(`[openclaw/sessions] Failed to parse session data: ${token}`, parseError);
    return null;
  }
}

/**
 * Mark a session as used (single-use enforcement).
 * Call this when the checkout page has loaded successfully.
 */
export async function markSessionUsed(token: string): Promise<boolean> {
  if (!isServiceRoleConfigured()) {
    return false;
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('booking_sessions')
    .update({ used: true })
    .eq('id', token)
    .eq('used', false); // Only update if not already used (race condition protection)

  if (error) {
    console.error(`[openclaw/sessions] Failed to mark session used: ${token}`, error);
    return false;
  }

  console.log(`[openclaw/sessions] Marked session used: ${token}`);
  return true;
}

/**
 * Build the booking URL from a token.
 */
export function buildBookingUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honest-nomad-ud6y.vercel.app';
  return `${baseUrl}/book/${token}`;
}
