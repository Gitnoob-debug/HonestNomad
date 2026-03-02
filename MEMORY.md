# HonestNomad - Memory

> Context file for AI assistants. Read this first to understand the project.
> Last updated: March 1, 2026

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
PRIMARY (Discover → Book in 3 clicks):
  Upload photo / Paste URL → Identify location → 3 destination tiles
  → Click one → /discover/hotels (3 featured hotel tiles + "See more")
  → Click hotel → /discover/checkout (booking summary + payment placeholder)

SECONDARY (Flash/Explore — PARKED, untouched):
  Landing Page → Quick Intent Form (dates, travelers, vibes, budget)
  → Swipe 16 Cities → Explore POIs on Map → Hotels → Review → Adventure Package
```

### Discover Hotel Selection (conversion-optimized)
- **3 equal featured tiles** — Recommended + Best Value + Premium Pick, same size, 3-col grid
- **Walk-time hero metric** — "🚶 4 min walk to your spot" above hotel name (unique value prop)
- **Clickable cards** — entire tile selects hotel (goes to checkout), carousel edges still navigate photos
- **Desktop sidebar layout** — sticky left sidebar with dates/guests/sort/filters/view toggle, full right side for hotels/map
- **Mobile collapsible filters** — horizontal SearchControls at top, "Filters & Sort" expands/collapses below
- **Dynamic filters** — sort (distance/price/rating/stars), price ranges computed from actual data, star buttons data-driven
- **List/Map view toggle** — List view shows featured tiles + expandable list. Map view skips featured tiles, shows full list + map
- **Hotel data enrichment** — HD images, chain badges, cancel deadline, review snippets, room details, important info
- **Mapbox map** — landmark pin (red) + hotel pins (blue), separated marker creation from selection styling (no jump bug)

---

## What's Built & Working

### Destination Data
- **715 curated destinations** (expanded from 500 — 200 new + 15 India), 85k+ POIs, 5GB+ Supabase images
- **Daily cost data** — 495+ destinations with per-person daily costs (USD): food, activities, transport
  - Range: $40/day (Hanoi, Ella) to $400/day (Bora Bora). Mean $111, median $100
  - Stored as `dailyCosts` field in `lib/flash/destinations.ts`
- **Travel time matrix** for 500+ destinations

### Discover Feature (`/discover`) — Primary Entry Point
- Claude Vision identifies locations from photos
- TikTok oEmbed extracts captions (working, no key needed)
- YouTube oEmbed gets title + thumbnail (limited — description/transcript blocked from Vercel)
- Multi-location support — tile grid picker for "Top 10" type content
- Destination matching against 494 curated destinations (exact, substring, haversine 80km)
- **Confidence scoring** — 5-signal weighted formula → 3 user-facing tiers: green/amber/red
- **Alternative destination tiles** — 3-tile grid: Best Match + Closer to You + Budget-Friendly. IP geolocation with haversine distance for proximity. Immersive Flash-card-style tiles with image carousels, tap zones, swipe gestures, vibe pills
- **Detail modal** — Tap tile → hero carousel, tagline, pitch, vibes, highlights, cost card
- **Multi-location consistency** — Picking from multi-location grid shows same immersive tiles
- **Trending fallback** — No match → 3 trending destinations scored by seasonal fit, popularity, reachability

### Discover → Hotel Selection (`/discover/hotels`)
- `selectDestination()` stores landmark coords + smart dates in sessionStorage
- Redirects to `/discover/hotels` (NOT `/flash/explore`)
- Distance-based defaults: short-haul = this weekend/3 nights, long-haul = 5 weeks out/7 nights
- **Separate API endpoint** (`/api/hotels/discover-search`) with radius expansion: 5km → 15km → 50km → city-wide fallback
- **Parallel enrichment** — `getHotelDetails` + `getHotelReviews` for all ~20 hotels in parallel via `Promise.all`
- **Hotel categorization** — `categorizeHotels()`: Closest (haversine), Budget (cheapest 3★+), High-End (highest stars/price)
- **Walk-time conversion** — `formatTravelTime()`: meters → "X min walk" (≤20min) or "X min drive" (>20min), pure math
- **3 equal featured tiles** — Recommended + Best Value + Premium Pick, all same height, 3-col grid
- **List view** — featured tiles pinned at top, "See all X hotels" expands full list below
- **Map view** — skips featured tiles entirely, shows full scrollable list + Mapbox map side-by-side
- **Desktop sidebar** — sticky left sidebar (w-72) with vertical SearchControls + filters/sort/view toggle
- **Mobile** — horizontal SearchControls + collapsible "Filters & Sort" button
- **Clickable cards** — entire tile/card selects hotel, carousel edges navigate photos via stopPropagation
- **Editable search controls** — dates + guests, triggers re-search on update. Vertical layout for sidebar, horizontal for mobile.
- **Dynamic filters** — sort by distance/price/rating/stars, price ranges from actual data (thirds), star buttons data-driven
- **Enrichment data on tiles** — HD images, chain badge, cancel micro-badge, review snippet (recommended only)
- **Enrichment data on checkout** — HD hero, chain, room details card, expandable important info, guest reviews section
- **Landmark GPS vs city GPS** — uses photo's actual GPS for best match tile, destination's coords for alternatives

### Discover → Checkout (`/discover/checkout`)
- Reads selected hotel + trip details from sessionStorage
- Booking summary with hotel hero, pricing breakdown, cancellation badge
- "Checkout" button shows "Booking Coming Soon!" placeholder modal (NUITEE_PAY integration pending)

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
- **Pexels image pipeline** — 554/715 downloaded, 496 uploaded to Supabase. Backfill + AI validation scripts ready. See Background Tasks.

---

## What's NOT Working / Known Issues

- **YouTube multi-location extraction** — Blocked from Vercel datacenter IPs. Need YouTube Data API v3 key (free, ~2 min setup, no OAuth)
- **Instagram oEmbed** — Needs Meta developer app token (free, ~15 min setup)
- **Hotel booking flow** — "Proceed to Payment" is a placeholder alert. No prebook/book/payment integration yet
- **POI images** — Still reference Google API URLs, need Supabase migration
- **13 destinations missing POI data** — Need alternative to Google Places (DO NOT use Google Places API)
- **Local build OOM** — `next build` crashes locally (7000+ line destinations.ts). Vercel builds fine. Use `npx tsc --noEmit` for local type checking

---

## Key Files

### Discover Feature
| File | Purpose |
|------|---------|
| `app/discover/page.tsx` | Discover UI — photo upload, URL input, results, destination tiles, detail modal |
| `app/discover/hotels/page.tsx` | Hotel selection page — featured tiles + expanded list/map |
| `app/discover/checkout/page.tsx` | Booking summary + checkout placeholder |
| `app/api/hotels/discover-search/route.ts` | POST endpoint — search + categorize + enrich hotels (parallel) |
| `components/discover/DestinationTile.tsx` | Immersive destination tile with image carousel, tap zones, vibes |
| `components/discover/HotelTile.tsx` | Immersive hotel tile — carousel, walk-time hero, recommended treatment |
| `components/discover/HotelTileGrid.tsx` | Featured layout — 3 equal tiles (Recommended + Budget + Premium) |
| `components/discover/HotelExpandedList.tsx` | Full hotel list + map view, accepts pre-filtered data + viewMode from parent |
| `components/discover/HotelMapView.tsx` | Mapbox map — landmark pin + hotel pins, separated creation/selection lifecycle |
| `components/discover/SearchControls.tsx` | Date pickers + guest stepper, supports `layout="vertical"` for sidebar |
| `components/discover/BookingSummary.tsx` | Checkout page — hotel hero, pricing, cancellation, CTA |
| `components/discover/DiscoverDetailModal.tsx` | Full detail modal — carousel, pitch, highlights, cost, CTA |
| `components/discover/ConfidenceBadge.tsx` | Green/amber/red confidence pill |
| `lib/hotels/categorize.ts` | Pick 3 featured hotels: Closest, Budget, High-End |
| `lib/hotels/formatTravelTime.ts` | Convert meters → walk/drive time (pure math, no API) |
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
| `lib/flash/destinations.ts` | 715 destinations with POIs, vibes, daily costs (7000+ lines) |
| `lib/flash/distanceDefaults.ts` | Smart date defaults based on origin→destination distance |
| `lib/flash/diversityEngine.ts` | Scoring functions (seasonal, vibe, budget, reachability) |
| `lib/flash/vibeStyles.ts` | Shared VIBE_STYLES (colors, emojis) |

### Hotel / Booking
| File | Purpose |
|------|---------|
| `app/api/hotels/search/route.ts` | Hotel search API for Flash flow (uses mock rates currently) |
| `app/api/hotels/discover-search/route.ts` | Hotel search API for Discover flow — radius expansion + parallel enrichment |
| `lib/liteapi/client.ts` | LiteAPI client — search, details, rates, reviews |
| `lib/liteapi/hotels.ts` | Hotel search logic, scoring, `USE_MOCK_RATES` flag, `searchHotelsForDiscoverFlow()` |
| `lib/liteapi/types.ts` | Full LiteAPI TypeScript types |
| `lib/hotels/categorize.ts` | Categorize hotels: Closest (haversine), Budget (cheapest 3★+), High-End |
| `lib/hotels/formatTravelTime.ts` | Distance → walk/drive time string (80m/min walk, 500m/min drive) |
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

## SessionStorage Contract

### Discover Flow (primary)
| Key | Set by | Read by | Shape |
|-----|--------|---------|-------|
| `discover_destination` | selectDestination | hotels page, checkout | `MatchedDestination` |
| `discover_landmark_coords` | selectDestination | hotels page | `{ lat: number, lng: number }` |
| `discover_checkin` | selectDestination, SearchControls | hotels page, checkout | `string (YYYY-MM-DD)` |
| `discover_checkout` | selectDestination, SearchControls | hotels page, checkout | `string (YYYY-MM-DD)` |
| `discover_guests` | selectDestination, SearchControls | hotels page, checkout | `{ adults: number, children: number[] }` |
| `discover_selected_hotel` | hotels page | checkout page | `HotelOption` (full object) |

### Flash/Explore Flow (secondary, parked)
| Key | Set by | Read by | Shape |
|-----|--------|---------|-------|
| `flash_selected_trip` | selectDestination, swipe flow | explore page | `FlashTripPackage` |
| `flash_generate_params` | selectDestination, FlashPlanInput | explore page | `{ departureDate, returnDate }` |
| `flash_vacation_trips` | selectDestination, useFlashVacation | explore page | `{ lastGenerateParams: { departureDate, returnDate } }` |
| `flash_origin_airport` | FlashPlanInput (IP geolocation) | selectDestination | `AirportInfo { code, name, lat, lng }` |
| `flash_traveler_type` | FlashPlanInput, selectDestination | explore page | `'solo' \| 'couple' \| 'family'` |
| `flash_budget_tier` | selectDestination (Budget-Friendly tile) | explore page | `'budget'` or absent |

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

## OpenClaw Agent-Native Integration

**Status:** Phase 1 + 2 + partial Phase 3 BUILT on `openclaw-agent` branch. Isolated — zero existing files touched.

**Branch:** `openclaw-agent` (separate from `master`)

HonestNomad as an agent-accessible travel tool on OpenClaw. Architecture: HN Agent (Claude Haiku) sits between OpenClaw and our existing APIs. No separate REST API, no API keys — the agent *is* the interface. Users discover/select hotels conversationally, then complete booking on our secure checkout page via tokenized link (`/book/{token}`). Supabase `booking_sessions` table for token management (30-min expiry, single-use). Rate re-verification at checkout. NUITEE_PAY for payment (MoR).

### Key Files (all new, on `openclaw-agent` branch)
| File | Purpose |
|------|---------|
| `lib/openclaw/agent.ts` | Main orchestrator — Claude Haiku with tool-use loop. Calls existing `searchDestinations()`, `searchHotelsForDiscoverFlow()`, `categorizeHotels()`, enriches with details/reviews |
| `lib/openclaw/systemPrompt.ts` | Strict grounding rules (facts-only), 3 tool definitions (`search_destination`, `search_hotels`, `select_hotel`) |
| `lib/openclaw/types.ts` | All TypeScript types — conversation, hotel summaries, booking sessions, rate limits |
| `lib/openclaw/sessions.ts` | Supabase booking session tokens — create (UUID, 30-min expiry), retrieve, mark used |
| `lib/openclaw/rateLimiter.ts` | Per-IP sliding window (10/min), daily global cap (1,000), hotel search per-session cap (5), kill switch |
| `app/api/openclaw/chat/route.ts` | POST endpoint for agent conversations, GET for health check |
| `app/api/openclaw/session/route.ts` | GET/POST for booking session retrieval + mark-as-used |
| `app/book/[token]/page.tsx` | Standalone checkout page — hydrates from Supabase, trust header, full hotel recap |
| `supabase/migrations/20260301_booking_sessions.sql` | Table schema + indexes + RLS |

**Full plan with phases, risks, and mitigations in `docs/TODO.md`.**

**Before going live:** Run Supabase migration, flip to real rates, integrate NUITEE_PAY, register on OpenClaw, Phase 3 safety testing (hallucination + adversarial).

---

## Background Tasks

- **Unsplash migration** — Paused at batch 11/70 (~16%). Superseded by Pexels pipeline below.
- **Pexels image pipeline** — Primary image source. 554/715 destinations downloaded (32,842 images, 8.5GB+). 155 remaining (~13hrs). Script: `npx tsx scripts/image-migration/pexels-migrate.ts --continuous`. 496 destinations already uploaded to Supabase (29,209 images). Backfill script ready for over-downloading (~63k extra images for quality pruning). AI validation script built (Claude Haiku 4.5, ~$150 for full run). Pipeline: finish download → backfill → validate → prune → upload → fix Malmö unicode issue.
  - Download: `scripts/image-migration/pexels-migrate.ts`
  - Backfill: `scripts/image-migration/pexels-backfill.ts`
  - Validate: `scripts/image-migration/validate-images.ts`
  - Upload: `scripts/image-migration/upload-pexels-to-supabase.ts`
  - Config: `scripts/image-migration/pexels-config.ts`
  - Progress: `scripts/image-migration/pexels-progress.json`
  - Manifest: `scripts/image-migration/pexels-manifest.json`
