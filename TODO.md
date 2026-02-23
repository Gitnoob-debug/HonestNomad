# HonestNomad - TODO

> Last updated: February 23, 2026
> Architecture: Next.js 14 + Supabase + LiteAPI + Mapbox + Claude (OpenRouter)
> Hotels only. No flights. No chat mode. All work on master.

---

## In Progress

### Discover Feature — Social Media API Integration
- [ ] **Get YouTube Data API v3 key** — Google Cloud Console → enable API → create key → add as `YOUTUBE_DATA_API_KEY` in `.env.local` and Vercel. Free tier: 10,000 units/day. Confirmed: `videos.list?part=snippet` works with just an API key (no OAuth). Only `captions.download` needs OAuth from video owner — we don't use that.
- [ ] **Get Meta/Instagram oEmbed token** — developers.facebook.com → create app → get App ID + Secret → add as `META_APP_ID` and `META_APP_SECRET` in `.env.local` and Vercel. Free, no review needed. Gets Instagram post captions.
- [ ] **Wire YouTube Data API into resolver** — Replace failed transcript extraction with `videos.list?part=snippet` call to get video description + tags. Edge case: sparse descriptions ("Subscribe for more!") — title + tags are fallback signals, and confidence scoring handles low-quality extractions gracefully.
- [ ] **Wire Instagram oEmbed into resolver** — Add `fetchInstagramOEmbed()` using Meta app token
- [ ] **Remove debug pipeline trace** — Strip `_debug` field from `LocationAnalysisResponse` and remove trace panel from discover page
- [ ] **Remove `youtube-transcript` npm package** — No longer needed once YouTube Data API is wired in

### Unsplash Image Migration (Background)
- [ ] **Running in background** — ~1 batch/hour, progress in `scripts/image-migration/progress.json`
- [ ] Restart if stopped: `npx tsx scripts/image-migration/migrate-images.ts --continuous`
- [ ] Review downloaded images and upload approved ones to Supabase Storage

---

## P0 — Critical Fixes (Before Sharing)

- [ ] **Replace alert() booking button** — `app/flash/confirm/page.tsx` pops `alert("Booking flow coming soon!")`. Replace with proper modal or real booking redirect
- [ ] **Remove console.log statements** — Strip or wrap in `process.env.NODE_ENV === 'development'`
- [ ] **Fix hardcoded Supabase image URLs** — `app/page.tsx` has raw Supabase Storage URLs for landing page
- [ ] **Fix database schema mismatch** — `bookings` table still has `duffel_*` columns but code writes `provider_*`. Need ALTER TABLE migration
- [ ] **Fix `any` types** — `app/flash/confirm/page.tsx` has `itinerary: any[]` and `favoriteStops: any[]`

---

## P0.5 — Video Content Analysis (Accuracy Unlock)

> **The problem:** The Discover pipeline only sees metadata (caption + thumbnail). For many travel TikToks/Reels the caption is just hashtags, the thumbnail is a selfie, and the actual destination footage lives in the video frames. This causes confident wrong answers (e.g., selfie on a plane → Claude says "Las Vegas" with high confidence).

### Phase 1: TikTok Location Tags (Easy — days)
- [ ] **Extract TikTok location/POI tag from page HTML** — TikTok attaches a 📍 structured location tag to many videos (e.g., "United States of America - Columbus"). This is the most reliable signal when present. Scrape from embed HTML or TikTok page JSON. No API key needed.
- [ ] **Add as highest-priority signal** — Location tag should outrank caption analysis and vision when available
- [ ] **Vision hallucination guardrails** — When caption is generic (just hashtags) and thumbnail is ambiguous (person, plane, food), reduce confidence rather than confidently guessing wrong. Adjust Claude vision prompt to say "respond with low confidence if the image doesn't clearly show a recognizable place"

### Phase 2: Client-Side Video Frame Capture (Medium — weeks)
- [ ] **HTML5 `<video>` + `<canvas>` frame extraction** — Load video in browser, seek to 4-6 evenly-spaced timestamps, capture frames via canvas. Send frames alongside URL to the API. Avoids all server-side video processing.
- [ ] **Multi-frame vision analysis** — Single Claude Sonnet call with 4-6 frames: "Identify all locations visible across these video frames." Batching frames in one call is cheaper and gives Claude cross-frame context.
- [ ] **CORS handling** — TikTok/Instagram likely block cross-origin video playback. Options: (a) proxy through our server, (b) use platform embed APIs, (c) user uploads frames manually as fallback.
- **Cost estimate:** ~$0.02/request (5 frames × ~1K tokens each). Current single-thumbnail approach: ~$0.005. So 4x AI cost but still negligible.
- **Latency estimate:** ~8-12s total (vs current ~3-5s). Acceptable for a "smart analysis" feature.

