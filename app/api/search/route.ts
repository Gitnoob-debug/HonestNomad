import { NextRequest, NextResponse } from 'next/server';
import { searchHotels } from '@/lib/duffel/search';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { HotelSearchParams } from '@/types/hotel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      destination,
      checkIn,
      checkOut,
      guests,
      rooms,
      budgetMin,
      budgetMax,
      currency,
      conversationId,
    } = body;

    // Validate required fields
    if (!destination || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'destination, checkIn, and checkOut are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const searchParams: HotelSearchParams = {
      location: { city: destination },
      checkIn,
      checkOut,
      guests: guests || 1,
      rooms: rooms || 1,
      budget:
        budgetMin || budgetMax
          ? {
              min: budgetMin,
              max: budgetMax,
              currency: currency || 'USD',
            }
          : undefined,
    };

    const hotels = await searchHotels(searchParams);

    const responseTimeMs = Date.now() - startTime;

    // Log search for analytics
    if (conversationId) {
      const supabase = createServiceRoleClient();
      await (supabase.from('search_logs') as any).insert({
        conversation_id: conversationId,
        search_params: searchParams,
        results_count: hotels.length,
        min_price: hotels.length > 0 ? Math.min(...hotels.map((h) => h.pricing.nightlyRate)) : null,
        max_price: hotels.length > 0 ? Math.max(...hotels.map((h) => h.pricing.nightlyRate)) : null,
        response_time_ms: responseTimeMs,
      });
    }

    return NextResponse.json({ hotels });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search hotels' },
      { status: 500 }
    );
  }
}
