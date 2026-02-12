import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFlashPreferences } from '@/lib/supabase/profiles';
import { generateTripBatch } from '@/lib/flash/tripGenerator';
import { loadRevealedPreferences } from '@/lib/flash/preferenceStorage';
import { DEFAULT_FLASH_PREFERENCES } from '@/types/flash';
import type { FlashGenerateParams, FlashVacationPreferences } from '@/types/flash';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    // Get preferences: user's saved preferences or defaults for anonymous users
    let preferences: FlashVacationPreferences = {
      ...DEFAULT_FLASH_PREFERENCES,
      profileCompleted: true, // Treat defaults as complete so generation proceeds
    };
    let revealedPreferences: any = undefined;

    if (user) {
      const result = await getFlashPreferences(user.id);
      if (result.preferences && result.profileComplete) {
        preferences = result.preferences;
      }
      // Load revealed preferences (learned from swipe behavior)
      revealedPreferences = await loadRevealedPreferences(user.id);
    }

    // Generate trip batch with revealed preferences
    const { trips, generationTime, diversityScore } = await generateTripBatch(
      {
        departureDate: body.departureDate,
        returnDate: body.returnDate,
        vibe: body.vibe,
        region: body.region,
        count: body.count || 8,
        excludeDestinations: body.excludeDestinations,
      },
      preferences,
      revealedPreferences
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
