import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserBookings } from '@/lib/supabase/bookings';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await getUserBookings(user.id);

    return NextResponse.json({ bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get bookings error:', message);
    return NextResponse.json(
      { error: 'Failed to get bookings', details: message },
      { status: 500 }
    );
  }
}
