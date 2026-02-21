/**
 * Trip Narrative Generator
 *
 * Generates AI-written day-by-day narrative prose for the package step.
 * Uses Claude Haiku 3.5 via OpenRouter for fast, grounded, casual writing.
 *
 * The narrative complements (not replaces) the structured stop cards —
 * it adds story and flow to what is otherwise a data listing.
 */

import { getOpenRouterClient } from '@/lib/claude/client';
import { loadDestinationFacts } from '@/lib/flash/tripIntelligence';
import type {
  TripNarrativeRequest,
  TripNarrativeResponse,
} from '@/types/trip-narrative';

const HAIKU_MODEL = 'anthropic/claude-3-5-haiku-latest';

// ── In-memory cache ──────────────────────────────────────────────────
// Prevents re-generation on back/forward navigation within the same session.
// Key: deterministic hash of destination + stops + preferences
// TTL: 30 minutes

const narrativeCache = new Map<
  string,
  { data: TripNarrativeResponse; ts: number }
>();
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 50;

function buildCacheKey(req: TripNarrativeRequest): string {
  const parts = [
    req.destinationId,
    req.pathType,
    req.travelerType,
    req.days.length.toString(),
    req.days
      .map((d) => d.stops.map((s) => s.name).join(','))
      .join('|'),
  ];
  return parts.join('::');
}

function evictOldEntries(): void {
  if (narrativeCache.size <= MAX_CACHE_SIZE) return;
  const oldest = Array.from(narrativeCache.entries())
    .sort((a, b) => a[1].ts - b[1].ts);
  for (let i = 0; i < 10; i++) {
    narrativeCache.delete(oldest[i][0]);
  }
}

// ── Prompt builder ───────────────────────────────────────────────────

function buildPrompt(
  req: TripNarrativeRequest,
  weatherDescription?: string,
): string {
  const dayBlocks = req.days
    .map((day) => {
      const stopLines = day.stops
        .map((s) => {
          const parts = [`- ${s.name} (${s.type}`];
          if (s.bestTimeOfDay && s.bestTimeOfDay !== 'any')
            parts.push(`best: ${s.bestTimeOfDay}`);
          if (s.duration) parts.push(s.duration);
          if (s.rating) parts.push(`${s.rating}/5`);
          if (s.isFavorite) parts.push('FAVORITE');
          if (s.walkMinFromHotel)
            parts.push(`${s.walkMinFromHotel}min walk from hotel`);
          return parts.join(', ') + ')';
        })
        .join('\n');

      const header = `DAY ${day.dayIndex + 1}: ${day.zoneLabel} Zone (~${day.totalHours}hr${
        day.walkMinFromHotel
          ? `, ${day.walkMinFromHotel}min walk from hotel`
          : ''
      })`;

      return `${header}\n${stopLines}`;
    })
    .join('\n\n');

  const hotelLine = req.hotel
    ? `Hotel: ${req.hotel.name} (${req.hotel.stars}-star)`
    : '';

  const weatherLine = weatherDescription
    ? `Weather: ${weatherDescription}`
    : '';

  const favLine =
    req.favoriteNames.length > 0
      ? `The traveler specifically saved these as favorites: ${req.favoriteNames.join(', ')}`
      : '';

  return `You are writing a day-by-day narrative for a trip to ${req.destinationCity}, ${req.destinationCountry}.
Traveler type: ${req.travelerType}
Trip style: ${req.pathType}
${hotelLine}
${weatherLine}
${favLine}

Here are the days and their stops:

${dayBlocks}

Write a brief, engaging narrative for EACH day. Rules:
1. 3-5 sentences per day. Be punchy and practical, like a friend texting their recommended day.
2. Reference ACTUAL stop names from the data. Do NOT invent or add any place that is not listed.
3. Weave in time-of-day suggestions naturally ("start your morning at...", "by evening...").
4. If a stop is marked FAVORITE, give it a personal touch ("you flagged this one — don't skip it").
5. Mention weather context naturally when relevant ("beat the afternoon heat at...", "cool mornings are perfect for...").
6. Match tone to traveler type: solo=independent/empowering, couple=romantic/intimate, family=kid-friendly/practical, group=social/energetic.
7. Match tone to trip style: foodie=food-focused, adventure=thrill-focused, cultural=history/art-focused, relaxation=peaceful/restorative, nightlife=after-dark/party, trendy=local/hipster, classic=iconic/bucket-list.
8. Do NOT use flowery or overwrought language. No "hidden gem awaits" or "prepare to be dazzled" or "nestled in". Keep it casual and direct.
9. Include walk times from hotel where available ("it's a quick 8-minute walk from your hotel").
10. Do NOT start every day with "Start your morning" — vary the openings.

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{"dayNarratives": {"0": "Day 1 narrative...", "1": "Day 2 narrative..."}}`;
}

// ── Main generation function ─────────────────────────────────────────

export async function generateTripNarrative(
  req: TripNarrativeRequest,
): Promise<TripNarrativeResponse> {
  // Check cache
  const cacheKey = buildCacheKey(req);
  const cached = narrativeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  // Load weather server-side from destination facts
  let weatherDescription: string | undefined;
  if (req.destinationId && req.departureDate) {
    try {
      const facts = loadDestinationFacts(req.destinationId);
      if (facts?.weather) {
        const month = new Date(req.departureDate).getMonth() + 1;
        const w = facts.weather.find((m) => m.month === month) || facts.weather[0];
        if (w) {
          weatherDescription = `${w.description} (highs ~${w.avgHighC}°C / ${Math.round(w.avgHighC * 1.8 + 32)}°F, lows ~${w.avgLowC}°C / ${Math.round(w.avgLowC * 1.8 + 32)}°F, rain: ${w.rainProbability})`;
        }
      }
    } catch {
      // Weather is optional context — skip if unavailable
    }
  }

  const client = getOpenRouterClient();
  const prompt = buildPrompt(req, weatherDescription);

  const response = await client.chat.completions.create({
    model: HAIKU_MODEL,
    max_tokens: 600,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error('No response from narrative LLM');
  }

  // Parse JSON — handle markdown code fences if present
  let jsonText = textContent.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
  else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
  if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
  jsonText = jsonText.trim();

  const parsed = JSON.parse(jsonText) as TripNarrativeResponse;

  // Validate structure
  if (!parsed.dayNarratives || typeof parsed.dayNarratives !== 'object') {
    throw new Error('Invalid narrative response structure');
  }

  // Cache result
  narrativeCache.set(cacheKey, { data: parsed, ts: Date.now() });
  evictOldEntries();

  return parsed;
}
