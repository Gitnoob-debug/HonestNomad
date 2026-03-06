# HonestNomad - Development TODO

> Last updated: March 3, 2026

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

## Current Focus: LiteAPI Whitelabel Widget Integration

### Decision (March 3, 2026)
Replace custom hotel pages (tiles, rooms, checkout) with LiteAPI's pre-built whitelabel booking site. Eliminates ~3,500 lines of custom code, enables real bookings immediately. Custom hotel pages preserved on `master` as fallback.

### Whitelabel Integration (Merged to master — March 5, 2026)
- ✅ **Get whitelabel domain** — `flashtravel.dev` custom domain, verified + SSL active
- ✅ **Set up custom domain** — Vercel DNS: 4 A records + www CNAME (cloudfront) + 4 Amazon CAA records
- ✅ **Customize whitelabel** — primaryColor=#2563EB, font=Inter, border-radius=Soft, hero text updated
- ✅ **Add `/api/places/lookup` endpoint** — Real-time landmark placeId lookup. $0.01/call, ~200ms. Falls back to city placeId
- ✅ **Modify `selectDestination()`** — Builds whitelabel URL with placeId + dates + occupancies + sorting=6 + clientReference. Redirects to flashtravel.dev
- ✅ **Merge to master** — Fast-forward merge, 5 files, 399 lines added
- [ ] **Run placeId batch script** — Populate `destinations.json` with city-level Google Place IDs via LiteAPI `/data/places`. ~$7.15, ~3 min runtime. Script: `scripts/populate-place-ids.ts`
- [ ] **Test full flow** — Photo → tiles → whitelabel with pre-filled search → hotel selection → rooms → checkout → booking
- [ ] **Upload logo + favicon** to whitelabel appearance settings

### Previous Custom Hotel Pages (Built, Now Superseded)
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
- ⏸️ **"Honest Take" AI summaries** — PARKED. May revisit as interstitial page or sidebar alongside widget
- ⏸️ **Mobile polish pass** — PARKED. Whitelabel handles mobile responsiveness
- ⏸️ **Error states** — PARKED. Whitelabel handles error states

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
- ✅ **Pexels initial download complete** — 709/709 destinations, 41,919 images, 13,758 API calls
- 🔄 **Pexels backfill** — Over-downloading extra images per tier (T1→260, T2→165, T3→170). 4/709 done (amsterdam, athens, bali, bangkok). ~82k additional images remaining. Needs restart.
- ✅ **Quality control script built** — `quality-control.ts` — integrated 3-phase pipeline: hash dedup → AI relevance scoring → content diversity enforcement. Tested on Paris (30% rejected), Niagara-on-the-Lake (75% rejected), Taos (82% junk).
- ✅ **QC cost approach decided** — Use Claude Code subscription (Read tool vision) instead of OpenRouter API (~$360 saved). Will run as single workload after backfill completes.
- ✅ **Supabase upload script** — 496 destinations already uploaded (29,209 images). Resume-capable.
- 🔄 **Image pipeline remaining steps** — restart backfill (~83hrs) → QC pass (via Claude Code Read tool) → prune rejects → upload survivors to Supabase
- [ ] **Malmö filename bug** — Unicode ö in filenames breaks Supabase upload. Needs sanitization.
- [ ] **13 destinations missing POI data** — Blocked by Google Places budget cap. Need alternative data source (NOT Google Places API). Possible options: OpenStreetMap/Overpass, Foursquare, or Claude-generated POIs.
- [ ] **POI images** — Still reference Google API URLs. Need migration to Supabase Storage.

### General Polish
- [ ] Improve loading states and error messages
- [ ] Mobile layout pass (Discover + Explore)
- [ ] Return-to-Discover state persistence (low priority)

---

## Next Up: Path to Real Bookings

> **With whitelabel integration, most of this is handled by LiteAPI automatically.** The whitelabel site manages rates, prebook, booking, payment (Stripe), and confirmation emails. We only need to set up the business/account side.

### With Whitelabel (New Path)
- [ ] **Activate whitelabel** — Get domain, customize branding, set commission %
- [ ] **Set commission margin** — Configure markup % in LiteAPI dashboard
- [ ] **Set up payout account** — Bank details in LiteAPI for weekly payouts (every Monday, post-check-in)
- [ ] **Webhook integration** — Receive booking notifications to track conversions + revenue in our Supabase
- [ ] **`clientReference` tracking** — Tag each whitelabel redirect with session ID for attribution

