import { NextRequest, NextResponse } from 'next/server';

// DISABLED: Image proxy is temporarily disabled to prevent excessive Google Places API costs
// The POI images are being migrated to Supabase Storage instead
// TODO: Re-enable once images are served from our own storage

export async function GET(request: NextRequest) {
  // Return a placeholder/error to prevent API costs
  // Images will show fallback emoji icons in the UI
  return NextResponse.json(
    { error: 'Image proxy temporarily disabled - images being migrated to storage' },
    { status: 503 }
  );
}

// Original implementation (disabled):
// This was causing $900+ in Google Places API costs because every image view
// was making a fresh API call. The fix is to:
// 1. Download all POI images to Supabase Storage (one-time cost)
// 2. Update POI cache files to use Supabase URLs
// 3. Remove the need for this proxy entirely
/*
export async function GET_ORIGINAL(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow Google Places photo URLs
  if (!url.startsWith('https://places.googleapis.com/')) {
    return NextResponse.json({ error: 'Invalid URL domain' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Add API key to the URL
  const proxyUrl = url.includes('?') ? `${url}&key=${apiKey}` : `${url}?key=${apiKey}`;

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
*/
