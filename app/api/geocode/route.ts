import { NextRequest, NextResponse } from 'next/server';
import { geocodeCity, geocodeAddress, searchPlaces } from '@/lib/geocoding/mapbox';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'city';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'city':
        result = await geocodeCity(query);
        break;
      case 'address':
        result = await geocodeAddress(query);
        break;
      case 'search':
        const limit = parseInt(searchParams.get('limit') || '5');
        result = await searchPlaces(query, { limit });
        break;
      default:
        result = await geocodeCity(query);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: error.message || 'Geocoding failed' },
      { status: 500 }
    );
  }
}
