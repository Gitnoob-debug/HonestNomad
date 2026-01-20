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
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get bookings' },
      { status: 500 }
    );
  }
}
