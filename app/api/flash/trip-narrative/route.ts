import { NextRequest, NextResponse } from 'next/server';
import { generateTripNarrative } from '@/lib/flash/tripNarrative';
import type { TripNarrativeRequest } from '@/types/trip-narrative';

export async function POST(request: NextRequest) {
  try {
    const body: TripNarrativeRequest = await request.json();

    if (!body.destinationCity || !body.days || body.days.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationCity, days' },
        { status: 400 },
      );
    }

    const result = await generateTripNarrative(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[trip-narrative] Error:', message);

    // Return 200 with empty narratives so the UI gracefully degrades
    return NextResponse.json({ dayNarratives: {} });
  }
}
