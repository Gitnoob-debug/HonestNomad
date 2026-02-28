# HonestNomad - Memory

> Context file for AI assistants. Read this first to understand the project.
> Last updated: February 27, 2026

---

## What Is This

HonestNomad is an AI-powered travel planning app. Users discover destinations through photos and social media links, then book hotels through a streamlined funnel.

**Stack:** Next.js 14 + Supabase + LiteAPI + Mapbox + Claude (via OpenRouter)
**Deployed:** https://honest-nomad-ud6y.vercel.app
**Branch:** All work on `master`
**Current goal:** Demo-ready with mock rates (no fixed deadline)

---

## Architecture Decisions (Finalized)

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Hotels only | No flights | Chargeback risk too high on flights |
| Hotel API | LiteAPI (Nuitee) | Real-time pricing, no approval needed, MoR option |
| Payment (future) | LiteAPI SDK (NUITEE_PAY) | Zero chargeback risk - LiteAPI handles payments |
| AI provider | OpenRouter → Claude | Haiku 3.5 for text, Sonnet 4.6 for vision |
| Image storage | Supabase Storage | 5GB+, serves destination photos |
| PII | Never store | Passthrough architecture - guest data goes direct to LiteAPI |
| Primary entry | Discover (photo/URL) | Flash swipe is secondary entry point |
| Commission | Not decided | Will set LiteAPI `margin` param when payments go live |

---

## Current User Flow

```
PRIMARY: Discover Page → Upload photo / Paste URL → Identify location
  → 3 tiles (Best Match + Closer + Budget) → Click "Explore [City]"
  → selectDestination() builds trip package + smart dates → sessionStorage
  → /flash/explore (vibe selection → POI map → hotel search → confirm)

SECONDARY: Landing Page → Quick Intent Form (dates, travelers, vibes, budget)
  → Swipe 16 Cities → Explore POIs on Map → Hotels → Review → Adventure Package
```

---

## What's Built & Working

### Destination Data
- **500 curated destinations**, 85k+ POIs, 5GB+ Supabase images
- **Destination data refactored** — extracted from 7,634-line TS file to `data/destinations.json` (Feb 28, 2026). Thin TS loader at `lib/flash/destinations.ts` (34 lines). Ready for expansion to 700-1000 destinations.
- **Daily cost data** — 495 destinations with per-person daily costs (USD): food, activities, transport
  - Range: $40/day (Hanoi, Ella) to $400/day (Bora Bora). Mean $111, median $100
  - Stored as `dailyCosts` field in `data/destinations.json`
- **Travel time matrix** for 500+ destinations

### Discover Feature (`/discover`) — Primary Entry Point
- Claude Vision identifies locations from photos
- TikTok oEmbed extracts captions (working, no key needed)
- YouTube oEmbed gets title + thumbnail (limited — description/transcript blocked from Vercel)
- Multi-location support — tile grid picker for "Top 10" type content
- Destination matching against 494 curated destinations (exact, substring, haversine 80km)
- **Confidence scoring** — 5-signal weighted formula → 3 user-facing tiers: green/amber/red
- **Alternative destination tiles** — 3-tile grid: Best Match + Closer to You + Budget-Friendly. IP geolocation with haversine distance for proximity. Immersive Flash-card-style tiles with image carousels, tap zones, swipe gestures, vibe pills
- **Detail modal** — Tap tile → hero carousel, tagline, pitch, vibes, highlights, cost card, "Explore [City]" CTA
- **Multi-location consistency** — Picking from multi-location grid shows same immersive tiles
- **Trending fallback** — No match → 3 trending destinations scored by seasonal fit, popularity, reachability

### Discover → Explore Handoff
- `selectDestination()` builds full `FlashTripPackage` with smart dates based on distance
- Distance-based defaults: short-haul = this weekend/3 nights, long-haul = 5 weeks out/7 nights
- Traveler type defaults to 'couple'. Budget-Friendly tile passes budget signal to hotel search
- Full sessionStorage contract bridges Discover → Explore seamlessly

### Flash Vacation Flow (Secondary)
- Swipe cards for 16 cities
- Explore map with POI clustering by zone
- Interactive day planner with clickable stops, bidirectional sync
- Left sidebar with POI list, step trail, action tiles
- Geographic outlier POI filtering

