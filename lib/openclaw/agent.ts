// HonestNomad Agent Orchestrator
// Receives natural language from OpenClaw, uses Claude with tool-use to
// call our existing destination search + hotel search functions,
// and returns curated, branded responses.

import { getOpenRouterClient } from '@/lib/claude/client';
import { AGENT_SYSTEM_PROMPT, AGENT_TOOLS } from './systemPrompt';
import { searchDestinations, getDestinationById, DESTINATIONS } from '@/lib/flash/destinations';
import { searchHotelsForDiscoverFlow } from '@/lib/liteapi/hotels';
import { categorizeHotels } from '@/lib/hotels/categorize';
import { getHotelDetails, getHotelReviews } from '@/lib/liteapi/client';
import { formatTravelTime } from '@/lib/hotels/formatTravelTime';
import { getDestinationImages } from '@/lib/supabase/images';
import { createBookingSession, buildBookingUrl } from './sessions';
import type { HotelOption } from '@/lib/liteapi/types';
import type { MatchedDestination } from '@/types/location';
import type {
  AgentMessage,
  AgentChatResponse,
  AgentImage,
  AgentHotelSummary,
  AgentConversationState,
} from './types';

// Agent model — Haiku for speed + cost efficiency
const AGENT_MODEL = 'anthropic/claude-3.5-haiku';
const MAX_TOOL_ROUNDS = 5; // Safety valve: max tool-use round-trips per request

// ── Conversation state cache (in-memory, per session) ─────────────
// In production, this would be in Redis or Supabase. For v1, in-memory is fine
// since each Vercel function invocation is ephemeral anyway.
const sessionStates = new Map<string, AgentConversationState>();

/**
 * Main agent entry point.
 * Takes conversation messages, orchestrates tool calls, returns response.
 */
