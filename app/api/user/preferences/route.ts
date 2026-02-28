import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProfile, updatePreferences, getOrCreateProfile } from '@/lib/supabase/profiles';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getOrCreateProfile(user.id, user.email);

    return NextResponse.json({ preferences: profile.preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get preferences error:', message);
    return NextResponse.json(
      { error: 'Failed to get preferences', details: message },
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

    const body = await request.json();

    const profile = await updatePreferences(user.id, body);

    return NextResponse.json({ preferences: profile.preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update preferences error:', message);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: message },
      { status: 500 }
    );
  }
}
