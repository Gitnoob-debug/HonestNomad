import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient, MODEL, MAGIC_PACKAGE_MAX_TOKENS } from '@/lib/claude/client';
import { MAGIC_PACKAGE_PROMPT } from '@/lib/claude/prompts';

interface POIDetail {
  name: string;
  type: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  duration?: string;
  bestTimeOfDay?: string;
  distanceFromHotel?: number; // meters
}

interface ClusterSummary {
  label: string;
  poiNames: string[];
  walkFromHotel?: number; // minutes
}

interface HotelContext {
  name: string;
  stars?: number;
  pricePerNight?: number;
  totalPrice?: number;
  currency?: string;
  amenities?: string[];
}

interface MagicPackageRequest {
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  travelerType: string;
  hotelName?: string;
  activities: string[];
  vibes: string[];
  // Rich context fields
  pathType?: string;
  pathDescription?: string;
  poiDetails?: POIDetail[];
  favoritePOIs?: string[];
  clusters?: ClusterSummary[];
  hotelContext?: HotelContext;
}

/** Format a POI detail into a human-readable line for the prompt */
function formatPOIDetail(poi: POIDetail): string {
  const parts = [`- ${poi.name}`];
  const meta: string[] = [];
  if (poi.type) meta.push(poi.type);
  if (poi.category) meta.push(poi.category);
  if (meta.length > 0) parts.push(`(${meta.join(', ')})`);

  const stats: string[] = [];
  if (poi.rating) stats.push(`★${poi.rating.toFixed(1)}`);
  if (poi.duration) stats.push(poi.duration);
  if (poi.bestTimeOfDay && poi.bestTimeOfDay !== 'any') stats.push(`best at ${poi.bestTimeOfDay}`);
  if (poi.distanceFromHotel !== undefined) {
    const dist = poi.distanceFromHotel < 1000
      ? `${poi.distanceFromHotel}m`
      : `${(poi.distanceFromHotel / 1000).toFixed(1)}km`;
    stats.push(`${dist} from hotel`);
  }
  if (stats.length > 0) parts.push(`— ${stats.join(', ')}`);

  return parts.join(' ');
}

/** Format hotel context into a readable string */
function formatHotelContext(hotel: HotelContext): string {
  const parts = [hotel.name];
  if (hotel.stars) parts.push(`(${hotel.stars}★)`);
  if (hotel.pricePerNight && hotel.currency) {
    parts.push(`— ${hotel.currency} ${hotel.pricePerNight}/night`);
    if (hotel.totalPrice) parts.push(`(${hotel.currency} ${hotel.totalPrice} total)`);
  }
  if (hotel.amenities && hotel.amenities.length > 0) {
    parts.push(`· Amenities: ${hotel.amenities.slice(0, 8).join(', ')}`);
  }
  return parts.join(' ');
}

/** Format cluster summaries for the prompt */
function formatClusters(clusters: ClusterSummary[]): string {
  if (!clusters || clusters.length === 0) return 'No cluster data available — suggest day groupings based on proximity.';
  return clusters.map((c, i) => {
    const walk = c.walkFromHotel ? ` (~${c.walkFromHotel}min walk from hotel)` : '';
    return `Day ${i + 1} — ${c.label} Zone: ${c.poiNames.join(', ')}${walk}`;
  }).join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: MagicPackageRequest = await request.json();

    // Validate required fields
    if (!body.destination || !body.departureDate || !body.returnDate) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, departureDate, returnDate' },
        { status: 400 }
      );
    }

    // Calculate nights and departure month
    const departure = new Date(body.departureDate);
    const returnDate = new Date(body.returnDate);
    const nights = Math.ceil((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));
    const departureMonth = departure.toLocaleString('en-US', { month: 'long' });

    // Build rich context strings
    const poiDetailsText = body.poiDetails && body.poiDetails.length > 0
      ? body.poiDetails.map(formatPOIDetail).join('\n')
      : body.activities?.map(a => `- ${a}`).join('\n') || 'General sightseeing';

    const favoritesText = body.favoritePOIs && body.favoritePOIs.length > 0
      ? `PRIORITY — these are the traveler's saved must-dos: ${body.favoritePOIs.join(', ')}`
      : 'No specific favorites saved — treat all planned activities equally.';

    const clusterText = formatClusters(body.clusters || []);

    const hotelContextText = body.hotelContext
      ? formatHotelContext(body.hotelContext)
      : body.hotelName || 'Hotel not yet selected';

    // Build the prompt with all context
    const prompt = MAGIC_PACKAGE_PROMPT
      .replace(/\{destination\}/g, body.destination)
      .replace(/\{country\}/g, body.country || 'Unknown')
      .replace(/\{departureDate\}/g, body.departureDate)
      .replace(/\{returnDate\}/g, body.returnDate)
      .replace(/\{nights\}/g, String(nights))
      .replace(/\{departureMonth\}/g, departureMonth)
      .replace(/\{travelerType\}/g, body.travelerType || 'couple')
      .replace(/\{pathType\}/g, body.pathType || 'classic')
      .replace(/\{pathDescription\}/g, body.pathDescription || 'Classic Must-See')
      .replace(/\{hotelContext\}/g, hotelContextText)
      .replace(/\{hotelName\}/g, body.hotelName || 'their hotel')
      .replace(/\{poiDetails\}/g, poiDetailsText)
      .replace(/\{favoritePOIs\}/g, favoritesText)
      .replace(/\{clusterSummary\}/g, clusterText)
      .replace(/\{activities\}/g, body.activities?.join(', ') || 'general sightseeing')
      .replace(/\{vibes\}/g, body.vibes?.join(', ') || 'relaxation, culture');

    const client = getOpenRouterClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAGIC_PACKAGE_MAX_TOKENS,
      messages: [
        {
          role: 'system',
          content: 'You are an expert local travel guide. Always respond with valid JSON only, no markdown code fences or extra text. Every recommendation must be specific to the traveler\'s actual planned activities and hotel — never generic.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';

    // Parse the JSON response
    let magicPackage;
    try {
      // Remove potential markdown code fences
      const cleanedText = responseText
        .replace(/^```json\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
      magicPackage = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse magic package response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      magicPackage,
      destination: body.destination,
      nights,
    });
  } catch (error: any) {
    console.error(`Magic package error [model=${MODEL}]:`, error?.message || error);
    // Surface the actual error to the client for debugging
    const message = error?.message || 'Failed to generate magic package';
    return NextResponse.json(
      { error: message, model: MODEL },
      { status: 500 }
    );
  }
}
