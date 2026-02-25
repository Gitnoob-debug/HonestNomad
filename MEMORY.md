# HonestNomad - Memory

> Context file for AI assistants. Read this first to understand the project.
> Last updated: February 25, 2026

---

## What Is This

HonestNomad is an AI-powered travel planning app. Users discover destinations through photos and social media links, then book hotels through a streamlined funnel.

**Stack:** Next.js 14 + Supabase + LiteAPI + Mapbox + Claude (via OpenRouter)
**Deployed:** https://honest-nomad-ud6y.vercel.app
**Branch:** All work on `master` (no feature branches)

---

## Architecture Decisions (Finalized)

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Hotels only | No flights | Chargeback risk too high on flights |
| Hotel API | LiteAPI (Nuitee) | Real-time pricing, no approval needed, MoR option |
| Payment | LiteAPI SDK (NUITEE_PAY) | Zero chargeback risk - LiteAPI handles payments |
| AI provider | OpenRouter → Claude | Haiku 3.5 for text, Sonnet 4.6 for vision |
| Image storage | Supabase Storage | 5GB+, serves destination photos |
| PII | Never store | Passthrough architecture - guest data goes direct to LiteAPI |
| Discovery | Photo/URL recognition | Claude Vision identifies locations from user uploads |

---

## Current User Flow

```
Landing Page → Quick Intent Form (dates, travelers, vibes, budget)
  → Swipe 16 Cities → Explore POIs on Map → Hotels → Review → Adventure Package

OR

Discover Page → Upload photo / Paste URL → Identify location
  → 3 tiles (Best Match + Closer + Budget) → Click "Explore [City]"
  → selectDestination() builds trip package + smart dates → sessionStorage
  → /flash/explore (vibe selection → POI map → hotel search → confirm)
```

---

## What's Built & Working

- **500 curated destinations**, 85k+ POIs, 5GB+ Supabase images
- **Discover feature** (`/discover`) — upload photos or paste social media URLs
  - Claude Vision identifies locations from photos (solid)
  - TikTok oEmbed extracts captions (working, no key needed)
  - YouTube oEmbed gets title + thumbnail (working, but limited metadata)
  - Multi-location support — tile grid picker for "Top 10" type content
  - Destination matching against 494 curated destinations (exact, substring, haversine 80km)
  - **Confidence scoring** — 5-signal weighted formula (Claude confidence, match type, source reliability, geocoding, consistency) → 3 user-facing tiers: green "We're confident" / amber "Our best guess" / red "We're not sure"
  - **Alternative destination tiles** — 3-tile grid: Best Match + Closer to You + Budget-Friendly. Uses IP geolocation (ip-api.com + ipapi.co fallback) with haversine distance for genuine proximity ranking. Immersive Flash-card-style tiles with image carousels, tap zones, swipe gestures, vibe pills, gradient overlays
  - **Detail modal** — Tap tile center → full detail view with hero ImageCarousel, tagline, city pitch, all vibes, numbered highlights, cost card, "Explore [City]" CTA. Follows TripDetailModal layout
  - **Multi-location consistency** — When video has multiple locations, picking one now shows the same immersive tiles (alternatives pre-computed server-side per entry)
  - **Trending fallback** — When no match found or confidence too low, shows 3 trending destinations scored by seasonal fit, popularity, and reachability with region diversity
- **Daily cost data** — 495 destinations enriched with structured per-person daily costs (USD):
  - `foodPerDay` (casual breakfast/lunch + mid-range dinner), `activitiesPerDay` (museums, tours, entertainment), `transportPerDay` (taxis, transit, rideshare)
  - Data generated via Claude Haiku enrichment script (`scripts/enrich-daily-costs.ts`)
  - Stored on each destination as `dailyCosts` field in `lib/flash/destinations.ts`
  - Range: $40/day (Hanoi, Ella) to $400/day (Bora Bora). Mean $111, median $100
  - Budget-Friendly tile algorithm now uses real daily cost comparison instead of static `averageCost`
  - Detail modal shows itemized daily budget breakdown (food, activities, transport)