### Package/Confirm Step
- Data-driven Trip Intelligence system (replaced AI Magic Package)
- Image-rich day cards with stops-by-zone, hotel distance per stop
- Interactive walking route maps, walk-time connectors
- AI Travel Prep powered by Claude (Haiku for text, Sonnet for vision)

### Hotel Search
- LiteAPI sandbox integration (mock pricing active — `USE_MOCK_RATES = true`)
- Hotel scoring: proximity, rating, stars, budget fit, amenities, refundability, reviews, board type
- Reviews API working

### Other
- **Anonymous browsing** — auth gate only at booking
- **Unsplash image migration** — paused at batch 11/70 (~16%). Needs `UNSPLASH_ACCESS_KEY` in `.env.local` to resume

---

## What's NOT Working / Known Issues

- **YouTube multi-location extraction** — Blocked from Vercel datacenter IPs. Need YouTube Data API v3 key (free, ~2 min setup, no OAuth)
- **Instagram oEmbed** — Needs Meta developer app token (free, ~15 min setup)
- **Hotel booking flow** — "Proceed to Payment" is a placeholder alert. No prebook/book/payment integration yet
- **POI images** — Still reference Google API URLs, need Supabase migration
- **13 destinations missing POI data** — Need alternative to Google Places (DO NOT use Google Places API)
- **Local build OOM** — `next build` may crash locally. Vercel builds fine. Use `npx tsc --noEmit` for local type checking. (destinations.ts OOM fixed by JSON refactor Feb 28, 2026)

---

## Key Files

### Discover Feature
| File | Purpose |
|------|---------|
| `app/discover/page.tsx` | Discover UI — photo upload, URL input, results, tiles, detail modal |
| `components/discover/DestinationTile.tsx` | Immersive tile with image carousel, tap zones, vibes |
| `components/discover/DiscoverDetailModal.tsx` | Full detail modal — carousel, pitch, highlights, cost, CTA |
| `components/discover/ConfidenceBadge.tsx` | Green/amber/red confidence pill |
| `lib/location/resolver.ts` | Backend pipeline — metadata extraction, Claude analysis, geocoding, matching |
| `lib/location/confidenceScoring.ts` | 5-signal weighted confidence formula → 3 tiers |
| `lib/location/ipGeolocation.ts` | IP-based user location (ip-api.com + ipapi.co fallback) |
| `lib/location/alternativeFinder.ts` | Closer + budget alternatives + trending fallback |
| `app/api/location/analyze/route.ts` | POST endpoint for location analysis |
| `types/location.ts` | TypeScript types for discover feature |

### Flash / Explore / Package
| File | Purpose |
|------|---------|
| `app/flash/explore/page.tsx` | Explore page — vibe selection, POI map, hotel search, day planner (~3200 lines) |
| `app/flash/confirm/page.tsx` | Confirm/package page — Trip Intelligence, day cards, walking routes |
| `components/flash/FlashPlanInput.tsx` | Quick intent form (dates, travelers, vibes, budget) |
| `components/flash/ImmersiveSwipeCard.tsx` | Swipe card for Flash city selection |
| `data/destinations.json` | 500 destinations — pure data (add/edit destinations here) |
| `lib/flash/destinations.ts` | Thin loader for destinations.json + helper functions (34 lines) |
| `lib/flash/distanceDefaults.ts` | Smart date defaults based on origin→destination distance |
| `lib/flash/diversityEngine.ts` | Scoring functions (seasonal, vibe, budget, reachability) |
| `lib/flash/vibeStyles.ts` | Shared VIBE_STYLES (colors, emojis) |

### Hotel / Booking
| File | Purpose |
|------|---------|
| `app/api/hotels/search/route.ts` | Hotel search API (uses mock rates currently) |
| `lib/liteapi/client.ts` | LiteAPI client — search, details, rates, reviews |
| `lib/liteapi/hotels.ts` | Hotel search logic, scoring, `USE_MOCK_RATES` flag |
| `lib/liteapi/types.ts` | Full LiteAPI TypeScript types |
| `app/api/book/route.ts` | Booking endpoint — **STUB**, returns placeholder IDs |
| `components/booking/GuestForm.tsx` | Guest form — **fake tokenizer**, placeholder payment |

