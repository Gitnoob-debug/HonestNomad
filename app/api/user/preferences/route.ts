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
  } catch (error: any) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get preferences' },
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
  } catch (error: any) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
