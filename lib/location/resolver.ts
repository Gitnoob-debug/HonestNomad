/**
 * Social Location Resolver
 *
 * Resolves geographic locations from social media URLs and uploaded images.
 *
 * URL path:  oEmbed/OG metadata + YouTube transcript → multi-location caption analysis (Haiku)
 *            → fallback: thumbnail vision (Sonnet) → Mapbox geocoding → destination matching
 *
 * Image path: Claude Vision (Sonnet) → Mapbox geocoding → destination matching
 *
 * Supports single and multi-location results. Multi-location URLs (e.g. "Top 10 Places")
 * return a tile grid for the user to pick from.
 */

import { getOpenRouterClient } from '@/lib/claude/client';
import { DESTINATIONS } from '@/lib/flash/destinations';
import type {
  AnalyzeLocationRequest,
  LocationAnalysisResponse,
  ClaudeLocationResult,
  ClaudeMultiLocationResult,
  ResolvedLocation,
  MatchedDestination,
} from '@/types/location';

const HAIKU_MODEL = 'anthropic/claude-3.5-haiku';
const VISION_MODEL = 'anthropic/claude-sonnet-4.6'; // Haiku doesn't support vision via OpenRouter
const FETCH_TIMEOUT_MS = 10_000;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// ── Helper: geocode + match a single ClaudeLocationResult ────────────

async function resolveOne(
  cr: ClaudeLocationResult,
  source: ResolvedLocation['source'],
): Promise<{ location: ResolvedLocation; matchedDestination: MatchedDestination | null } | null> {
  if (!cr.locationString) return null;
  const geocoded = await geocodeLocation(cr.locationString);
  if (!geocoded) return null;
  const matched = matchDestination(cr.city, cr.country, geocoded.lat, geocoded.lng);
  return {
    location: {
      city: cr.city,
      country: cr.country,
      locationString: cr.locationString,
      lat: geocoded.lat,
      lng: geocoded.lng,
      displayName: geocoded.displayName,
      confidence: cr.confidence,
      reasoning: cr.reasoning,
      source,
    },
    matchedDestination: matched,
  };
}

// ── Main entry point ─────────────────────────────────────────────────

