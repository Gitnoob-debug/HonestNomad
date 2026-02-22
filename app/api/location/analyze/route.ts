import { NextRequest, NextResponse } from 'next/server';
import { resolveLocation } from '@/lib/location/resolver';
import type { AnalyzeLocationRequest } from '@/types/location';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeLocationRequest = await request.json();

    if (!body.url && !body.imageBase64) {
      return NextResponse.json(
        {
          success: false,
          location: null,
          matchedDestination: null,
          error: 'Provide either a URL or an image.',
        },
        { status: 400 },
      );
    }

    // Validate image size (rough check: base64 is ~33% larger than binary)
    if (body.imageBase64 && body.imageBase64.length > 7_000_000) {
      return NextResponse.json(
        {
          success: false,
          location: null,
          matchedDestination: null,
          error: 'Image is too large. Please upload an image under 5MB.',
        },
        { status: 400 },
      );
    }

    const result = await resolveLocation(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[location-analyze] Error:', message);
    return NextResponse.json(
      {
        success: false,
        location: null,
        matchedDestination: null,
        error: 'Something went wrong analyzing this input. Please try again.',
      },
      { status: 500 },
    );
  }
}
