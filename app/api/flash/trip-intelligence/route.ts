/**
 * Trip Intelligence API Route
 *
 * Assembles trip intelligence from precomputed fact sheets
 * and deterministic logic. Response time <50ms. Zero API cost.
 */

import { NextRequest, NextResponse } from 'next/server';
import { assembleTripIntelligence } from '@/lib/flash/tripIntelligence';
import type { TripIntelligenceInput } from '@/lib/flash/tripIntelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { destinationId, country, departureDate } = body;
    if (!destinationId || !country || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationId, country, departureDate' },
        { status: 400 }
      );
    }

    // Calculate nights from dates
    let nights = body.nights || 3;
    if (body.returnDate && body.departureDate) {
      const dep = new Date(body.departureDate);
      const ret = new Date(body.returnDate);
      nights = Math.max(1, Math.round((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const input: TripIntelligenceInput = {
      destinationId,
      country,
      departureDate,
      travelerType: body.travelerType || 'couple',
      pathType: body.pathType || 'classic',
      vibes: body.vibes || [],
      nights,
    };

    const result = await assembleTripIntelligence(input);

    if (!result) {
      return NextResponse.json(
        { error: `No intelligence data available for destination: ${destinationId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[trip-intelligence] Error:', message);
    return NextResponse.json(
      { error: 'Failed to assemble trip intelligence', details: message },
      { status: 500 }
    );
  }
}
