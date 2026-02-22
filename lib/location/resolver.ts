/**
 * Social Location Resolver
 *
 * Resolves geographic locations from social media URLs and uploaded images.
 * Pipeline: oEmbed metadata → Claude caption analysis → Claude Vision → Mapbox geocoding → destination matching
 *
 * Uses Claude Haiku 3.5 via OpenRouter for both text and vision analysis.
 * Sequential escalation: cheap text analysis first, vision only if needed.
 */

import { getOpenRouterClient } from '@/lib/claude/client';
import { DESTINATIONS } from '@/lib/flash/destinations';
import type {
  AnalyzeLocationRequest,
  LocationAnalysisResponse,
  ClaudeLocationResult,
  ResolvedLocation,
  MatchedDestination,
} from '@/types/location';

const HAIKU_MODEL = 'anthropic/claude-3-5-haiku-latest';
const FETCH_TIMEOUT_MS = 10_000;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// ── Main entry point ─────────────────────────────────────────────────

export async function resolveLocation(
  req: AnalyzeLocationRequest,
): Promise<LocationAnalysisResponse> {
  let claudeResult: ClaudeLocationResult | null = null;
  let source: ResolvedLocation['source'] = 'vision';

  // === PATH A: URL INPUT ===
  if (req.url) {
    // Step 1: Extract metadata via oEmbed / OG tags
    const metadata = await extractMetadata(req.url);

    // Step 2: Try caption analysis first (cheap, text-only)
    if (metadata.caption && metadata.caption.length > 5) {
      claudeResult = await analyzeCaption(metadata.caption);
      source = 'caption';
    }

    // Step 3: If caption didn't give high confidence, try vision on thumbnail
    if ((!claudeResult || claudeResult.confidence === 'low') && metadata.thumbnail) {
      const thumbnailBase64 = await fetchImageAsBase64(metadata.thumbnail);
      if (thumbnailBase64) {
        const visionResult = await analyzeImage(
          thumbnailBase64,
          metadata.caption || undefined,
        );
        // Take vision result if it's better than caption result
        if (!claudeResult || visionResult.confidence === 'high') {
          claudeResult = visionResult;
          source = 'vision';
        }
      }
    }

    // Step 4: If we still have nothing, try treating the URL title/description as metadata
    if (!claudeResult && metadata.caption) {
      claudeResult = {
        city: null,
        country: null,
        region: null,
        locationString: null,
        confidence: 'low',
        reasoning: 'Could not extract location information from this link.',
      };
      source = 'metadata';
    }
  }

  // === PATH B: IMAGE UPLOAD ===
  if (req.imageBase64) {
    claudeResult = await analyzeImage(req.imageBase64, undefined);
    source = 'vision';
  }

  // No result at all
  if (!claudeResult || !claudeResult.locationString) {
    return {
      success: true,
      location: null,
      matchedDestination: null,
      error: claudeResult?.reasoning || 'Could not determine a location from this input.',
    };
  }

  // === GEOCODE ===
  const geocoded = await geocodeLocation(claudeResult.locationString);
  if (!geocoded) {
    return {
      success: true,
      location: null,
      matchedDestination: null,
      error: `Identified as "${claudeResult.locationString}" but could not find it on the map.`,
    };
  }

  // === MATCH TO OUR DESTINATIONS ===
  const matched = matchDestination(
    claudeResult.city,
    claudeResult.country,
    geocoded.lat,
    geocoded.lng,
  );

  const location: ResolvedLocation = {
    city: claudeResult.city,
    country: claudeResult.country,
    locationString: claudeResult.locationString,
    lat: geocoded.lat,
    lng: geocoded.lng,
    displayName: geocoded.displayName,
    confidence: claudeResult.confidence,
    reasoning: claudeResult.reasoning,
    source,
  };

  return {
    success: true,
    location,
    matchedDestination: matched,
  };
}

// ── Metadata extraction (oEmbed + OG fallback) ──────────────────────

interface SocialMetadata {
  thumbnail: string | null;
  caption: string | null;
}

