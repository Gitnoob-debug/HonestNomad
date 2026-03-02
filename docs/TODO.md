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
- ✅ **Smart pre-selection** — Recommended tile gets glow ring, "⭐ Recommended" badge, "Book this hotel" CTA
- ✅ **3 equal featured tiles** — Recommended + Best Value + Premium Pick, same size 3-col grid
- ✅ **Clickable hotel cards** — entire tile/card selects (goes to checkout), carousel edges navigate photos
- ✅ **Expanded list + map** — Mapbox map with landmark + hotel pins, list/map toggle
- ✅ **Map view integration** — map view skips featured tiles, shows full list + map for maximum space
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
- ✅ Hotel data enrichment — reviews, HD images, room details, chain, cancel policy
- ✅ Dynamic hotel filters — sort, price ranges, stars (data-driven)
- ✅ Desktop sidebar layout — sticky left sidebar with dates/guests/sort/filters/view, full-width hotel area
- ✅ Equal-size featured tiles — 3-col grid, no oversized recommended tile
- ✅ Fully clickable tiles — entire card selects hotel, carousel edges still navigate photos
- ✅ Map view skips featured tiles — shows full list + map for maximum space
- ✅ Map marker lifecycle fix — separated creation from selection styling (no more top-left jump)
- ✅ Destination alternatives fix — budget prefers same region, Similar Vibe fallback fills empty slots
- [ ] **"Honest Take" AI summaries** — One candid sentence per hotel synthesized by Claude from reviews, amenities, price, location. Batched single prompt for all ~20 hotels during enrichment. Stored as `honestTake` field on `HotelOption`. The brand differentiator.
- [ ] **Mobile polish pass** — Verify hotel tiles, expanded list, checkout on mobile breakpoints
- [ ] **Error states** — Better handling when no hotels found, API timeout, rate expiry

### Discover Landing Page (Planned)
- [ ] **Trending Now feed** — Below the input, show seasonal destination cards from our 500 destinations. Clicking one skips identification and goes straight to hotels. Turns empty page into a browsable, inspiring experience.
- [ ] **HonestNomad TikTok channel** — Create a TikTok channel with destination videos. Embed 3-4 as clickable example links on the discover page ("Try this TikTok"). Users see real content, click, and experience the full flow — natural demo that doubles as marketing.
- [ ] **Auto-submit on paste** — When user pastes a URL, auto-trigger "Find this place" immediately. The intent is obvious — no extra click needed.


### Discover Pipeline
- [ ] **YouTube Data API v3 key** — Unblocks video description/tag extraction for multi-location. Free, ~2 min setup. ⏸️ Needs API key
- [ ] **Instagram oEmbed** — Needs Meta developer app token. Free, ~15 min setup. ⏸️ Needs token
- [ ] **Video content analysis gap** — Pipeline only sees metadata/thumbnail, not actual video. CapCut overlays, destination footage, TikTok location tags all missed. Longer-term problem.

### Data & Images
- ✅ **715 curated destinations** — expanded from 500 (200 new + 15 India destinations)
- ✅ **Pexels image download** — 554/715 done, 32,842 images (8.5GB+). 155 remaining (~13hrs).
- ✅ **Supabase upload** — 496 destinations already uploaded (29,209 images). Resume script ready.
- ✅ **Backfill script built** — over-downloads extra images per tier for quality pruning (~63k additional images)
- ✅ **AI validation script built** — Claude Haiku 4.5 scores images 1-5 for location relevance, `--prune` deletes junk
- 🔄 **Image pipeline in progress** — remaining steps: finish initial download → backfill over-download (~62hrs) → AI validate (~$150) → prune rejects → upload survivors to Supabase → fix Malmö filename issue
- [ ] **13 destinations missing POI data** — Blocked by Google Places budget cap. Need alternative data source (NOT Google Places API). Possible options: OpenStreetMap/Overpass, Foursquare, or Claude-generated POIs.
- [ ] **POI images** — Still reference Google API URLs. Need migration to Supabase Storage.

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

## Future: OpenClaw Agent-Native Integration

> **Status:** Planned. Build after core Discover → Book flow is live with real payments.
> **Premise:** Expose HonestNomad as an agent-accessible travel tool on OpenClaw, capturing the emerging agent-to-agent market. Users discover and select hotels through conversational AI, then complete booking on our secure checkout page.

### Architecture

```
OpenClaw Agent ←→ HN Agent (Claude Haiku orchestrator) ←→ Our existing APIs
                         ↕
                  Conversation state
                  (destination, hotels shown,
                   user preferences, rate expiry)
                         ↓
              Secure booking link → /book/{token}
              User completes checkout in browser
              NUITEE_PAY handles payment (MoR)
```

**Key design decision:** No separate REST API. The HN Agent *is* the interface — it speaks natural language to OpenClaw on one side and calls our existing internal functions on the other. No API keys, no auth system. Rate limiting at middleware level.

