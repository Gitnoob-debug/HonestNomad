import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFlashPreferences, updateFlashPreferences, getOrCreateProfile } from '@/lib/supabase/profiles';
import { DEFAULT_FLASH_PREFERENCES } from '@/types/flash';
import type { FlashVacationPreferences } from '@/types/flash';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Anonymous users get default preferences
    if (!user) {
      return NextResponse.json({
        preferences: { ...DEFAULT_FLASH_PREFERENCES, profileCompleted: false },
        profileComplete: false,
        missingSteps: ['travelers', 'homeBase', 'budgetAccommodation'],
      });
    }

    // Ensure profile exists
    await getOrCreateProfile(user.id, user.email);

    const result = await getFlashPreferences(user.id);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get flash preferences error:', message);
    return NextResponse.json(
      { error: 'Failed to get flash preferences', details: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<FlashVacationPreferences> = await request.json();

    // Validate the update
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await updateFlashPreferences(user.id, body);
    const result = await getFlashPreferences(user.id);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update flash preferences error:', message);
    return NextResponse.json(
      { error: 'Failed to update flash preferences', details: message },
      { status: 500 }
    );
  }
}
