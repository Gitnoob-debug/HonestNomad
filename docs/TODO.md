# HonestNomad - Development TODO

> Last updated: March 1, 2026

## Legend
- ✅ Done
- 🔄 In Progress
- ⏸️ Blocked
- [ ] To Do

---

## What's Built (Done) ✅

### Core Product
- ✅ **500 curated destinations** with 85k+ POIs, daily cost data, travel time matrix
- ✅ **Discover feature** (primary entry) — photo upload, URL paste, Claude Vision identification, confidence scoring, 3-tile alternatives, detail modals
- ✅ **Flash Vacation flow** (secondary entry) — swipe cards, explore map, hotel search, booking confirmation
- ✅ **Explore page** — vibe selection, POI map with zone clustering, interactive day planner, left sidebar
- ✅ **Package/Confirm page** — Trip Intelligence, day cards, walking routes, AI Travel Prep
- ✅ **LiteAPI hotel search** — sandbox integration, scoring/ranking (mock pricing active)
- ✅ **Anonymous browsing** — no login required until booking
- ✅ **Supabase** — DB, auth, image storage (5GB+)
- ✅ **Mapbox** — maps, geocoding
- ✅ **Vercel deployment** — live at honest-nomad-ud6y.vercel.app

### Discover Pipeline
- ✅ TikTok oEmbed caption extraction
- ✅ YouTube oEmbed (title + thumbnail)
- ✅ Multi-location support with tile grid picker
- ✅ 5-signal confidence scoring → 3 tiers (green/amber/red)
- ✅ Alternative tiles: Best Match + Closer to You + Budget-Friendly
- ✅ Trending fallback when no match found
- ✅ IP geolocation for proximity ranking
- ✅ Daily cost data for 495 destinations

### Simplified Discover → Hotel → Checkout Flow (March 2026)
- ✅ **3-click booking path** — Photo → destination tiles → hotel tiles → checkout (bypasses Flash/Explore)
- ✅ **Discover hotel search** — Separate `/api/hotels/discover-search` endpoint with GPS-based radius expansion (5km → 15km → 50km → city-wide)
- ✅ **Hotel categorization** — Closest (haversine), Budget (cheapest 3★+), High-End (highest stars/price)
- ✅ **Parallel photo enrichment** — `getHotelDetails` for all ~20 hotels via `Promise.all` (was sequential, too slow)
- ✅ **Walk-time hero metric** — "🚶 4 min walk to your spot" — converts distance to walk/drive time (pure math)
- ✅ **Smart pre-selection** — Recommended tile (Closest) gets 2/3 width, glow ring, "⭐ Recommended" badge, "Book this hotel" CTA
- ✅ **Featured tiles always pinned** — expanded list appears below, never replaces the top 3 picks
- ✅ **Clickable hotel cards** — entire card selects (goes to checkout), no separate button needed
- ✅ **Expanded list + map** — filters (price, stars), Mapbox map with landmark + hotel pins, list/map toggle
- ✅ **Checkout page** — booking summary with hotel hero, pricing breakdown, placeholder payment
- ✅ **Landmark GPS fix** — photo's GPS used for best match only; alternative tiles use destination's own coords
- ✅ **Country code fix** — passes ISO code ("JM") not full name ("Jamaica") to LiteAPI
- ✅ **Editable search controls** — date pickers + guest stepper, re-searches on update
- ✅ **Flash/Explore flow PARKED** — untouched, still accessible via `/flash`

---

## Current Focus: Conversion & Polish

### Discover → Book Flow (Active)
- ✅ Simplified 3-click flow built and deployed
- ✅ Walk-time hero metric + smart pre-selection
- ✅ Clickable cards + pinned featured tiles
- [ ] **Urgency/social proof** — Show cancellation policy, rate expiry, refundable badge prominently (data already available in `HotelOption`)
- [ ] **Mobile polish pass** — Verify hotel tiles, expanded list, checkout on mobile breakpoints
- [ ] **Error states** — Better handling when no hotels found, API timeout, rate expiry

### Discover Pipeline
- [ ] **YouTube Data API v3 key** — Unblocks video description/tag extraction for multi-location. Free, ~2 min setup. ⏸️ Needs API key
- [ ] **Instagram oEmbed** — Needs Meta developer app token. Free, ~15 min setup. ⏸️ Needs token
- [ ] **Video content analysis gap** — Pipeline only sees metadata/thumbnail, not actual video. CapCut overlays, destination footage, TikTok location tags all missed. Longer-term problem.