- **Discover → Explore signal passthrough** — Traveler type defaults to 'couple' if not set by FlashPlanInput. Budget-Friendly tile click stores budget signal, hotel search adjusts to favor cheaper options (strict budget, lower star minimum)
- **Flash Vacation flow** — swipe cards, explore map, hotel search, booking confirmation
- **LiteAPI sandbox** for hotel search (mock pricing active)
- **AI Magic Package** on confirm page (packing lists, tips, adventure guide)
- **Travel time matrix** for 500+ destinations
- **Anonymous browsing**, auth gate only at booking
- **Unsplash image migration** — running in background, downloads ~1 batch/hour

---

## What's NOT Working / Known Issues

- **YouTube multi-location extraction** — YouTube blocks transcript/description fetching from Vercel's datacenter IPs. All approaches failed (HTML scraping, innertube API, youtube-transcript npm package). Need YouTube Data API v3 key to fix. **Confirmed:** `videos.list?part=snippet` (description/tags) works with just an API key — no OAuth needed. The OAuth restriction only applies to `captions.download` which we don't need.
- **Instagram oEmbed** — Requires Meta developer app token (free, ~15 min setup). Currently falls back to OG tag scraping which Instagram also blocks.
- **Hotel booking flow** — "Proceed to Payment" is a placeholder alert
- **POI images** — Still reference Google API, need Supabase migration
- **13 new destinations** missing POI data (blocked by Google API budget cap)
- **Local build OOM** — `next build` crashes with "JavaScript heap out of memory" locally due to the 7000+ line `destinations.ts` file. Pre-existing issue, not related to new code. Vercel builds fine (more memory). Use `npx tsc --noEmit` for local type checking.

---

## Key Files (Discover Feature)

| File | Purpose |
|------|---------|
| `app/discover/page.tsx` | Discover UI — photo upload, URL input, results display, confidence badges, alternative tiles, detail modal |
| `components/discover/DestinationTile.tsx` | Immersive tile with image carousel, tap zones, progress bars, vibes, highlights |
| `components/discover/DiscoverDetailModal.tsx` | Full detail modal — hero carousel, tagline, pitch, vibes, highlights, cost, CTA |
| `components/discover/ConfidenceBadge.tsx` | Green/amber/red confidence pill |
| `lib/location/resolver.ts` | Backend pipeline — metadata extraction, Claude analysis, geocoding, matching, alternatives |
| `app/api/location/analyze/route.ts` | POST endpoint for location analysis (extracts client IP for geolocation) |
| `types/location.ts` | TypeScript types for discover feature (includes confidence, alternatives, trending) |
| `lib/location/confidenceScoring.ts` | 5-signal weighted confidence formula → 3 tiers |
| `lib/location/ipGeolocation.ts` | IP-based user location (ip-api.com + ipapi.co fallback, 1hr cache) |
| `lib/location/alternativeFinder.ts` | Finds closer (haversine distance) + budget alternatives + trending fallback |
| `lib/flash/vibeStyles.ts` | Shared VIBE_STYLES (colors, emojis) used by both Flash and Discover components |
| `lib/flash/diversityEngine.ts` | Scoring functions (seasonal, vibe, budget, reachability) — shared with alternativeFinder |
| `types/flash.ts` | Destination type with DailyCosts interface (foodPerDay, activitiesPerDay, transportPerDay) |
| `scripts/enrich-daily-costs.ts` | Claude Haiku enrichment script for daily cost data (test/generate/merge/review modes) |
| `data/daily-costs.json` | Raw enrichment output — 495 destinations with daily cost estimates |

---

## Discover Pipeline (URL Path)

```
URL input → detectPlatform() → platform-specific metadata extraction
  → TikTok: oEmbed (free, no key) — gets caption only
  → YouTube: oEmbed title + thumbnail (description/transcript blocked from Vercel)
  → Instagram: OG tags (blocked from Vercel, needs Meta app token)
  → Unknown: OG tag scraping

Metadata → analyzeCaptionMulti() (Claude Haiku) → extract ALL locations
  → If multiple: geocode all + compute alternatives per entry → tile grid picker
  → If single: geocode → destination match → 3-tile grid (Best Match + Closer + Budget)

Fallback: thumbnail → analyzeImage() (Claude Sonnet Vision) → geocode → match
```

### Known Pipeline Gap: Video Content Analysis
The current pipeline only sees metadata (caption, thumbnail). It does NOT see the actual video content. This means:
- CapCut compilations with text overlays ("Day 3 in Bali") → missed entirely
- Destination footage (landmarks, scenery) → only seen if thumbnail happens to show it
- TikTok location tags (📍 structured data on the video) → not extracted yet
- Vision hallucination risk is high when caption is generic and thumbnail is ambiguous (e.g., selfie on a plane → Claude confidently guesses wrong city)

