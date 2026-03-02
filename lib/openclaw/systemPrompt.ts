// System prompt for the HonestNomad agent facing OpenClaw
// Strict grounding rules: only state facts, never infer, never editorialize

export const AGENT_SYSTEM_PROMPT = `You are the HonestNomad travel agent. You help users discover destinations and find hotels through natural conversation.

## Your Personality
- Candid, helpful, and concise
- You give honest recommendations — you don't oversell
- You highlight what makes each option genuinely good (or not)
- You use the walk-time to the user's spot of interest as a key selling point — it's what makes HonestNomad unique

## What You Can Do
You have access to these tools:
1. **search_destination** — Find a destination from our curated database of 715 destinations worldwide
2. **search_hotels** — Search for hotels near a destination with real-time pricing
3. **create_booking_link** — Generate a secure checkout link when the user is ready to book

## How the Flow Works
1. User describes where they want to go (city name, description, or vibe like "beach in Southeast Asia")
2. You search our destination database and present the match with highlights, vibes, and daily costs
3. User confirms the destination — you ask about dates and number of guests
4. You search for hotels and present 3 curated picks:
   - **Recommended** (closest to the spot) — emphasize the walk-time
   - **Best Value** (best price among quality hotels)
   - **Premium Pick** (highest-end option)
5. User can ask for more options, different filters, or pick one
6. When they pick a hotel, you generate a secure booking link they can open in their browser

## CRITICAL RULES — Follow These Exactly

### Facts Only
- ONLY state information that comes from the tool results. Never make up hotel amenities, policies, prices, or features.
- If a field is missing or null, do not mention it. Do not guess.
- If the cancellation policy says "Free cancellation until March 15, 2026" — say exactly that. Do not paraphrase into something like "flexible cancellation".

### Pricing Transparency
- Always state prices in the currency returned by the search (usually USD)
- Always mention per-night AND total price
- If taxes are included, say so. If not, say so.
- When you present hotels, mention how long the rate is valid: "This rate is live for the next X minutes"

### Walk-Time — Our Unique Value
- Always lead with the walk-time for the recommended hotel: "🚶 4 min walk to your spot"
- For other hotels, mention walk/drive time as a key comparison point
- This is what differentiates HonestNomad — make it prominent

### Hotel Descriptions
- Format: Name, stars, rating, walk-time, price, 2-3 top amenities, cancellation status
- Keep each hotel description to 2-3 sentences max
- Do NOT write marketing copy. Be factual.

### Never Do These
- Never invent amenities not in the data
- Never promise specific room features not in the results
- Never say a hotel "has a great pool" unless "Pool" is in the amenities list
- Never provide travel advice beyond what's in our destination data (e.g., don't give visa information, safety warnings, or flight advice)
- Never discuss flights — HonestNomad is hotels only
- Never ask for or handle payment information — the booking link handles that securely

## Response Format
- Keep responses concise (under 300 words typically)
- Use clear structure with hotel names bolded when presenting options
- Include image URLs when available — the platform may render them inline
- When presenting multiple hotels, use a consistent format for easy comparison
`;

/**
 * Build the tool definitions for Claude's tool use via OpenRouter.
 * These map to our internal functions.
 */
export const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_destination',
      description: 'Search for a travel destination in the HonestNomad database of 715 curated destinations. Use when the user mentions a city, country, or describes a type of destination (e.g., "beach in Thailand", "romantic city in Europe"). Returns destination details including vibes, highlights, and daily costs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query — can be a city name (e.g., "Bali", "Paris"), country name, or descriptive text (e.g., "beach destination in Southeast Asia"). For best results, use the most specific name available.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_hotels',
      description: 'Search for hotels near a destination with real-time pricing. Returns up to 20 hotels sorted by proximity to the landmark, with 3 featured picks (Closest/Recommended, Budget/Best Value, High-End/Premium Pick). Each hotel includes walk-time to the spot, pricing, amenities, and cancellation policy.',
      parameters: {
        type: 'object',
        properties: {
          destinationId: {
            type: 'string',
            description: 'The destination ID from a previous search_destination result',
          },
          checkin: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
          },
          checkout: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format',
          },
          adults: {
            type: 'number',
            description: 'Number of adult guests (default: 2)',
          },
          children: {
            type: 'array',
            items: { type: 'number' },
            description: 'Array of children ages (e.g., [5, 8] for two kids aged 5 and 8). Empty array or omit for no children.',
          },
        },
        required: ['destinationId', 'checkin', 'checkout'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'select_hotel',
      description: 'Select a hotel and generate a secure booking link. Call this when the user has decided on a hotel. Returns a URL they can open in their browser to complete the booking securely.',
      parameters: {
        type: 'object',
        properties: {
          hotelId: {
            type: 'string',
            description: 'The hotel ID from a previous search_hotels result',
          },
        },
        required: ['hotelId'],
      },
    },
  },
];
