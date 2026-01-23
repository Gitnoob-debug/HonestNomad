import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const MAX_DRAFTS = 3; // Keep only 3 most recent drafts per user

// GET /api/drafts - Get all drafts for current user
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: drafts, error } = await supabase
      .from('draft_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(MAX_DRAFTS);

    if (error) {
      console.error('Error fetching drafts:', error);
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    // Transform to client format
    const clientDrafts = drafts.map(draft => ({
      id: draft.id,
      trip: draft.trip_data,
      itinerary: draft.itinerary,
      itineraryType: draft.itinerary_type,
      favorites: draft.favorites,
      favoriteStops: draft.favorite_stops,
      step: draft.current_step,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    }));

    return NextResponse.json({ drafts: clientDrafts });
  } catch (error) {
    console.error('Get drafts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/drafts - Create or update a draft
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trip, itinerary, itineraryType, favorites, favoriteStops, step } = body;

    if (!trip || !trip.destination || !trip.flight) {
      return NextResponse.json({ error: 'Invalid trip data' }, { status: 400 });
    }

    // Extract dates from flight data
    const departureDate = trip.flight.outbound.departure.split('T')[0];
    const returnDate = trip.flight.return.arrival.split('T')[0];

    // Upsert the draft (insert or update if exists)
    const { data: draft, error } = await supabase
      .from('draft_trips')
      .upsert({
        user_id: user.id,
        destination_city: trip.destination.city,
        destination_country: trip.destination.country,
        departure_date: departureDate,
        return_date: returnDate,
        trip_data: trip,
        itinerary: itinerary || [],
        itinerary_type: itineraryType,
        favorites: favorites || [],
        favorite_stops: favoriteStops || [],
        current_step: step || 'itinerary',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,destination_city,departure_date,return_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    // Enforce MAX_DRAFTS limit - delete oldest drafts beyond limit
    const { data: allDrafts } = await supabase
      .from('draft_trips')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (allDrafts && allDrafts.length > MAX_DRAFTS) {
      const draftsToDelete = allDrafts.slice(MAX_DRAFTS).map(d => d.id);
      await supabase
        .from('draft_trips')
        .delete()
        .in('id', draftsToDelete);
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
    console.error('Save draft error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/drafts - Delete a draft by ID (passed in query params)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('draft_trips')
      .delete()
      .eq('id', draftId)
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
