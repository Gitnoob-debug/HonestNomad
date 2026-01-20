import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/claude/itinerary';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ItineraryGenerateParams } from '@/types/itinerary';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      bookingId,
      hotelName,
      hotelNeighborhood,
      hotelLat,
      hotelLng,
      destination,
      checkIn,
      checkOut,
      travelerType,
      interests,
      pace,
      budgetLevel,
    } = body;

    // Validate required fields
    if (!destination || !checkIn || !checkOut || !hotelName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const params: ItineraryGenerateParams = {
      hotelName,
      hotelNeighborhood: hotelNeighborhood || '',
      hotelLat: hotelLat || 0,
      hotelLng: hotelLng || 0,
      destination,
      checkIn,
      checkOut,
      travelerType,
      interests,
      pace,
      budgetLevel,
    };

    // Generate the itinerary
    const itinerary = await generateItinerary(params);

    // Store in database
    const supabase = createServiceRoleClient();

    if (bookingId) {
      // Update booking with itinerary
      await supabase
        .from('bookings')
        .update({ itinerary })
        .eq('id', bookingId);
    }

    // Store as standalone itinerary
    await supabase.from('itineraries').insert({
      conversationId,
      bookingId,
      destination: itinerary.destination,
      startDate: checkIn,
      endDate: checkOut,
      content: itinerary,
      preferencesUsed: { travelerType, interests, pace, budgetLevel },
      generationModel: 'claude-sonnet-4-20250514',
    });

    return NextResponse.json({ itinerary });
  } catch (error: any) {
    console.error('Itinerary generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