See TODO.md for the phased approach to fixing this.

---

## Discover → Explore Handoff (Feb 25, 2026)

The critical flow: user sees a tile (Bali, Bangkok, Toronto), clicks "Explore [City]", and lands on the explore page ready to pick a vibe and book a hotel. This was broken — the explore page expected `flash_selected_trip` in sessionStorage but `selectDestination()` only set `discover_destination`.

### What `selectDestination()` now does (`app/discover/page.tsx:125`)

1. **Looks up full destination data** — `DESTINATIONS.find(d => d.id === dest.id)` to get `airportCode`, `region`, `vibes` (which `MatchedDestination` may not carry)
2. **Computes distance-based dates** — Reads `flash_origin_airport` from sessionStorage (set by FlashPlanInput). Uses `computeDistanceDefaults()` to calculate smart check-in/check-out dates:
   - Toronto → Bali (12,000km) = long-haul = 5 weeks out, 7 nights, Friday check-in
   - Toronto → Montreal (500km) = short-haul = this weekend, 3 nights
   - Falls back to `getFallbackDefaults()` (3 weeks out, 5 nights) if no origin airport stored
3. **Builds `FlashTripPackage`** — Minimal but complete trip object with destination info, trip duration, empty hotel, empty pricing
4. **Stores three sessionStorage keys** the explore page expects:
   - `flash_selected_trip` → the trip package (explore page loads this at `page.tsx:556`)
   - `flash_generate_params` → `{ departureDate, returnDate }`
   - `flash_vacation_trips` → `{ lastGenerateParams: { departureDate, returnDate } }` (used by hotel search for check-in/check-out)
5. **Navigates** to `/flash/explore?destination={id}`

### SessionStorage Contract (Explore Page)

| Key | Set by | Read by | Shape |
|-----|--------|---------|-------|
| `flash_selected_trip` | selectDestination, swipe flow | explore page (line 556) | `FlashTripPackage` |
| `flash_generate_params` | selectDestination, FlashPlanInput | explore page (hotel date defaults) | `{ departureDate, returnDate }` |
| `flash_vacation_trips` | selectDestination, useFlashVacation | explore page (hotel search dates) | `{ lastGenerateParams: { departureDate, returnDate } }` |
| `flash_origin_airport` | FlashPlanInput (IP geolocation) | selectDestination (distance calc) | `AirportInfo { code, name, lat, lng }` |
| `flash_traveler_type` | FlashPlanInput, selectDestination (default) | explore page (hotel occupancy, AI narratives) | `'solo' \| 'couple' \| 'family'` |
| `flash_budget_tier` | selectDestination (Budget-Friendly tile) | explore page (hotel search) | `'budget'` or absent |
| `discover_destination` | selectDestination | (legacy, still set for backwards compat) | `MatchedDestination` |

### What's Still Missing in This Flow

- **Return to Discover** — If user hits back from explore, the discover state is gone (no persistence). Low priority since they can re-analyze.

---

## API Keys & Services

| Service | Purpose | Cost | Key Location |
|---------|---------|------|-------------|
| Supabase | DB, Auth, Storage | Free tier | `.env.local` |
| LiteAPI | Hotel search, rates, booking | Free searches, 2.9-3.9% per booking | `.env.local` |
| Mapbox | Maps, geocoding | Free tier (100k loads/month) | `.env.local` (NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) |
| OpenRouter → Claude | Vision, text analysis, Magic Package | Pay per token | `.env.local` |
| Unsplash | Image migration (scripts) | Free (50 req/hour) | `.env.local` |
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
5. **All work on master branch** — No feature branches

---

## Background Tasks

- **Unsplash image migration** — Downloads destination photos in batches (~1 batch/hour, 50 req/hour rate limit). Progress saved in `scripts/image-migration/progress.json`. Restart with: `npx tsx scripts/image-migration/migrate-images.ts --continuous`

---

## Debug Tools (Temporary)

- **Pipeline trace** — `_debug` field on `LocationAnalysisResponse` shows each step of the resolver pipeline. Visible in the discover page as a dark panel at the bottom. Remove before production.
