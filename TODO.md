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
- [ ] **Test confidence + alternatives on Vercel** — Deployed (commit `94ecb5e`), needs manual testing of all states: matched w/ alternatives, no-match trending, low-confidence trending, multi-location picker

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

### Confidence Scoring & Alternative Tiles (Feb 23, 2026)
- [x] Confidence scoring — 5-signal weighted formula (Claude confidence 0.30, match type 0.30, source reliability 0.15, geocoding 0.15, consistency 0.10) → 3 tiers (≥0.70 green, ≥0.40 amber, <0.40 red)
- [x] IP geolocation — ip-api.com primary + ipapi.co fallback, 1hr in-memory cache, private IP handling
- [x] Alternative destination finder — Closer (reachability), Budget (<70% cost), Similar Vibe (different region), with fallback logic when no user airport
- [x] Trending fallback — seasonalFit × 0.4 + popularity × 0.3 + reachability × 0.3, region diversity enforced
- [x] Discover page rewrite — ConfidenceBadge component, DestinationTile component, 4-tile grid layout, trending-only state, confidence dots on multi-location picker
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
| Project memory | `MEMORY.md` |
| Lessons learned | `LESSONS-LEARNED.md` |

---

*Brand name "HonestNomad" is temporary.*
