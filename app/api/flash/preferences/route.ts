import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getFlashPreferences, updateFlashPreferences, getOrCreateProfile } from '@/lib/supabase/profiles';
import type { FlashVacationPreferences } from '@/types/flash';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure profile exists
    await getOrCreateProfile(user.id, user.email);

    const result = await getFlashPreferences(user.id);

    console.log('Flash preferences result:', {
      userId: user.id,
      profileComplete: result.profileComplete,
      missingSteps: result.missingSteps,
      hasPreferences: !!result.preferences,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get flash preferences error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get flash preferences' },
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

    const updatedPreferences = await updateFlashPreferences(user.id, body);
    const result = await getFlashPreferences(user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Update flash preferences error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update flash preferences' },
      { status: 500 }
    );
  }
}