### Phase 1: HN Agent Layer
- [ ] **Agent endpoint** — Single POST endpoint that receives natural language from OpenClaw, routes to our pipeline
- [ ] **System prompt** — Strict grounding rules: only state facts present in hotel data, never infer amenities/policies not explicitly provided, pre-generated "Honest Takes" only (no improvised editorializing)
- [ ] **Destination discovery** — Agent calls our existing destination matching (715 curated destinations, vibes, daily costs, highlights). Structured data formatted into sentences, not free-text generation
- [ ] **Hotel search orchestration** — Agent calls `searchHotelsForDiscoverFlow()` + `categorizeHotels()`, returns top 3 (Closest, Budget, Premium) with walk-time, price, stars, cancellation, Honest Take
- [ ] **Conversational refinement** — Handle "cheaper", "closer to beach", "with a pool" by re-searching with adjusted filters. Agent manages conversation state (which hotels were shown, user preferences)
- [ ] **Image URLs in responses** — Return hotel HD photo URLs, Supabase destination image URLs, and Mapbox Static Images API URLs (map with landmark + hotel pins, no JS needed). Let OpenClaw platform decide how to render them
- [ ] **Rate expiry transparency** — Agent tells user "this rate is live for X minutes" (from LiteAPI `et` field). Creates natural urgency, sets honest expectations

### Phase 2: Secure Booking Handoff
- [ ] **`booking_sessions` Supabase table** — UUID token, hotel/dates/guests JSON, `created_at`, `used` boolean
- [ ] **Token generation** — Agent creates session when user picks a hotel, returns `honest-nomad.com/book/{token}`
- [ ] **Token security** — 30-minute expiry, single-use (mark `used = true` on load), cryptographic UUIDs
- [ ] **Standalone checkout page** — `/book/{token}` hydrates from Supabase instead of sessionStorage. Must work as a landing page: hero image, hotel recap, price, dates, cancellation policy, trust signals. Elegant enough that the link doesn't feel sketchy
- [ ] **Rate re-verification** — On checkout load, re-fetch rate from LiteAPI. If price changed, show "Price updated since your search" with new number. Honest, no surprises
- [ ] **Payment** — Same NUITEE_PAY flow as regular checkout. No PII stored. LiteAPI is MoR

### Phase 3: Safety & Abuse Protection
- [ ] **Rate limiting** — Per-session limits (X searches per conversation), global daily caps
- [ ] **Cost monitoring** — Track Claude token spend + LiteAPI calls per day. Alert thresholds
- [ ] **Kill switch** — Ability to disable agent endpoint instantly if costs spike
- [ ] **Hallucination testing** — Systematic testing of agent responses against actual hotel data. Verify cancellation policies, amenities, prices match source data exactly
- [ ] **Adversarial testing** — Prompt injection attempts, out-of-scope requests, attempts to extract system prompt or internal data

### Phase 4: Post-Booking Support
- [ ] **Design post-booking state** — What does the user see after booking? Confirmation page, email, booking reference
- [ ] **Support agent workflow** — Cancellation requests, modification requests, dispute handling. Needs its own design pass — how does a user who booked through an agent get support?
- [ ] **Booking attribution** — Tag bookings with `source: 'openclaw'` for tracking conversion rates and revenue from agent channel
- [ ] **Support contact clarity** — Booking confirmation email clearly from HonestNomad with our contact info, regardless of which agent platform originated the booking

### Risks & Mitigations (Documented)

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Rate drift** — Price changes between agent quote and checkout | Medium | Re-fetch at checkout + "price updated" UI. Agent communicates rate window upfront |
| **Agent hallucination** — Wrong cancellation policy, invented amenities | High | Strict system prompt, structured data only, pre-generated Honest Takes, no free-text hotel descriptions |
| **Conversion drop-off** — User doesn't click booking link or bounces | Medium | Standalone checkout page designed as landing page with full hotel recap + trust signals |
| **Abuse / cost spike** — Bots or heavy usage burning through Claude + LiteAPI credits | Medium | Rate limits, daily caps, kill switch, cost alerts |
| **No visual context** — Text-only loses the "fall in love" moment | Low-Med | Return image URLs (hotel photos, destination images, static Mapbox maps). Platform renders as able |
| **Support routing** — User doesn't know who to contact post-booking | Medium | Clear branding on confirmation email + checkout page. Support workflow design in Phase 4 |
| **Token interception** — Someone accesses a booking link not meant for them | Low | Short expiry (30 min), single-use, no PII in session (just hotel + dates), crypto UUIDs |

### Dependencies
- Requires **real rates** (flip `USE_MOCK_RATES`) — in progress
- Requires **NUITEE_PAY payment integration** — not started
- Requires **"Honest Take" AI summaries** — planned (critical for agent channel where text does the work of photos)
- OpenClaw platform access / registration process — research needed

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
| Pexels download finishing | 155 destinations remaining | ~13hrs runtime |
| Pexels backfill | Over-download for quality pruning | ~62hrs runtime |
| AI image validation | Claude Haiku 4.5 scoring | ~$150, 3-4hrs |
| Malmö filename bug | Unicode ö in Supabase upload paths | Quick fix |
| 13 destinations missing POIs | Alternative to Google Places | Research needed |
| POI images reference Google | Migrate to Supabase Storage | Script work |
| Local build OOM | `destinations.ts` 7000+ lines | Use `npx tsc --noEmit` locally. Vercel builds fine. |