### Phase 3: Server-Side Video Processing (Hard — future)
- [ ] **Video download + ffmpeg keyframe extraction** — Download video server-side, extract keyframes with ffmpeg. Most reliable but requires ffmpeg binary (not available on Vercel default runtime).
- [ ] **Infrastructure options:** (a) Vercel Pro/Enterprise with custom runtime, (b) Separate AWS Lambda with ffmpeg layer, (c) Cloudinary/Mux video processing API, (d) Self-hosted worker
- [ ] **Text overlay OCR** — CapCut edits always have text overlays ("Day 1 in Bali"). OCR extraction from frames would catch these. Could use Claude vision's text reading or a dedicated OCR service.
- [ ] **Audio transcription** — Narration ("so we just landed in...") via Whisper API. Low priority since most TikToks use music, not narration.

---

## P1 — Hotel Booking (Make It Real)

### Enable Real Pricing
- [ ] Set `USE_MOCK_RATES = false` in `lib/liteapi/hotels.ts`
- [ ] Handle edge cases: no rates returned, rate expiration, currency conversion

### Implement LiteAPI Payment SDK
- [ ] Add prebook endpoint: `POST /rates/prebook` with `usePaymentSdk: true`
- [ ] Embed LiteAPI payment JS widget (Stripe Elements under the hood)
- [ ] Handle payment redirect flow → book confirmation
- [ ] Store real booking reference in Supabase
- [ ] Remove mock card fields from GuestForm.tsx

### Database Migration
- [ ] Rename `duffel_*` columns to `provider_*` in bookings table
- [ ] Drop unused `conversation_id` column

### Booking Management
- [ ] Cancel booking endpoint
- [ ] Booking status in My Bookings page
- [ ] Email confirmation (Resend or SendGrid)

---

## P2 — Polish & UX

- [ ] **Landing page hero image** — Replace generic gradient with real destination photo
- [ ] **Session storage resilience** — "Session expired, start over" fallback for browser back/forward
- [ ] **Don't auto-select first hotel** — Require explicit tap
- [ ] **Lazy-load Magic Package** — Skeleton placeholder if Claude API is slow
- [ ] **Accessibility** — Missing aria-labels, generic image alt text
- [ ] **Mobile swipe card polish** — Image carousel portrait orientation, tap zone affordance
- [ ] **Consistent error messaging** — Unify voice/tone across error states

---

## P3 — Price Intelligence & Hot Deals

- [ ] Create `price_index` Supabase table for historical rate tracking
- [ ] Seed data: 50 key destinations, benchmark hotels, rolling date windows
- [ ] Vercel/Supabase cron for daily rate sampling
- [ ] Price signal badges on swipe cards (Hot Deal, Prices Dropping, etc.)
- [ ] "Best time to visit" cross-referencing price data with seasonal data

---

## P4 — Data Enrichment

### Daily Cost Data Quality
- [ ] **Numbeo spot-check** — Cross-reference 20-30 key cities (Bangkok, NYC, Paris, Zurich, Tirana, Bali, etc.) against Numbeo's free website data. Adjust outliers in `data/daily-costs.json` and re-run `--merge`
- [ ] **Re-enrich with calibration anchors** — Update Claude prompt with Numbeo-verified anchor cities (e.g., "Bangkok food = $20, Zurich food = $120") so the model calibrates relative to known-good data points
- [ ] **Numbeo API (future)** — If budget allows ($500+/year), replace Claude estimates with Numbeo's crowdsourced data for meal costs, transport, entertainment. Would be the gold standard
- [ ] **Periodic refresh** — Re-run enrichment quarterly or when adding new destinations. Script already has resume support and `lastUpdated` tracking

### POI Data
- [ ] Fix 49% junk POI descriptions ("Museum - highly rated") from existing data
- [ ] Fix image bug: `itinerary-generator.ts` uses expired `poi.imageUrl` instead of `resolvePOIImageUrl()`
- [ ] Enrich `bestTimeOfDay` from POI categories (56% currently "any")
- [ ] 17 destinations have <10% Supabase image coverage (Istanbul, Tbilisi, etc.)
- [ ] POI migration for 13 new destinations (blocked by Google API budget cap)
- [ ] Migrate POI images from Google API URLs to Supabase Storage