### Without Whitelabel (Original Path — preserved as fallback)
- [ ] Flip `USE_MOCK_RATES` to `false` in `lib/liteapi/hotels.ts`
- [ ] Prebook integration (`POST /rates/prebook`)
- [ ] Booking integration (`POST /rates/book`)
- [ ] NUITEE_PAY payment SDK
- [ ] Booking confirmation page
- [ ] Booking management (cancellation, retrieval)

---

## Future: OpenClaw Agent-Native Integration

> **Status:** Phase 1 + 2 + partial Phase 3 **BUILT** on `openclaw-agent` branch (9 new files, 2,088 lines, zero existing files touched). Ready for testing once real rates + NUITEE_PAY are live.
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

### Phase 1: HN Agent Layer ✅ Built (`openclaw-agent` branch)
- ✅ **Agent endpoint** — `POST /api/openclaw/chat` receives natural language, orchestrates tool calls, returns curated response. `GET` health check.
- ✅ **System prompt** — Strict grounding rules in `lib/openclaw/systemPrompt.ts`: facts-only, walk-time hero, never infer amenities/policies. 3 tool definitions for Claude tool-use.
- ✅ **Destination discovery** — `search_destination` tool calls `searchDestinations()` + broad fallback search across 715 destinations. Returns vibes, highlights, daily costs, Supabase image URLs.
- ✅ **Hotel search orchestration** — `search_hotels` tool calls `searchHotelsForDiscoverFlow()` + `categorizeHotels()` + parallel enrichment (details + reviews). Returns top 3 + up to 10 others with walk-time, price, stars, cancellation.
- ✅ **Conversational refinement** — Agent manages conversation state (destination, hotels shown, dates, guests, rate expiry). Claude Haiku handles follow-up queries with context.
- ✅ **Image URLs in responses** — Returns hotel HD photos, Supabase destination images, and Mapbox Static Images API map URLs (landmark + hotel pins).
- ✅ **Rate expiry transparency** — Agent calculates and communicates minutes remaining on rate validity.

### Phase 2: Secure Booking Handoff ✅ Built (`openclaw-agent` branch)
- ✅ **`booking_sessions` Supabase table** — Migration SQL in `supabase/migrations/20260301_booking_sessions.sql`. UUID token, JSONB hotel/destination data, expiry indexes, RLS.
- ✅ **Token generation** — `createBookingSession()` in `lib/openclaw/sessions.ts`. Returns UUID + expiry timestamp.
- ✅ **Token security** — 30-minute expiry, single-use (`used` boolean), cryptographic UUIDs via `randomUUID()`.
- ✅ **Standalone checkout page** — `/book/[token]` hydrates from Supabase via `/api/openclaw/session`. Trust header, hotel hero, trip summary, room details, pricing, cancellation, reviews, amenities, sticky CTA.
- [ ] **Rate re-verification** — On checkout load, re-fetch rate from LiteAPI. If price changed, show "Price updated since your search". (Not yet implemented — needs real rates first)
- [ ] **Payment** — Same NUITEE_PAY flow as regular checkout. Currently shows placeholder modal. (Blocked on NUITEE_PAY integration)

### Phase 3: Safety & Abuse Protection (Partially Built)
- ✅ **Rate limiting** — Per-IP sliding window (10 req/min), daily global cap (1,000), hotel search per-session cap (5). In `lib/openclaw/rateLimiter.ts`.
- ✅ **Kill switch** — `activateKillSwitch()` / `deactivateKillSwitch()` blocks all requests instantly.
- [ ] **Cost monitoring** — Track Claude token spend + LiteAPI calls per day. Alert thresholds.
- [ ] **Hallucination testing** — Systematic testing of agent responses against actual hotel data. Verify cancellation policies, amenities, prices match source data exactly.
- [ ] **Adversarial testing** — Prompt injection attempts, out-of-scope requests, attempts to extract system prompt or internal data.

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

### What's Left Before Going Live
- [ ] **Run Supabase migration** — Execute `supabase/migrations/20260301_booking_sessions.sql` to create `booking_sessions` table
- Requires **real rates** (flip `USE_MOCK_RATES`) — in progress
- Requires **NUITEE_PAY payment integration** — not started
- Requires **"Honest Take" AI summaries** — planned (critical for agent channel where text does the work of photos)
- [ ] **OpenClaw platform registration** — research needed
- [ ] **Phase 3 safety testing** — hallucination + adversarial testing before public launch

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

## Strategic: Travel Taste Graph

