import { openrouter, MODEL } from './client';
import { RESULTS_PROMPT, BOOKING_CONFIRMATION_PROMPT, FLIGHT_RESULTS_PROMPT } from './prompts';
import type { NormalizedHotel } from '@/types/hotel';
import type { NormalizedFlight } from '@/types/flight';

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

export async function generateFlightResultsResponse(
  flights: NormalizedFlight[],
  userPreferences: Record<string, any>,
  originalQuery: string
): Promise<string> {
  const flightSummaries = flights
    .slice(0, 5)
    .map((f, i) => {
      const outbound = f.slices[0];
      const returnFlight = f.slices[1];
      const departTime = new Date(outbound.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const arriveTime = new Date(outbound.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let summary = `
Flight ${i + 1}: ${f.airlines.map(a => a.name).join(' + ')}
- Route: ${outbound.origin} → ${outbound.destination}
- Departs: ${departTime}, Arrives: ${arriveTime}
- Duration: ${formatDuration(outbound.duration)}
- Stops: ${outbound.stops === 0 ? 'Direct' : `${outbound.stops} stop(s)`}
- Price: $${f.pricing.perPassenger}/person ($${f.pricing.totalAmount} total)
- Cabin: ${f.cabinClass}
- Baggage: ${f.baggageAllowance?.checkedBags ? `${f.baggageAllowance.checkedBags} checked bag(s) included` : 'Carry-on only'}
- ID: ${f.id}`;

      if (returnFlight) {
        const returnDepart = new Date(returnFlight.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        summary += `\n- Return: ${returnFlight.origin} → ${returnFlight.destination} at ${returnDepart}`;
      }

      return summary;
    })
    .join('\n');

  const prompt = FLIGHT_RESULTS_PROMPT.replace('{query}', originalQuery)
    .replace('{preferences}', JSON.stringify(userPreferences))
    .replace('{flightSummaries}', flightSummaries);

  const response = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  return textContent || 'I found some flight options but had trouble formatting them. Please try again.';
}

function formatDuration(duration: string): string {
  // Parse ISO 8601 duration like PT2H30M
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    if (minutes) return `${minutes}m`;
  }
  return duration;
}
