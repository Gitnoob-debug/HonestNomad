import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient, MODEL, MAX_TOKENS } from '@/lib/claude/client';
import { MAGIC_PACKAGE_PROMPT } from '@/lib/claude/prompts';

interface MagicPackageRequest {
  destination: string;
  country: string;
  departureDate: string;
  returnDate: string;
  travelerType: string;
  hotelName?: string;
  activities: string[];
  vibes: string[];
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

    // Calculate nights
    const departure = new Date(body.departureDate);
    const returnDate = new Date(body.returnDate);
    const nights = Math.ceil((returnDate.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));

    // Build the prompt with context
    const prompt = MAGIC_PACKAGE_PROMPT
      .replace(/\{destination\}/g, body.destination)
      .replace(/\{country\}/g, body.country || 'Unknown')
      .replace(/\{departureDate\}/g, body.departureDate)
      .replace(/\{returnDate\}/g, body.returnDate)
      .replace(/\{nights\}/g, String(nights))
      .replace(/\{travelerType\}/g, body.travelerType || 'couple')
      .replace(/\{hotelName\}/g, body.hotelName || 'their hotel')
      .replace(/\{activities\}/g, body.activities?.join(', ') || 'general sightseeing')
      .replace(/\{vibes\}/g, body.vibes?.join(', ') || 'relaxation, culture');

    const client = getOpenRouterClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS * 2, // Magic package needs more tokens
      messages: [
        {
          role: 'system',
          content: 'You are a travel expert. Always respond with valid JSON only, no markdown code fences or extra text.',
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
    console.error('Magic package generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate magic package' },
      { status: 500 }
    );
  }
}