function detectPlatform(url: string): 'tiktok' | 'youtube' | 'instagram' | 'unknown' {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

async function extractMetadata(url: string): Promise<SocialMetadata> {
  const platform = detectPlatform(url);

  // Try platform-specific oEmbed first
  if (platform === 'tiktok') {
    const result = await fetchTikTokOEmbed(url);
    if (result.thumbnail || result.caption) return result;
  }

  if (platform === 'youtube') {
    const result = await fetchYouTubeOEmbed(url);
    if (result.thumbnail || result.caption) return result;
  }

  // Fallback: extract OG tags directly from URL
  return await fetchOGTags(url);
}

async function fetchTikTokOEmbed(url: string): Promise<SocialMetadata> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(oembedUrl, FETCH_TIMEOUT_MS);
    if (!response.ok) return { thumbnail: null, caption: null };

    const data = await response.json();
    return {
      thumbnail: data.thumbnail_url || null,
      caption: data.title || null,
    };
  } catch {
    return { thumbnail: null, caption: null };
  }
}

async function fetchYouTubeOEmbed(url: string): Promise<SocialMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetchWithTimeout(oembedUrl, FETCH_TIMEOUT_MS);
    if (!response.ok) return { thumbnail: null, caption: null };

    const data = await response.json();
    // YouTube oEmbed doesn't return thumbnail directly, extract from known pattern
    const videoId = extractYouTubeVideoId(url);
    const thumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

    return {
      thumbnail,
      caption: data.title || null,
    };
  } catch {
    return { thumbnail: null, caption: null };
  }
}

function extractYouTubeVideoId(url: string): string | null {
  // Handle youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchOGTags(url: string): Promise<SocialMetadata> {
  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; HonestNomad/1.0; +https://honestnomad.com)',
      },
      redirect: 'follow',
    });
    if (!response.ok) return { thumbnail: null, caption: null };

    const html = await response.text();
    const thumbnail =
      html.match(
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      )?.[1] ||
      html.match(
        /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      )?.[1] ||
      null;
    const caption =
      html.match(
        /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
      )?.[1] ||
      html.match(
        /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i,
      )?.[1] ||
      html.match(
        /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
      )?.[1] ||
      null;

    return { thumbnail, caption };
  } catch {
    return { thumbnail: null, caption: null };
  }
}

// ── Image fetching (thumbnail URL → base64) ─────────────────────────

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(imageUrl, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch {
    return null;
  }
}

// ── Claude: Caption analysis (text-only, cheap) ─────────────────────

