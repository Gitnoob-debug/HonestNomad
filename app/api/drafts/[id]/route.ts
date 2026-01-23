import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/drafts/[id] - Get a specific draft by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: draft, error } = await supabase
      .from('draft_trips')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns this draft
      .single();

    if (error || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        trip: draft.trip_data,
        itinerary: draft.itinerary,
        itineraryType: draft.itinerary_type,
        favorites: draft.favorites,
        favoriteStops: draft.favorite_stops,
        step: draft.current_step,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
      }
    });
  } catch (error) {
    console.error('Get draft error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/drafts/[id] - Delete a specific draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('draft_trips')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id); // Ensure user owns this draft

    if (error) {
      console.error('Error deleting draft:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