---

## Discover Pipeline (URL Path)

```
URL input → detectPlatform() → platform-specific metadata extraction
  → TikTok: oEmbed (free, no key) — gets caption only
  → YouTube: oEmbed title + thumbnail (description/transcript blocked from Vercel)
  → Instagram: OG tags (blocked from Vercel, needs Meta app token)
  → Unknown: OG tag scraping

Metadata → analyzeCaptionMulti() (Claude Haiku 3.5) → extract ALL locations
  → If multiple: geocode all + compute alternatives per entry → tile grid picker
  → If single: geocode → destination match → 3-tile grid (Best Match + Closer + Budget)

Fallback: thumbnail → analyzeImage() (Claude Sonnet 4.6 Vision) → geocode → match
```

### Known Pipeline Gap: Video Content Analysis
The pipeline only sees metadata (caption, thumbnail), NOT actual video content:
- CapCut compilations with text overlays → missed
- Destination footage (landmarks, scenery) → only seen if thumbnail shows it
- TikTok location tags → not extracted yet
- Hallucination risk when caption is generic and thumbnail is ambiguous

---

## SessionStorage Contract (Explore Page)

| Key | Set by | Read by | Shape |
|-----|--------|---------|-------|
| `flash_selected_trip` | selectDestination, swipe flow | explore page | `FlashTripPackage` |
| `flash_generate_params` | selectDestination, FlashPlanInput | explore page | `{ departureDate, returnDate }` |
| `flash_vacation_trips` | selectDestination, useFlashVacation | explore page | `{ lastGenerateParams: { departureDate, returnDate } }` |
| `flash_origin_airport` | FlashPlanInput (IP geolocation) | selectDestination | `AirportInfo { code, name, lat, lng }` |
| `flash_traveler_type` | FlashPlanInput, selectDestination | explore page | `'solo' \| 'couple' \| 'family'` |
| `flash_budget_tier` | selectDestination (Budget-Friendly tile) | explore page | `'budget'` or absent |
| `discover_destination` | selectDestination | (legacy, backwards compat) | `MatchedDestination` |

---

## API Keys & Services

| Service | Purpose | Cost | Key Location |
|---------|---------|------|-------------|
| Supabase | DB, Auth, Storage | Free tier | `.env.local` |
| LiteAPI | Hotel search, rates, booking | Free searches, 2.9-3.9% per booking | `.env.local` |
| Mapbox | Maps, geocoding | Free tier (100k loads/month) | `.env.local` |
| OpenRouter → Claude | Vision, text analysis, Trip Intelligence | Pay per token | `.env.local` |
| Unsplash | Image migration (scripts) | Free (50 req/hour) | `.env.local` (needs `UNSPLASH_ACCESS_KEY`) |
| Google Places | POI data (scripts only) | **DO NOT RUN** — $900 incident | `.env.local` |

### API Keys Needed (Not Yet Set Up)

| Service | Purpose | Cost | Setup Time |
|---------|---------|------|-----------|
| YouTube Data API v3 | Video descriptions for multi-location | Free (10k units/day) | ~2 min |
| Meta/Instagram oEmbed | Instagram post captions | Free | ~15 min |

---

## Critical Rules

1. **DO NOT run Google Places API scripts** — Previous $900 bill incident
2. **DO NOT store API keys in committed files** — Use `.env.local` only
3. **DO NOT store PII** — Passthrough architecture, guest data goes direct to LiteAPI
4. **Hotels only, no flights** — Chargeback risk decision
5. **Local build OOM** — Use `npx tsc --noEmit` instead of `next build` locally

---

## Background Tasks

- **Unsplash image migration** — Paused at batch 11/70 (~16%). Downloads destination photos in batches (~1 batch/hour, 50 req/hour rate limit). Needs `UNSPLASH_ACCESS_KEY` in `.env.local`. Restart with: `npx tsx scripts/image-migration/migrate-images.ts --continuous`. Progress saved in `scripts/image-migration/progress.json`.
