import { NextRequest, NextResponse } from 'next/server';
import { lookupPlaceId } from '@/lib/liteapi/client';

/**
 * POST /api/places/lookup
 *
 * Looks up a Google Place ID for a landmark or city query.
 * Used by selectDestination() to get landmark-specific placeIds
 * for the whitelabel redirect (e.g. "Colosseum Rome Italy" → ChIJrRMgU7ZhLxMR...).
 *
 * Body: { query: string, type?: string }
 * Returns: { placeId: string, description: string } or { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "query" parameter' },
        { status: 400 }
      );
    }

    const result = await lookupPlaceId(query, type || 'point_of_interest');

    if (!result) {
      // Try again with broader type if specific type returned nothing
      const fallback = await lookupPlaceId(query, 'locality');
      if (!fallback) {
        return NextResponse.json(
          { error: 'No place found for query', query },
          { status: 404 }
        );
      }
      return NextResponse.json(fallback);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Place lookup failed:', error);
    return NextResponse.json(
      { error: 'Place lookup failed' },
      { status: 500 }
    );
  }
}