async function analyzeCaption(caption: string): Promise<ClaudeLocationResult> {
  const client = getOpenRouterClient();

  try {
    const response = await client.chat.completions.create({
      model: HAIKU_MODEL,
      max_tokens: 512,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are a geographic location identifier. Extract the location from this social media caption.

RULES:
1. Return ONLY valid JSON. No explanation, no markdown fences, no preamble.
2. If the caption clearly names a city or contains emoji flags (🇹🇭🇫🇷🇮🇩), confidence is "high".
3. If the caption is vague or could be multiple places, confidence is "low".
4. If no location is identifiable, return null for city/country/locationString with confidence "low".

RETURN THIS EXACT JSON:
{
  "city": "string or null",
  "country": "string or null",
  "region": "string or null",
  "locationString": "string or null — best single geocodable search string like 'Chiang Mai, Thailand'",
  "confidence": "high or low",
  "reasoning": "one sentence explaining your identification"
}

Caption: "${caption}"`,
        },
      ],
    });

    const text =
      response.choices[0]?.message?.content?.trim() || '';
    return parseClaudeJSON(text);
  } catch (error) {
    console.error('[location-resolver] Caption analysis failed:', error);
    return {
      city: null,
      country: null,
      region: null,
      locationString: null,
      confidence: 'low',
      reasoning: 'Caption analysis failed.',
    };
  }
}

// ── Claude: Vision analysis (image + optional caption) ───────────────

async function analyzeImage(
  imageBase64: string,
  caption?: string,
): Promise<ClaudeLocationResult> {
  const client = getOpenRouterClient();

  const promptText = `You are a geographic location identifier for a travel app.

Analyze this image and determine where in the world it was taken or filmed.

RULES:
1. Return ONLY valid JSON. No explanation, no markdown fences, no preamble.
2. Never guess wildly. If you cannot identify a specific city, confidence is "low".
3. "high" confidence means you are 85%+ certain of the specific city.
4. "low" confidence means you cannot identify a specific city.

WHAT TO LOOK FOR (in order of reliability):
1. Visible text: street signs, hotel names, restaurant names, menus, license plates, language
2. Famous landmarks: monuments, distinctive architecture, natural features
3. Skyline or coastline silhouettes
4. Vegetation type: tropical palms, rice terraces, alpine forests, desert scrub
5. Architecture style: colonial, Southeast Asian, European, Middle Eastern
6. Water color and type: Caribbean turquoise, Mediterranean blue, river, waterfall
7. General climate and terrain

RETURN THIS EXACT JSON:
{
  "city": "string or null",
  "country": "string or null",
  "region": "string or null",
  "locationString": "string or null — best single geocodable search string like 'Canggu, Bali, Indonesia'",
  "confidence": "high or low",
  "reasoning": "one sentence explaining your identification"
}

${caption ? `Caption context (use as supporting evidence): "${caption}"` : 'No caption available.'}`;

  try {
    const response = await client.chat.completions.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: promptText,
            },
          ],
        },
      ],
    });

    const text =
      response.choices[0]?.message?.content?.trim() || '';
    return parseClaudeJSON(text);
  } catch (error) {
    console.error('[location-resolver] Vision analysis failed:', error);
    return {
      city: null,
      country: null,
      region: null,
      locationString: null,
      confidence: 'low',
      reasoning: 'Vision analysis failed.',
    };
  }
}

// ── Mapbox Geocoding ─────────────────────────────────────────────────

async function geocodeLocation(
  locationString: string,
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  if (!MAPBOX_TOKEN) {
    console.error('[location-resolver] MAPBOX_TOKEN not set');
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      locationString,
    )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const [lng, lat] = data.features[0].center;
    return { lat, lng, displayName: data.features[0].place_name };
  } catch (error) {
    console.error('[location-resolver] Geocoding failed:', error);
    return null;
  }
}

// ── Destination Matching ─────────────────────────────────────────────

function matchDestination(
  city: string | null,
  country: string | null,
  lat: number,
  lng: number,
): MatchedDestination | null {
  // 1. Try exact city name match (case-insensitive)
  if (city) {
    const cityLower = city.toLowerCase();
    const exact = DESTINATIONS.find(
      (d) => d.city.toLowerCase() === cityLower,
    );
    if (exact) {
      return {
        id: exact.id,
        city: exact.city,
        country: exact.country,
        latitude: exact.latitude,
        longitude: exact.longitude,
        highlights: exact.highlights,
        imageUrl: exact.imageUrl,
      };
    }
  }

  // 2. Try city substring match (e.g., "Canggu" might match "Bali")
  if (city) {
    const cityLower = city.toLowerCase();
    const partial = DESTINATIONS.find(
      (d) =>
        d.city.toLowerCase().includes(cityLower) ||
        cityLower.includes(d.city.toLowerCase()),
    );
    if (partial) {
      return {
        id: partial.id,
        city: partial.city,
        country: partial.country,
        latitude: partial.latitude,
        longitude: partial.longitude,
        highlights: partial.highlights,
        imageUrl: partial.imageUrl,
      };
    }
  }

  // 3. Find nearest destination within 80km using Haversine distance
  const MAX_DISTANCE_KM = 80;
  let nearest: (typeof DESTINATIONS)[0] | null = null;
  let nearestDist = Infinity;

  for (const dest of DESTINATIONS) {
    const dist = haversineKm(lat, lng, dest.latitude, dest.longitude);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = dest;
    }
  }

  if (nearest && nearestDist <= MAX_DISTANCE_KM) {
    return {
      id: nearest.id,
      city: nearest.city,
      country: nearest.country,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      highlights: nearest.highlights,
      imageUrl: nearest.imageUrl,
    };
  }

  return null;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Utilities ────────────────────────────────────────────────────────

function parseClaudeJSON(text: string): ClaudeLocationResult {
  // Strip markdown fences if present
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // Try to find JSON object in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  try {
    const parsed = JSON.parse(cleaned);
    return {
      city: parsed.city || null,
      country: parsed.country || null,
      region: parsed.region || null,
      locationString: parsed.locationString || null,
      confidence:
        parsed.confidence === 'high' ? 'high' : 'low',
      reasoning: parsed.reasoning || 'No reasoning provided.',
    };
  } catch {
    console.error(
      '[location-resolver] Failed to parse Claude JSON:',
      text.slice(0, 200),
    );
    return {
      city: null,
      country: null,
      region: null,
      locationString: null,
      confidence: 'low',
      reasoning: 'Failed to parse location analysis response.',
    };
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
