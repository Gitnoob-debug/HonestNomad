import { NextResponse } from 'next/server';
import { getHotelReviews } from '@/lib/liteapi/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (!hotelId) {
      return NextResponse.json(
        { error: 'hotelId is required' },
        { status: 400 }
      );
    }

    const { reviews, total } = await getHotelReviews(hotelId, limit);

    return NextResponse.json({
      reviews,
      total,
      hotelId,
    });
  } catch (error) {
    console.error('Hotel reviews error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
