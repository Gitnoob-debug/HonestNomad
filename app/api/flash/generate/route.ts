import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFlashPreferences } from '@/lib/supabase/profiles';
import { generateTripBatch } from '@/lib/flash/tripGenerator';
import type { FlashGenerateParams } from '@/types/flash';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: FlashGenerateParams = await request.json();

    // Validate required fields
    if (!body.departureDate || !body.returnDate) {
      return NextResponse.json(
        { error: 'Missing required fields: departureDate and returnDate' },
        { status: 400 }
      );
    }

    // Validate dates
    const departure = new Date(body.departureDate);
    const returnDate = new Date(body.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (departure < today) {
      return NextResponse.json(
        { error: 'Departure date must be in the future' },
        { status: 400 }
      );
    }

    if (returnDate <= departure) {
      return NextResponse.json(
        { error: 'Return date must be after departure date' },
        { status: 400 }
      );
    }

    // Get user's flash preferences
    const { preferences, profileComplete, missingSteps } = await getFlashPreferences(user.id);

    if (!preferences || !profileComplete) {
      return NextResponse.json(
        {
          error: 'Flash profile incomplete',
          missingSteps,
          message: 'Please complete your flash profile before generating trips',
        },
        { status: 400 }
      );
    }

    // Generate trip batch
    const { trips, generationTime, diversityScore } = await generateTripBatch(
      {
        departureDate: body.departureDate,
        returnDate: body.returnDate,
        vibe: body.vibe,
        region: body.region,
        count: body.count || 8,
        excludeDestinations: body.excludeDestinations,
      },
      preferences
    );

    // Create session ID for this batch
    const sessionId = uuidv4();

    return NextResponse.json({
      sessionId,
      trips,
      generationTime,
      diversityScore,
      tripCount: trips.length,
    });
  } catch (error: any) {
    console.error('Flash generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate trips' },
      { status: 500 }
    );
  }
}