> **Premise:** Every photo analyzed, every destination selected, every destination *rejected* is taste data. Build the world's first structured understanding of what travelers actually want — before they can articulate it themselves. This is the Spotify-for-travel play.

### Phase 1: Signal Capture (Start Now — Zero Cost)
- [ ] **Log every interaction to Supabase** — photo analyzed, destinations shown, destination selected, destination rejected, tile role (best match/closer/budget), time spent on detail modal, hotel selected (when whitelabel tracking exists)
- [ ] **Schema design** — `taste_signals` table: anonymous session ID, signal type, destination ID, timestamp, metadata (photo features, source URL platform, confidence score)
- [ ] **No PII required** — Anonymous session-level signals. Privacy-safe by design.

### Phase 2: Pattern Recognition (After 10k+ sessions)
- [ ] Cluster users by taste patterns (adventure seekers, luxury seekers, culture lovers, beach lovers, budget explorers)
- [ ] Build "destinations like this" recommendations from selection/rejection data
- [ ] "People who chose Lisbon over Barcelona also loved..." collaborative filtering

### Phase 3: Proactive Recommendations (The Product)
- [ ] "Based on photos you've explored, you'd love..." feed on discover page
- [ ] Personalized Trending Now (not just popular — popular *for you*)
- [ ] Taste profile as a shareable artifact ("Your travel personality: Urban Explorer")

### Why This Matters for Value
- Defensible data moat — nobody else has photo→preference signal at scale
- Powers better conversion (show the right destination first)
- B2B potential: sell taste intelligence to OTAs, airlines, tourism boards
- Acquisition signal: any travel company would pay for this dataset

## Strategic: Creator-Powered Travel Distribution Network

> **Premise:** Turn every travel influencer, content creator, and travel blogger into a distribution channel for HonestNomad. Creators share beautiful travel content — we give them personalized referral links and QR codes that drop users straight into a pre-filled booking flow for the exact destination. Creator earns commission on every booking. This is the affiliate model reimagined for the short-form video era.

### Why This Is Huge
- **Travel influencers already drive bookings** — they just don't capture revenue from it. A TikToker posts "Top 5 Santorini spots" and followers manually Google hotels. Zero attribution, zero commission.
- **HonestNomad closes the loop** — Creator posts video → viewer scans QR / clicks link → lands on HonestNomad with destination pre-filled → books hotel via whitelabel → creator gets paid.
- **Network effects** — Every creator who joins brings their audience. The more creators, the more bookings, the more commission proof, the more creators join.
- **Content is free marketing** — Creators make the content anyway. We just give them a monetization layer and they organically promote us.
- **Works for our own TikTok too** — HonestNomad's own channel uses the same system. Every video we post has a QR code or link in bio driving direct bookings.

### How It Works

```
Creator posts video → includes link/QR
                          ↓
User scans QR or clicks link
                          ↓
honestnomad.com/go/santorini?ref=katietravel
                          ↓
/go/[destination] page loads:
  - Destination hero image + quick pitch
  - "Find Hotels" CTA (auto-fills destination)
  - OR direct redirect to whitelabel with placeId
                          ↓
User books hotel on whitelabel
  - clientReference: "hn-santorini-ref:katietravel-1709..."
                          ↓
Booking webhook fires → Supabase logs:
  - booking_id, destination, hotel, revenue, commission
  - ref=katietravel → credit to creator
                          ↓
Creator sees booking + commission on dashboard
```

### Phase 1: Core Referral Infrastructure (~1 week)
- [ ] **`/go/[destination]` page** — Lightweight landing page (~50 lines). Accepts destination slug, optional `?ref=` param. Shows destination hero image, city name, country, quick pitch from `cityPitches.ts`, and "Find Hotels →" CTA. Stores `ref` in sessionStorage so it persists through the booking flow.
- [ ] **Referral-aware `selectDestination()`** — When building whitelabel URL, append creator ref to `clientReference` param (e.g., `hn-santorini-ref:katietravel-1709...`). LiteAPI passes this through to booking data, enabling attribution.
- [ ] **`/go/[destination]` direct links** — Support both slug formats: `/go/santorini` (matches by city name) and `/go/dest-123` (matches by destination ID). Redirect unknown slugs to discover page with search pre-filled.
- [ ] **Supabase `referral_clicks` table** — Log every referral click: destination, ref code, timestamp, IP (hashed), user agent. Analytics foundation.
- [ ] **Supabase `creators` table** — creator_id, display_name, ref_code (unique), email, commission_rate (default 5%), status (active/pending/suspended), created_at.
- [ ] **QR code generation** — Simple QR encoding of the `/go/[destination]?ref=` URL. Can use `qrcode` npm package (~5KB) or a free API. QR image downloadable from creator dashboard.