---

## P5 — Loyalty & Personalization

- [ ] Wire up `lib/loyalty/` — hotel chain → loyalty program matching (built, not connected)
- [ ] Show loyalty badges on hotel cards
- [ ] "Because you liked X" recommendations from swipe history
- [ ] Revealed preferences already learning from swipes (active, 40% weight when 10+ signals)

---

## P6 — Trust & Social Proof

- [ ] Testimonials or stats on landing page
- [ ] Share/save trip link for travel partners
- [ ] Price range preview before budget tier selection
- [ ] Price transparency (breakdown, no hidden fees messaging)

---

## P7 — Mobile & Platform

- [ ] PWA support (manifest.json, service worker)
- [ ] Responsive polish pass
- [ ] Eventually: React Native (Expo) app

---

## Recently Completed

### Daily Cost Data & Budget Algorithm Rebuild (Feb 23, 2026)
- [x] **DailyCosts type** — Added `DailyCosts` interface to `types/flash.ts` with `foodPerDay`, `activitiesPerDay`, `transportPerDay`, `source`, `lastUpdated`. Added `dailyCosts?` field to `Destination` type
- [x] **Claude enrichment script** — `scripts/enrich-daily-costs.ts` uses Claude Haiku (via OpenRouter) to generate per-person daily cost estimates in USD for all 495 destinations. Modes: `--test` (5 cities), default (all), `--merge` (patch destinations.ts), `--review` (summary stats). Resume support via `data/daily-costs.json`
- [x] **Enriched all 495 destinations** — Range: $40/day (Hanoi, Ella, Kandy) to $400/day (Bora Bora). Mean $111, median $100. Sanity checks passed: Bangkok $50, Zurich $195, NYC $195, Tirana $50
- [x] **Merged into destinations.ts** — Each destination now has `dailyCosts: { foodPerDay, activitiesPerDay, transportPerDay, source: 'claude', lastUpdated }` field
- [x] **Budget-Friendly algorithm rewrite** — Now compares real daily living costs (food + activities + transport) instead of static `averageCost`. Shows actual dollar savings in reasoning text: "Save ~$40/day · Great for food & culture". Falls back to `averageCost` for any destination without `dailyCosts`
- [x] **Daily cost on tiles** — `dailyCostPerPerson` field added to `AlternativeTile`. Tiles show `~$75/day` instead of `~$3,500/wk`. Detail modal shows itemized breakdown: food, activities, transport with totals
- [x] **All tiles enriched** — Closer, Budget, and Trending tiles all carry `dailyCostPerPerson` data

### Discover Tiles — Immersive Cards + Distance Fix (Feb 22, 2026)
- [x] **Flash-card aesthetic** — Full-bleed images, gradient overlays, vibe pills, highlights on all Discover tiles. Shared VIBE_STYLES module (`lib/flash/vibeStyles.ts`)
- [x] **Image carousels on tiles** — Multi-image carousel with tap zones (left 30%/right 30%/center 40%), swipe gestures, progress bars. Uses `getDestinationImagesById()` for up to 6 images per tile
- [x] **Detail modal** — `DiscoverDetailModal` with hero ImageCarousel, tagline (`generateTagline`), city pitch (`generateCityPitch`), vibes, all highlights, cost card, "Explore" CTA. Follows TripDetailModal layout
- [x] **3-tile layout** — Removed "Similar Vibe" (was 4 tiles). Now: Best Match + Closer to You + Budget-Friendly. Grid: `sm:grid-cols-3`
- [x] **Haversine distance for "Closer to You"** — Replaced coarse 4-bucket reachability scoring with actual `haversineKm()` from user IP lat/lng to destination lat/lng. Now only shows destinations genuinely closer than the matched one. Removed "prefer different country" bias
- [x] **Multi-location → tiles consistency** — Picking from multi-location grid now shows immersive tiles (alternatives pre-computed server-side per entry) instead of old plain confirmed view
- [x] **Extracted components** — `components/discover/DestinationTile.tsx`, `DiscoverDetailModal.tsx`, `ConfidenceBadge.tsx` with barrel export

