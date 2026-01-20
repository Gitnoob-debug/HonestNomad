import { openrouter, MODEL } from './client';
import { RESULTS_PROMPT, BOOKING_CONFIRMATION_PROMPT } from './prompts';
import type { NormalizedHotel } from '@/types/hotel';

export async function generateResultsResponse(
  hotels: NormalizedHotel[],
  userPreferences: Record<string, any>,
  originalQuery: string
): Promise<string> {
  const hotelSummaries = hotels
    .slice(0, 5)
    .map(
      (h, i) => `
Hotel ${i + 1}: ${h.name}
- Location: ${h.location.address}, ${h.location.city}
- Price: ${h.pricing.currency} ${h.pricing.nightlyRate.toFixed(0)}/night (${h.pricing.currency} ${h.pricing.totalAmount.toFixed(0)} total)
- Rating: ${h.rating.stars ? `${h.rating.stars} stars` : 'Unrated'}${h.rating.reviewScore ? `, ${h.rating.reviewScore}/10 from ${h.rating.reviewCount} reviews` : ''}
- Amenities: ${h.amenities.slice(0, 5).join(', ')}
- ID: ${h.id}
`
    )
    .join('\n');

  const prompt = RESULTS_PROMPT.replace('{query}', originalQuery)
    .replace('{preferences}', JSON.stringify(userPreferences))
    .replace('{hotelSummaries}', hotelSummaries);

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  return textContent || 'I found some options but had trouble formatting them. Please try again.';
}

export async function generateBookingConfirmation(
  hotel: NormalizedHotel,
  bookingDetails: {
    checkIn: string;
    checkOut: string;
    currency: string;
    totalAmount: string;
    bookingReference: string;
  }
): Promise<string> {
  const prompt = BOOKING_CONFIRMATION_PROMPT.replace('{hotelName}', hotel.name)
    .replace('{address}', hotel.location.address)
    .replace('{city}', hotel.location.city)
    .replace('{checkIn}', bookingDetails.checkIn)
    .replace('{checkOut}', bookingDetails.checkOut)
    .replace('{currency}', bookingDetails.currency)
    .replace('{totalAmount}', bookingDetails.totalAmount)
    .replace('{bookingReference}', bookingDetails.bookingReference);

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  return textContent || 'Your booking is confirmed!';
}

export async function generateNoResultsResponse(
  preferences: Record<string, any>
): Promise<string> {
  const prompt = `The user searched for hotels with these preferences: ${JSON.stringify(preferences)}

Unfortunately, no hotels matched their criteria. Write a helpful response that:
1. Acknowledges we couldn't find exact matches
2. Suggests specific adjustments they could make (expand budget, adjust dates, try different area)
3. Asks if they'd like to try again with modified criteria

Keep it conversational and helpful. Format: Respond ONLY with the message text.`;

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  return textContent || "I couldn't find any hotels matching your criteria. Would you like to adjust your search?";
}