### Phase 2: Creator Dashboard (~1 week)
- [ ] **Creator signup flow** — Simple form: name, email, social handle, preferred ref code. Creates entry in `creators` table. Manual approval initially (flip status to active).
- [ ] **Creator dashboard page** — `/creator/[ref]` or `/dashboard` (auth'd). Shows:
  - Total clicks, total bookings, conversion rate
  - Commission earned (pending + paid)
  - Per-destination breakdown (which destinations drive bookings)
  - Referral link generator (pick destination → get link + QR)
  - QR code download (PNG/SVG) for each destination
- [ ] **Supabase `referral_bookings` table** — booking_id, creator_ref, destination_id, hotel_name, booking_value, commission_amount, commission_rate, status (pending/confirmed/paid), booked_at, checked_in_at.
- [ ] **Webhook handler** — LiteAPI booking webhook → parse `clientReference` → extract `ref:` → credit creator in `referral_bookings`.
- [ ] **Link-in-bio page** — `/c/[username]` — Creator's branded page showing their top destination picks as visual cards. Each card links to `/go/[destination]?ref=`. Creators share this single link in their bio.

### Phase 3: Growth & Monetization (~2-4 weeks)
- [ ] **Commission tiers** — Base 5%, Silver (10+ bookings/month) 7%, Gold (50+) 10%. Auto-upgrade based on performance.
- [ ] **Payout integration** — Monthly payouts via Stripe Connect or PayPal. Min payout threshold ($50). Track in `creator_payouts` table.
- [ ] **Creator analytics email** — Weekly digest: "You drove 47 clicks and 3 bookings this week. $156 earned."
- [ ] **Embeddable widget** — `<script>` tag creators can add to their blog/site. Shows a mini booking widget for their top destinations with their ref baked in.
- [ ] **Bulk QR generation** — Creator uploads list of destinations → gets ZIP of QR codes for all. Perfect for "Top 10 Europe" type content.
- [ ] **UTM + deep attribution** — Track which specific video/post drove each click. `?ref=katietravel&utm_content=santorini-tiktok-march` → know exactly which content converts.
- [ ] **Creator leaderboard** — Public or private ranking of top creators by bookings. Social proof + competition.
- [ ] **Co-branded booking page** — Whitelabel URL includes creator context: "Katie's Pick: Santorini 🌅" header on booking page. Makes the creator feel ownership.

### QR Code Details
- QR encodes: `honestnomad.com/go/santorini?ref=katietravel`
- Standard QR — any phone camera reads it natively (no app needed)
- Use cases: TikTok video overlay, Instagram story sticker, YouTube description, blog post, physical print (travel guides, airport displays, hotel lobby cards)
- Can be branded with HonestNomad logo in center (most QR readers handle 30% error correction)
- Dynamic QR option: encode `honestnomad.com/qr/ABC123` → server redirect allows changing destination later without reprinting

### Unit Economics
- Average hotel booking: ~$150/night × 3 nights = $450
- LiteAPI commission to us: ~15-20% = $67-90 per booking
- Creator commission (5-10%): $22-45 per booking
- Our net per creator-driven booking: $45-68
- Break-even: If a creator drives even 1 booking/month, the system pays for itself
- At scale: 100 creators × 5 bookings/month × $50 net = $25,000/month

### For Our Own TikTok Strategy
- Every HonestNomad TikTok/Reel includes QR overlay or link in bio
- Use our own ref code (`ref=honestnomad`) for attribution
- A/B test QR placement (corner vs. end screen vs. pinned comment)
- Track which video styles convert best (drone footage, walking tours, food tours, hotel tours)
- Repurpose top-performing creator content with permission (rev share)

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
| Pexels backfill restart | 705 destinations remaining, ~82k images | ~83hrs runtime |
| QC pass (after backfill) | Hash dedup + AI relevance + diversity | Free (Claude Code Read tool) |
| Malmö filename bug | Unicode ö in Supabase upload paths | Quick fix |
| 13 destinations missing POIs | Alternative to Google Places | Research needed |
| POI images reference Google | Migrate to Supabase Storage | Script work |
| Local build OOM | `destinations.ts` 7000+ lines | Use `npx tsc --noEmit` locally. Vercel builds fine. |
