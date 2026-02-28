import { NextRequest, NextResponse } from 'next/server';
import { getWalkingDirections } from '@/lib/mapbox/directions';

interface DirectionsRequest {
  coordinates: [number, number][]; // [latitude, longitude] pairs
}

export async function POST(request: NextRequest) {
  try {
    const body: DirectionsRequest = await request.json();

    if (!body.coordinates || body.coordinates.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 coordinate pairs [lat, lng] are required' },
        { status: 400 }
      );
    }

    if (body.coordinates.length > 25) {
      return NextResponse.json(
        { error: 'Maximum 25 waypoints supported' },
        { status: 400 }
      );
    }

    const waypoints = body.coordinates.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const result = await getWalkingDirections(waypoints);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Directions API error:', message);
    return NextResponse.json(
      { error: 'Failed to get directions', details: message },
      { status: 500 }
    );
  }
}