### Data Gaps
- [ ] **13 destinations missing POI data** — Blocked by Google Places budget cap. Need alternative data source (NOT Google Places API). Possible options: OpenStreetMap/Overpass, Foursquare, or Claude-generated POIs.
- [ ] **POI images** — Still reference Google API URLs. Need migration to Supabase Storage.
- 🔄 **Unsplash image migration** — Paused at batch 11/70 (~16%). Needs `UNSPLASH_ACCESS_KEY` in `.env.local` to resume.

### General Polish
- [ ] Improve loading states and error messages
- [ ] Mobile layout pass (Discover + Explore)
- [ ] Return-to-Discover state persistence (low priority)

---

## Next Up: Path to Real Bookings

These are the steps to go from demo to taking real money. Not started yet — current goal is demo-ready.

### 1. Switch to Real Rates
- [ ] Flip `USE_MOCK_RATES` to `false` in `lib/liteapi/hotels.ts`
- [ ] Verify LiteAPI sandbox returns real pricing
- [ ] Handle rate expiration (`et` field in seconds)

### 2. Prebook Integration
- [ ] Build `POST /rates/prebook` call in LiteAPI client
- [ ] Pass `offerId` from rate selection
- [ ] Store `prebookId` for booking step
- [ ] Handle availability failures gracefully

### 3. Booking Integration
- [ ] Replace stub in `app/api/book/route.ts` with real `POST /rates/book` call
- [ ] Pass `prebookId` + guest details to LiteAPI
- [ ] Store booking confirmation in Supabase
- [ ] Build booking confirmation page with hotel details, check-in info

### 4. Payment (NUITEE_PAY)
- [ ] Integrate LiteAPI Payment SDK (NUITEE_PAY)
- [ ] Replace fake tokenizer in `components/booking/GuestForm.tsx`
- [ ] LiteAPI becomes Merchant of Record (zero chargeback risk)
- [ ] No PII storage needed — passthrough to LiteAPI

### 5. Booking Management
- [ ] Wire up booking cancellation (`PUT /bookings/{id}`) — stub exists
- [ ] Booking retrieval from LiteAPI (currently DB-only)
- [ ] Sync LiteAPI bookings with Supabase

### 6. Revenue
- [ ] Decide on commission margin (`margin` param on rate requests)
- [ ] Set up LiteAPI account for payouts

---

## Backlog: High-Value LiteAPI Features

Not needed for MVP, but available in the API and could differentiate:

| Feature | LiteAPI Endpoint | Why It Matters |
|---------|-----------------|----------------|
| **Semantic search** | `GET /data/hotels/semantic-search` | Natural language → hotels. "Romantic rooftop in Bali" — fits discovery UX perfectly |
| **Hotel Q&A** | `GET /data/hotel/ask` | "Does this hotel have a pool?" on explore page |
| **Price index** | `GET /priceindex/city` | "Hotels in Lisbon are 18% cheaper than usual" on destination cards |
| **Room-level selector** | Room data in rates response | Show bed types, room size, views, per-room photos instead of just "Standard Room" |
| **Detailed cancellation display** | `cancelPolicyInfos` in rates | "Free cancel until March 15, then $150 fee" instead of just RFN/NRFN |
| **Loyalty program** | `/loyalties` + `/guests` APIs | "Earn 3% back on every booking" — built-in, no custom infrastructure |
| **Voucher system** | `/vouchers` CRUD | Promo codes, referral discounts, first-booking offers |
| **Weather on cards** | `GET /data/weather` | Show forecast on destination/trip cards |
| **AI room image search** | `GET /data/hotels/room-search` | Search rooms by visual attributes — fits social-photo discovery |
| **Market analytics** | `POST /analytics/markets` | Power "Trending destinations" with real booking data |

---

## Backlog: Product Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Email notifications (booking confirmation, reminders) | Medium | Resend or SendGrid |
| Trip sharing (shareable URL, OG tags) | Medium | |
| Save trip for later (localStorage) | Medium | |
| PDF itinerary export | Low | @react-pdf/renderer |
| Calendar integration (.ics) | Low | |
| User profiles (home airport, saved traveler details) | Low | Supabase Auth already set up |
| Admin dashboard (bookings, revenue) | Low | After real bookings exist |

---

## Known Blockers

| Blocker | What's Needed | Effort |
|---------|--------------|--------|
| YouTube multi-location | YouTube Data API v3 key (free) | ~2 min setup |
| Instagram oEmbed | Meta developer app token (free) | ~15 min setup |
| Unsplash migration paused | `UNSPLASH_ACCESS_KEY` in `.env.local` | Have key, just needs adding |
| 13 destinations missing POIs | Alternative to Google Places | Research needed |
| POI images reference Google | Migrate to Supabase Storage | Script work |
| Local build OOM | `destinations.ts` 7000+ lines | Use `npx tsc --noEmit` locally. Vercel builds fine. |