export async function runAgent(
  messages: AgentMessage[],
  sessionId: string,
): Promise<AgentChatResponse> {
  const client = getOpenRouterClient();

  // Restore or initialize conversation state
  let state = sessionStates.get(sessionId) || { step: 'idle' as const };

  // Build OpenAI-format messages
  const apiMessages: any[] = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    // Inject state context if we have destination/hotel data
    ...(state.destination ? [{
      role: 'system',
      content: buildStateContext(state),
    }] : []),
    // User conversation history
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  let response: any;
  let toolRounds = 0;
  const collectedImages: AgentImage[] = [];
  let bookingLink: string | undefined;

  // Tool-use loop: agent calls tools, we execute, feed results back
  while (toolRounds < MAX_TOOL_ROUNDS) {
    toolRounds++;

    response = await client.chat.completions.create({
      model: AGENT_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      messages: apiMessages,
      tools: AGENT_TOOLS,
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    // If no tool calls, we have our final response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      break;
    }

    // Add assistant message with tool calls to history
    apiMessages.push(assistantMessage);

    // Execute each tool call
    for (const toolCall of assistantMessage.tool_calls) {
      const { name, arguments: argsStr } = toolCall.function;
      let args: any;
      try {
        args = JSON.parse(argsStr);
      } catch {
        args = {};
      }

      let toolResult: string;

      try {
        switch (name) {
          case 'search_destination': {
            const result = await handleSearchDestination(args.query, state);
            toolResult = result.text;
            if (result.images) collectedImages.push(...result.images);
            if (result.state) state = { ...state, ...result.state };
            break;
          }
          case 'search_hotels': {
            const result = await handleSearchHotels(args, state);
            toolResult = result.text;
            if (result.images) collectedImages.push(...result.images);
            if (result.state) state = { ...state, ...result.state };
            break;
          }
          case 'select_hotel': {
            const result = await handleSelectHotel(args.hotelId, state);
            toolResult = result.text;
            if (result.bookingLink) bookingLink = result.bookingLink;
            if (result.state) state = { ...state, ...result.state };
            break;
          }
          default:
            toolResult = JSON.stringify({ error: `Unknown tool: ${name}` });
        }
      } catch (err) {
        console.error(`[openclaw/agent] Tool ${name} failed:`, err);
        toolResult = JSON.stringify({
          error: `Tool execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }

      // Add tool result to message history
      apiMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }
  }

  // Save state for next turn
  sessionStates.set(sessionId, state);

  // Extract final text response
  const finalText = response?.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue processing your request. Could you try again?';

  return {
    response: finalText,
    images: collectedImages.length > 0 ? collectedImages : undefined,
    bookingLink,
    sessionId,
    structuredData: buildStructuredData(state),
  };
}

// ── Tool Handlers ───────────────────────────────────────────────────

interface ToolResult {
  text: string;
  images?: AgentImage[];
  bookingLink?: string;
  state?: Partial<AgentConversationState>;
}

/**
 * Handle search_destination tool call.
 * Searches our 715 curated destinations by city/country/vibe.
 */
async function handleSearchDestination(
  query: string,
  currentState: AgentConversationState,
): Promise<ToolResult> {
  console.log(`[openclaw/agent] search_destination: "${query}"`);

  // Search by city/country/vibe
  const results = searchDestinations(query);

  if (results.length === 0) {
    // Try a broader search — match against any word
    const words = query.toLowerCase().split(/\s+/);
    const broadResults = DESTINATIONS.filter(d =>
      words.some(w =>
        d.city.toLowerCase().includes(w) ||
        d.country.toLowerCase().includes(w) ||
        d.vibes.some(v => v.includes(w)) ||
        d.region.includes(w)
      )
    ).slice(0, 5);

    if (broadResults.length === 0) {
      return {
        text: JSON.stringify({
          found: false,
          message: `No destinations found matching "${query}". We have 715 curated destinations across Europe, Asia, Americas, Africa, Oceania, the Middle East, and the Caribbean. Try a specific city name or a vibe like "beach", "culture", "adventure".`,
        }),
        state: { step: 'idle' },
      };
    }

    // Return broad results
    const summaries = broadResults.map(d => ({
      id: d.id,
      city: d.city,
      country: d.country,
      region: d.region,
      vibes: d.vibes,
      highlights: d.highlights.slice(0, 3),
      dailyCostPerPerson: d.dailyCosts
        ? (d.dailyCosts as any).food + (d.dailyCosts as any).activities + (d.dailyCosts as any).transport
        : undefined,
      bestMonths: d.bestMonths,
    }));

    return {
      text: JSON.stringify({
        found: true,
        matchType: 'broad',
        count: broadResults.length,
        destinations: summaries,
        message: `Found ${broadResults.length} destinations matching "${query}". Ask the user which one they'd like to explore.`,
      }),
    };
  }

  // Take best match (first result)
  const best = results[0];

  // Build matched destination object (same shape as our Discover flow uses)
  const matchedDest: MatchedDestination = {
    id: best.id,
    city: best.city,
    country: best.country,
    latitude: best.latitude,
    longitude: best.longitude,
    highlights: best.highlights,
    imageUrl: best.imageUrl,
    vibes: best.vibes,
    averageCost: best.averageCost,
    region: best.region,
  };

  // Get destination images
  const destImages = getDestinationImages(best.id, 3);
  const images: AgentImage[] = destImages.map((url, i) => ({
    url,
    alt: `${best.city}, ${best.country} - Photo ${i + 1}`,
    type: 'destination' as const,
  }));

  // Calculate daily costs if available
  let dailyCostInfo = '';
  if (best.dailyCosts) {
    const costs = best.dailyCosts as any;
    const total = (costs.food || 0) + (costs.activities || 0) + (costs.transport || 0);
    dailyCostInfo = `Daily cost estimate: ~$${total}/person (food: $${costs.food}, activities: $${costs.activities}, transport: $${costs.transport})`;
  }

  // Also return alternatives if multiple matches
  const alternatives = results.slice(1, 4).map(d => ({
    id: d.id,
    city: d.city,
    country: d.country,
    vibes: d.vibes,
    highlights: d.highlights.slice(0, 2),
  }));

  return {
    text: JSON.stringify({
      found: true,
      matchType: 'exact',
      destination: {
        id: best.id,
        city: best.city,
        country: best.country,
        region: best.region,
        vibes: best.vibes,
        highlights: best.highlights,
        bestMonths: best.bestMonths,
        dailyCostInfo,
        averageCostPerWeek: best.averageCost,
      },
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      imageUrls: destImages,
      message: `Found ${best.city}, ${best.country}. Present this to the user and ask about their travel dates and number of guests.`,
    }),
    images,
    state: {
      step: 'destination_found',
      destination: matchedDest,
      landmarkLat: best.latitude,
      landmarkLng: best.longitude,
    },
  };
}

/**
 * Handle search_hotels tool call.
 * Calls our existing hotel search + enrichment pipeline.
 */
async function handleSearchHotels(
  args: {
    destinationId: string;
    checkin: string;
    checkout: string;
    adults?: number;
    children?: number[];
  },
  currentState: AgentConversationState,
): Promise<ToolResult> {
  console.log(`[openclaw/agent] search_hotels: ${args.destinationId} ${args.checkin} to ${args.checkout}`);

  // Resolve destination if not already in state
  let destination = currentState.destination;
  let landmarkLat = currentState.landmarkLat;
  let landmarkLng = currentState.landmarkLng;

  if (!destination || destination.id !== args.destinationId) {
    const dest = getDestinationById(args.destinationId);
    if (!dest) {
      return {
        text: JSON.stringify({ error: `Destination ${args.destinationId} not found. Use search_destination first.` }),
      };
    }
    destination = {
      id: dest.id,
      city: dest.city,
      country: dest.country,
      latitude: dest.latitude,
      longitude: dest.longitude,
      highlights: dest.highlights,
      imageUrl: dest.imageUrl,
      vibes: dest.vibes,
      averageCost: dest.averageCost,
      region: dest.region,
    };
    landmarkLat = dest.latitude;
    landmarkLng = dest.longitude;
  }

  const adults = args.adults || 2;
  const children = args.children || [];

  // Extract country code from destination
  // Look up the full destination to get the country code
  const fullDest = getDestinationById(args.destinationId);

  // Search hotels using our existing pipeline
  const searchResult = await searchHotelsForDiscoverFlow({
    landmarkLat: landmarkLat!,
    landmarkLng: landmarkLng!,
    checkin: args.checkin,
    checkout: args.checkout,
    adults,
    children,
    cityName: destination.city,
    countryCode: fullDest?.country, // Pass country name, the function handles it
  });

  if (searchResult.hotels.length === 0) {
    return {
      text: JSON.stringify({
        found: false,
        message: `No hotels found in ${destination.city} for those dates. This could be due to limited availability. Try different dates or a nearby destination.`,
      }),
      state: { step: 'searching_hotels' },
    };
  }

  // Enrich hotels (details + reviews) — same as discover-search endpoint
  const allIds = searchResult.hotels.map(h => h.id);
  console.log(`[openclaw/agent] Enriching ${allIds.length} hotels...`);

  const [detailsResults, reviewsResults] = await Promise.all([
    Promise.all(allIds.map(id => getHotelDetails(id).catch(() => null))),
    Promise.all(allIds.map(id => getHotelReviews(id, 3).catch(() => ({ reviews: [], total: 0 })))),
  ]);

  // Apply enrichment
  for (let i = 0; i < allIds.length; i++) {
    const details = detailsResults[i];
    const reviewData = reviewsResults[i];
    const hotel = searchResult.hotels[i];

    if (details) {
      const images = details.hotelImages?.slice(0, 10) || [];
      hotel.photos = images.map(img => img.url).filter(Boolean);
      hotel.photosHd = images.map(img => img.urlHd || img.url).filter(Boolean);
      hotel.amenities = details.hotelFacilities?.slice(0, 15) || hotel.amenities;
      hotel.chain = details.chain || undefined;

      if (details.hotelImportantInformation) {
        hotel.hotelImportantInformation = details.hotelImportantInformation.slice(0, 500);
      }

      const firstRoom = details.rooms?.[0];
      if (firstRoom) {
        hotel.roomDetails = {
          roomSizeSquare: firstRoom.roomSizeSquare || undefined,
          roomSizeUnit: firstRoom.roomSizeUnit || undefined,
          maxOccupancy: firstRoom.maxOccupancy || undefined,
          maxAdults: firstRoom.maxAdults || undefined,
          maxChildren: firstRoom.maxChildren || undefined,
          bedTypes: firstRoom.bedTypes?.map(bt => ({
            bedType: bt.bedType,
            bedSize: bt.bedSize,
            quantity: bt.quantity,
          })),
          views: firstRoom.views?.map(v => v.view),
        };
      }
    }

    if (reviewData?.reviews?.length) {
      hotel.reviews = reviewData.reviews.slice(0, 3).map(r => ({
        averageScore: r.averageScore,
        name: r.name,
        country: r.country,
        date: r.date,
        headline: r.headline,
        pros: r.pros,
        cons: r.cons,
      }));
      hotel.reviewsTotal = reviewData.total;
    }

    // Synthetic cancel deadline (same as discover-search)
    if (hotel.refundable && args.checkin) {
      const deadlineDate = new Date(args.checkin);
      deadlineDate.setDate(deadlineDate.getDate() - 2);
      hotel.cancelDeadline = `Free cancellation until ${deadlineDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })}`;
    }
  }

  // Categorize
  const featured = categorizeHotels(searchResult.hotels, landmarkLat!, landmarkLng!);

  // Calculate rate expiry (find earliest expiry across all hotels)
  const earliestExpiry = Math.min(...searchResult.hotels.map(h => h.expiresAt).filter(Boolean));
  const expiryMinutes = Math.max(1, Math.round((earliestExpiry - Date.now()) / 60000));

  // Build hotel summaries for the agent
  const hotelSummaries = buildHotelSummaries(searchResult.hotels, featured, landmarkLat!, landmarkLng!);

  // Collect featured hotel images
  const images: AgentImage[] = [];
  if (featured) {
    const featuredHotels = [featured.closest, featured.budget, featured.highEnd];
    for (const h of featuredHotels) {
      const photoUrl = h.photosHd?.[0] || h.mainPhoto;
      if (photoUrl) {
        images.push({
          url: photoUrl,
          alt: `${h.name} - ${h.stars}★`,
          type: 'hotel',
        });
      }
    }
  }

  // Build static map URL (Mapbox Static Images API)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (mapboxToken && featured) {
    const pins = [
      `pin-l-star+ff0000(${landmarkLng},${landmarkLat})`, // Landmark
      `pin-s-lodging+0066ff(${featured.closest.longitude},${featured.closest.latitude})`,
      `pin-s-lodging+00cc66(${featured.budget.longitude},${featured.budget.latitude})`,
      `pin-s-lodging+9933ff(${featured.highEnd.longitude},${featured.highEnd.latitude})`,
    ].join(',');
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}/auto/600x400@2x?access_token=${mapboxToken}`;
    images.push({
      url: mapUrl,
      alt: `Map showing hotels near ${destination.city}`,
      type: 'map',
    });
  }

  return {
    text: JSON.stringify({
      found: true,
      totalHotels: searchResult.hotels.length,
      featured: featured ? {
        recommended: hotelSummaries.find(h => h.role === 'closest'),
        bestValue: hotelSummaries.find(h => h.role === 'budget'),
        premiumPick: hotelSummaries.find(h => h.role === 'high_end'),
      } : null,
      allHotels: hotelSummaries.slice(0, 10), // Limit to 10 for token efficiency
      rateExpiryMinutes: expiryMinutes,
      searchRadius: `${searchResult.radiusUsed}km`,
      message: `Found ${searchResult.hotels.length} hotels. Present the 3 featured picks prominently. Mention the rate is live for ${expiryMinutes} minutes. If the user wants more options, share from the allHotels list.`,
    }),
    images,
    state: {
      step: 'hotels_found',
      allHotels: searchResult.hotels,
      featured: featured || undefined,
      checkin: args.checkin,
      checkout: args.checkout,
      guests: { adults, children },
      rateExpiresAt: earliestExpiry,
    },
  };
}

/**
 * Handle select_hotel tool call.
 * Creates a booking session and returns a secure checkout link.
 */
async function handleSelectHotel(
  hotelId: string,
  currentState: AgentConversationState,
): Promise<ToolResult> {
  console.log(`[openclaw/agent] select_hotel: ${hotelId}`);

  if (!currentState.allHotels || !currentState.destination) {
    return {
      text: JSON.stringify({ error: 'No hotel search results in current session. Please search for hotels first.' }),
    };
  }

  const hotel = currentState.allHotels.find(h => h.id === hotelId);
  if (!hotel) {
    return {
      text: JSON.stringify({ error: `Hotel ${hotelId} not found in current search results.` }),
    };
  }

  if (!currentState.checkin || !currentState.checkout || !currentState.guests) {
    return {
      text: JSON.stringify({ error: 'Missing trip details (dates/guests). Please search for hotels first.' }),
    };
  }

  // Create booking session
  try {
    const { token, expiresAt } = await createBookingSession({
      hotel,
      destination: currentState.destination,
      checkin: currentState.checkin,
      checkout: currentState.checkout,
      guests: currentState.guests,
      landmarkLat: currentState.landmarkLat!,
      landmarkLng: currentState.landmarkLng!,
      source: 'openclaw',
    });

    const bookingUrl = buildBookingUrl(token);

    // Calculate nights
    const nights = Math.max(1, Math.round(
      (new Date(currentState.checkout).getTime() - new Date(currentState.checkin).getTime()) / (1000 * 60 * 60 * 24)
    ));

    return {
      text: JSON.stringify({
        success: true,
        bookingUrl,
        expiresAt,
        hotel: {
          name: hotel.name,
          stars: hotel.stars,
          pricePerNight: hotel.pricePerNight,
          totalPrice: hotel.totalPrice,
          currency: hotel.currency,
          nights,
          refundable: hotel.refundable,
          cancelDeadline: hotel.cancelDeadline,
        },
        message: `Booking link generated! The user should open this link in their browser to complete the booking securely. The link expires in 30 minutes and can only be used once. Emphasize that payment is handled securely on our site — no payment info goes through the chat.`,
      }),
      bookingLink: bookingUrl,
      state: {
        step: 'hotel_selected',
        selectedHotel: hotel,
      },
    };
  } catch (err) {
    console.error('[openclaw/agent] Failed to create booking session:', err);
    return {
      text: JSON.stringify({
        error: 'Failed to create booking link. This may be a temporary issue. Please try again.',
      }),
    };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Build hotel summaries for agent consumption (smaller than full HotelOption).
 */
function buildHotelSummaries(
  hotels: HotelOption[],
  featured: ReturnType<typeof categorizeHotels>,
  landmarkLat: number,
  landmarkLng: number,
): AgentHotelSummary[] {
  const featuredIds = new Set<string>();
  if (featured) {
    featuredIds.add(featured.closest.id);
    featuredIds.add(featured.budget.id);
    featuredIds.add(featured.highEnd.id);
  }

  return hotels.map(h => {
    const travelTime = formatTravelTime(h.distanceFromZoneCenter);
    let role: AgentHotelSummary['role'] = 'other';
    if (featured) {
      if (h.id === featured.closest.id) role = 'closest';
      else if (h.id === featured.budget.id) role = 'budget';
      else if (h.id === featured.highEnd.id) role = 'high_end';
    }

    return {
      id: h.id,
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      reviewCount: h.reviewCount,
      pricePerNight: h.pricePerNight,
      totalPrice: h.totalPrice,
      currency: h.currency,
      walkTime: travelTime ? `${travelTime.emoji} ${travelTime.label}` : null,
      amenities: h.amenities.slice(0, 5),
      refundable: h.refundable,
      cancelDeadline: h.cancelDeadline,
      chain: h.chain,
      boardName: h.boardName,
      photoUrl: h.photosHd?.[0] || h.mainPhoto || '',
      role,
    };
  });
}

/**
 * Build context string from conversation state for the system prompt.
 */
function buildStateContext(state: AgentConversationState): string {
  const parts: string[] = ['Current conversation context:'];

  if (state.destination) {
    parts.push(`- Destination: ${state.destination.city}, ${state.destination.country} (ID: ${state.destination.id})`);
  }
  if (state.checkin && state.checkout) {
    parts.push(`- Dates: ${state.checkin} to ${state.checkout}`);
  }
  if (state.guests) {
    parts.push(`- Guests: ${state.guests.adults} adults${state.guests.children.length > 0 ? `, ${state.guests.children.length} children` : ''}`);
  }
  if (state.allHotels) {
    parts.push(`- Hotels loaded: ${state.allHotels.length} options available`);
  }
  if (state.rateExpiresAt) {
    const minutesLeft = Math.max(0, Math.round((state.rateExpiresAt - Date.now()) / 60000));
    parts.push(`- Rate validity: ~${minutesLeft} minutes remaining`);
  }
  if (state.selectedHotel) {
    parts.push(`- Selected hotel: ${state.selectedHotel.name} ($${state.selectedHotel.pricePerNight}/night)`);
  }

  return parts.join('\n');
}

/**
 * Build structured data from state for the response.
 */
function buildStructuredData(state: AgentConversationState): AgentChatResponse['structuredData'] {
  const stepMap: Record<string, AgentChatResponse['structuredData']> = {};

  if (state.step === 'destination_found' && state.destination) {
    return {
      step: 'destination_results',
      destination: {
        city: state.destination.city,
        country: state.destination.country,
        vibes: state.destination.vibes || [],
        highlights: state.destination.highlights,
      },
    };
  }

  if (state.step === 'hotels_found' && state.allHotels) {
    const summaries = buildHotelSummaries(
      state.allHotels.slice(0, 5),
      state.featured ? { closest: state.featured.closest, budget: state.featured.budget, highEnd: state.featured.highEnd } : null,
      state.landmarkLat || 0,
      state.landmarkLng || 0,
    );
    return {
      step: 'hotel_results',
      hotels: summaries,
    };
  }

  if (state.step === 'hotel_selected' && state.selectedHotel) {
    const travelTime = formatTravelTime(state.selectedHotel.distanceFromZoneCenter);
    return {
      step: 'booking_ready',
      selectedHotel: {
        id: state.selectedHotel.id,
        name: state.selectedHotel.name,
        stars: state.selectedHotel.stars,
        rating: state.selectedHotel.rating,
        reviewCount: state.selectedHotel.reviewCount,
        pricePerNight: state.selectedHotel.pricePerNight,
        totalPrice: state.selectedHotel.totalPrice,
        currency: state.selectedHotel.currency,
        walkTime: travelTime ? `${travelTime.emoji} ${travelTime.label}` : null,
        amenities: state.selectedHotel.amenities.slice(0, 5),
        refundable: state.selectedHotel.refundable,
        cancelDeadline: state.selectedHotel.cancelDeadline,
        chain: state.selectedHotel.chain,
        boardName: state.selectedHotel.boardName,
        photoUrl: state.selectedHotel.photosHd?.[0] || state.selectedHotel.mainPhoto || '',
        role: 'closest',
      },
    };
  }

  return { step: 'destination_search' };
}