export async function resolveLocation(
  req: AnalyzeLocationRequest,
): Promise<LocationAnalysisResponse> {
  // === PATH A: URL INPUT ===
  if (req.url) {
    const metadata = await extractMetadata(req.url);

    // Step 1: Try multi-location caption analysis (cheap, text-only)
    if (metadata.caption && metadata.caption.length > 5) {
      const multiResult = await analyzeCaptionMulti(metadata.caption);

      if (multiResult.locations.length > 1) {
        // Multiple locations found — geocode all in parallel
        const resolved = await Promise.all(
          multiResult.locations.map((cr) => resolveOne(cr, 'caption')),
        );
        const valid = resolved.filter(
          (r): r is NonNullable<typeof r> => r !== null,
        );

        if (valid.length > 1) {
          return {
            success: true,
            location: valid[0].location,
            matchedDestination: valid[0].matchedDestination,
            locations: valid,
          };
        }
        // If only 1 survived geocoding, fall through to single-result path
        if (valid.length === 1) {
          return {
            success: true,
            location: valid[0].location,
            matchedDestination: valid[0].matchedDestination,
          };
        }
      }

      // Single location from caption
      if (multiResult.locations.length === 1) {
        const single = multiResult.locations[0];
        if (single.confidence === 'high') {
          const result = await resolveOne(single, 'caption');
          if (result) {
            return { success: true, ...result };
          }
        }
      }
    }

    // Step 2: If caption didn't produce results, try vision on thumbnail
    if (metadata.thumbnail) {
      const thumbnailBase64 = await fetchImageAsBase64(metadata.thumbnail);
      if (thumbnailBase64) {
        const visionResult = await analyzeImage(
          thumbnailBase64,
          'image/jpeg',
          metadata.caption || undefined,
        );
        if (visionResult.confidence === 'high') {
          const result = await resolveOne(visionResult, 'vision');
          if (result) {
            return { success: true, ...result };
          }
        }
      }
    }

    // Step 3: Nothing worked
    return {
      success: true,
      location: null,
      matchedDestination: null,
      error: 'Could not extract location information from this link.',
    };
  }

  // === PATH B: IMAGE UPLOAD (always single location) ===
  if (req.imageBase64) {
    const claudeResult = await analyzeImage(
      req.imageBase64,
      req.imageMimeType || 'image/jpeg',
      undefined,
    );

    if (!claudeResult.locationString) {
      return {
        success: true,
        location: null,
        matchedDestination: null,
        error: claudeResult.reasoning || 'Could not determine a location from this image.',
      };
    }

    const result = await resolveOne(claudeResult, 'vision');
    if (!result) {
      return {
        success: true,
        location: null,
        matchedDestination: null,
        error: `Identified as "${claudeResult.locationString}" but could not find it on the map.`,
      };
    }

    return { success: true, ...result };
  }

  return {
    success: true,
    location: null,
    matchedDestination: null,
    error: 'Provide either a URL or an image.',
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
    // oEmbed gives title + thumbnail, but the title is often vague.
    // The real city names are SPOKEN in the video — grab the transcript.
    const oembed = await fetchYouTubeOEmbed(url);
    const transcript = await fetchYouTubeTranscript(url);
    const og = await fetchOGTags(url);

    // Priority: transcript (everything spoken) > OG description > title
    const parts = [
      oembed.caption,
      og.caption,
      transcript ? `[Video transcript]: ${transcript}` : null,
    ].filter(Boolean);
    const combined = parts.join(' — ');

    return {
      thumbnail: oembed.thumbnail || og.thumbnail,
      caption: combined || null,
    };
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

// ── YouTube transcript extraction (auto-captions) ───────────────────
// Fetches auto-generated captions from YouTube without an API key.
// The video page HTML contains a captionTracks URL we can fetch.

async function fetchYouTubeTranscript(url: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;

    const html = await response.text();

    // Extract captionTracks from ytInitialPlayerResponse embedded in the page
    const captionMatch = html.match(
      /"captionTracks":\s*(\[[\s\S]*?\])/,
    );
    if (!captionMatch) return null;

    let tracks: Array<{ baseUrl: string; languageCode: string }>;
    try {
      tracks = JSON.parse(captionMatch[1]);
    } catch {
      return null;
    }

    // Prefer English captions, fall back to first available
    const enTrack = tracks.find((t) => t.languageCode === 'en')
      || tracks.find((t) => t.languageCode?.startsWith('en'))
      || tracks[0];
    if (!enTrack?.baseUrl) return null;

    // Fetch the caption XML
    const captionResponse = await fetchWithTimeout(enTrack.baseUrl, FETCH_TIMEOUT_MS);
    if (!captionResponse.ok) return null;

    const captionXml = await captionResponse.text();

    // Parse caption text from XML: <text start="..." dur="...">caption here</text>
    const textSegments = captionXml.match(/<text[^>]*>(.*?)<\/text>/gs);
    if (!textSegments || textSegments.length === 0) return null;

    const transcript = textSegments
      .map((seg) =>
        seg
          .replace(/<[^>]+>/g, '') // strip XML tags
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim(),
      )
      .filter(Boolean)
      .join(' ');

    // Truncate to ~3000 chars to stay within token budget
    return transcript.length > 3000
      ? transcript.slice(0, 3000) + '...'
      : transcript;
  } catch (error) {
    console.error('[location-resolver] YouTube transcript fetch failed:', error);
    return null;
  }
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

// ── Claude: Multi-location caption analysis (text-only) ──────────────

async function analyzeCaptionMulti(
  caption: string,
): Promise<ClaudeMultiLocationResult> {
  const client = getOpenRouterClient();

  try {
    const response = await client.chat.completions.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are a geographic location extractor for a travel app. Extract ALL locations mentioned in this social media caption/title.

RULES:
1. Return ONLY valid JSON. No explanation, no markdown fences, no preamble.
2. If the caption names multiple cities or places, return ALL of them as separate entries.
3. If it only mentions one place, return an array with one entry.
4. If no location is identifiable, return an empty array.
5. "high" confidence = you are 85%+ certain of the specific city.
6. "low" confidence = vague or uncertain. Skip these — only return high-confidence locations.
7. Deduplicate: if "Bali" and "Ubud, Bali" both appear, keep only "Ubud, Bali" (the more specific one).

RETURN THIS EXACT JSON:
{
  "locations": [
    {
      "city": "string or null",
      "country": "string or null",
      "region": "string or null",
      "locationString": "best geocodable string like 'Chiang Mai, Thailand'",
      "confidence": "high or low",
      "reasoning": "one sentence"
    }
  ]
}

Caption: "${caption}"`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    return parseClaudeMultiJSON(text);
  } catch (error: unknown) {
    console.error('[location-resolver] Multi-caption analysis failed:', error);
    return { locations: [] };
  }
}

function parseClaudeMultiJSON(text: string): ClaudeMultiLocationResult {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.locations)) {
      return {
        locations: parsed.locations
          .filter((l: Record<string, unknown>) => l.locationString)
          .map((l: Record<string, unknown>) => ({
            city: (l.city as string) || null,
            country: (l.country as string) || null,
            region: (l.region as string) || null,
            locationString: (l.locationString as string) || null,
            confidence: l.confidence === 'high' ? 'high' as const : 'low' as const,
            reasoning: (l.reasoning as string) || 'No reasoning provided.',
          })),
      };
    }
    // Fallback: single object instead of array
    if (parsed.locationString) {
      return { locations: [parseClaudeJSON(cleaned)] };
    }
    return { locations: [] };
  } catch {
    console.error('[location-resolver] Failed to parse multi-location JSON:', text.slice(0, 200));
    return { locations: [] };
  }
}

// ── Claude: Vision analysis (image + optional caption) ───────────────

async function analyzeImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
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
      model: VISION_MODEL,
      max_tokens: 1024,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
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
  } catch (error: unknown) {
    // Extract full error details from OpenRouter/OpenAI SDK error
    let errDetail = '';
    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      // OpenAI SDK wraps the error — dig into it
      errDetail = JSON.stringify({
        message: e.message,
        status: e.status,
        code: e.code,
        type: e.type,
        error: e.error,
      });
    } else {
      errDetail = String(error);
    }
    console.error('[location-resolver] Vision analysis failed:', errDetail);
    return {
      city: null,
      country: null,
      region: null,
      locationString: null,
      confidence: 'low',
      reasoning: `Vision failed [${VISION_MODEL}]: ${errDetail.slice(0, 200)}`,
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