### Confidence Scoring & Alternative Tiles (Feb 2026)
- [x] Confidence scoring — 5-signal weighted formula (Claude confidence 0.30, match type 0.30, source reliability 0.15, geocoding 0.15, consistency 0.10) → 3 tiers (≥0.70 green, ≥0.40 amber, <0.40 red)
- [x] IP geolocation — ip-api.com primary + ipapi.co fallback, 1hr in-memory cache, private IP handling
- [x] Alternative destination finder — Closer (haversine distance), Budget (<70% cost), with fallback logic when no user location
- [x] Trending fallback — seasonalFit × 0.4 + popularity × 0.3 + reachability × 0.3, region diversity enforced
- [x] Discover page rewrite — ConfidenceBadge component, DestinationTile component, 3-tile grid layout, trending-only state, confidence dots on multi-location picker
- [x] Exported scoring functions from diversityEngine.ts (scoreSeasonalFit, scoreVibeMatch, scoreBudgetFit, scoreReachability)
- [x] Resolver enrichment — all paths return alternatives or trending, confidence floor (0.20) triggers trending
- [x] API route — extracts client IP from x-forwarded-for / x-real-ip headers

### Discover Feature (Feb 2026)
- [x] Photo upload → Claude Vision → location identification
- [x] Client-side image compression (canvas resize to 1024px, JPEG 0.85)
- [x] TikTok oEmbed for caption extraction
- [x] YouTube oEmbed for title + thumbnail
- [x] Multi-location caption analysis (Claude Haiku) with tile grid picker
- [x] Parallel geocoding with Promise.all
- [x] Destination matching (exact name, substring, haversine 80km)
- [x] Booking funnel integration (sessionStorage → `/flash/explore`)
- [x] Pipeline debug trace for diagnosing extraction failures

### Flash Vacation Polish (Feb 2026)
- [x] 5-step progress bar (Vibe → Explore → Stay → Review → Package)
- [x] "Your Adventure Package" reveal step with assembled items
- [x] Zero-friction onboarding (no profile gate, inline traveler pills)
- [x] Kill profile dependency from scoring engine (-301 lines)
- [x] Richer swipe cards with image carousels, taglines, POI counts
- [x] Hotel map view with POI overlay markers
- [x] Smart hotel zone clustering (IQR-based)

### Infrastructure (Jan 2026)
- [x] LiteAPI sandbox testing — all endpoints verified
- [x] 423→500 curated destinations (~93% of global tourism traffic)
- [x] 85k+ POIs across destinations
- [x] Travel time matrix
- [x] Revealed preference learning from swipes
- [x] Draft trips saved to Supabase
- [x] Loyalty program integration (airlines + hotels)

---

## API Keys & Services

| Service | Purpose | Cost Model |
|---------|---------|------------|
| Supabase | DB, Auth, Storage (5GB images) | Free tier |
| LiteAPI/Nuitee | Hotel search, rates, booking | Free searches, 2.9-3.9% per booking |
| Mapbox | Maps, geocoding | Free tier (100k loads/month) |
| OpenRouter → Claude | Vision, text analysis, AI features | Pay per token |
| Unsplash | Image migration (scripts only) | Free (50 req/hour) |
| Google Places | POI data (scripts only) | **DO NOT RUN** without permission |

---

## File Quick Reference

| Need to... | Look in... |
|------------|------------|
| Discover feature UI | `app/discover/page.tsx` |
| Location resolver pipeline | `lib/location/resolver.ts` |
| Location analysis API | `app/api/location/analyze/route.ts` |
| Location types | `types/location.ts` |
| Hotel search logic | `lib/liteapi/hotels.ts` |
| Hotel API client | `lib/liteapi/client.ts` |
| AI prompts (Magic Package) | `lib/claude/prompts.ts` |
| Trip generation + scoring | `lib/flash/tripGenerator.ts`, `lib/flash/diversityEngine.ts` |
| Destination database (500) | `lib/flash/destinations.ts` |
| POI data (85k) | `data/pois/*.json` |
| Swipe UI | `components/flash/ImmersiveSwipeCard.tsx` |
| Explore/Map page | `app/flash/explore/page.tsx` |
| Flash input form | `components/flash/FlashPlanInput.tsx` |
| Trip state management | `hooks/useFlashVacation.ts` |
| Image migration scripts | `scripts/image-migration/` |
| Daily cost enrichment | `scripts/enrich-daily-costs.ts` |
| Daily cost data (raw) | `data/daily-costs.json` |
| Budget algorithm | `lib/location/alternativeFinder.ts` |
| Project memory | `MEMORY.md` |
| Lessons learned | `LESSONS-LEARNED.md` |

---

*Brand name "HonestNomad" is temporary.*
