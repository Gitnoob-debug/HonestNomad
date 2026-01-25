# HonestNomad - Project Status & Session Log

> Last Updated: January 25, 2025 (Session 7 - Pre-Restart Checkpoint)

---

## Quick Status

| Area | Status | Notes |
|------|--------|-------|
| Original MVP | **Complete** | Chat-first booking flow works |
| Flash Step 1 (Swipe) | **Complete** | City selection with continuous lazy loading |
| Flash Step 2 (Explore) | **Complete** | POI browsing with Mapbox, 4-step booking flow |
| Flash Step 3 (Booking) | **In Progress** | Confirm page exists, payment placeholder |
| POI Database | **Complete** | 410 destinations, 66,685 POIs (cleaned) |
| Destination Images | **In Progress** | Pexels + Unsplash migrations running |
| Tourism Coverage | **93%** | 423 destinations, covers 93% of top 100 cities |
| Revealed Preferences | **Complete** | AI learning from swipe behavior |
| Loyalty Programs | **Complete** | Airline miles auto-accrual, hotel check-in reminders |
| Wizard Streamlined | **Complete** | Reduced from 8 to 4 steps |
| Draft Trips | **Complete** | Saved to Supabase, shown in My Bookings |
| Database | **Set Up** | Supabase configured |
| API Keys | **Configured** | All providers connected |
| Deployment | **Live** | Vercel deployment active |

---

## Current State: Flash Vacation Feature

### What's Built
The Flash Vacation feature is fully built and deployed in **flights-only mode**:

#### Step 1: City Selection (`/flash/swipe`)
- **Swipe UI** - Tinder-style card interface
- **Continuous lazy loading** - 8 cards initially, loads batches of 8 up to 80 total
- **Gestures** - Swipe right to like, left to pass
- **Back navigation** - Return to previous cards
- **Session persistence** - Trips saved to sessionStorage with batch count
- **Revealed preferences** - Learns from swipe behavior to improve recommendations

#### Step 2: Explore/Itinerary (`/flash/explore`)
- **4-step booking flow**:
  1. **Itinerary** - Choose from 7 styles (classic, foodie, adventure, etc.)
  2. **Flights** - Review/opt-out of flights
  3. **Hotels** - Review/opt-out of hotels
  4. **Checkout** - Order summary with pricing
- **Mapbox map** - Full-screen with POI markers
- **POI database** - 68,561 POIs across 410 destinations
- **Categories** - Restaurants, cafes, attractions, museums, nightlife
- **Favorites** - Tap heart to save POIs (uses Google Place ID)
- **Image proxy** - DISABLED to stop Google Places API costs
- **Draft persistence** - Auto-save to Supabase (appears in My Bookings)

#### Step 3: Booking (`/flash/confirm`)
- **Trip summary** - Flight details + favorites
- **Hotel section** - Shows "not included" (flights-only mode)
- **Proceed button** - Placeholder for Duffel payment

#### Profile & Preferences
- **4-step wizard** (`/flash/wizard`) - Streamlined from original 8 steps:
  1. Airports (home airports)
  2. Interests (travel style)
  3. Budget (spending preferences)
  4. Flash Input (trip dates via single textarea)
- **Settings integration** - Account, Loyalty Programs sections
- **Database** - Supabase with snake_case transformation

#### Loyalty Program Integration
- **Airline Programs** - 12 programs mapped (AA, UA, DL, BA, AF, LH, EK, QR, SQ, etc.)
- **Alliance Partnerships** - oneworld, Star Alliance, SkyTeam cross-earning
- **Auto-attachment** - Loyalty numbers automatically sent to Duffel on booking
- **Hotel Programs** - 9 hotel chains mapped for check-in reminders
- **Check-in Reminder** - User reminded to show hotel loyalty card at check-in

### What's Working
- Profile wizard (4 steps) saves to Supabase correctly
- Trip generation API calls Duffel for real flight data
- Continuous swipe UI with lazy loading (up to 80 cards)
- Revealed preference learning from swipe behavior
- Explore page with Mapbox + POIs
- Favorites persist using Google Place ID
- Draft trips auto-save to Supabase (visible in My Bookings)
- Loyalty programs stored in user settings
- Airline loyalty auto-attached to flight bookings

### What's Disabled
- **Hotel search** - Duffel Stays API not enabled on account
- **Image proxy** - Disabled to prevent Google Places API costs
- Hotels show as "not included" in all trip cards
- Pricing only includes flight costs

### What's Next
1. **Connect booking flow to Duffel payment API** - Actual flight booking
2. **Hotel loyalty reminder UI** - Show reminder in booking confirmation
3. **Booking confirmation page** - After payment completion
4. **Re-enable hotels** - When Duffel Stays API access is granted
5. **Destination images** - Upload Unsplash images to Supabase Storage

---

## Session Log

### Session 7 - January 25, 2025 (Tourism Coverage, Image Migrations, Hotel API Research, LiteAPI Sandbox)

**What We Did:**

#### 1. Tourism Coverage Analysis
- Compared HonestNomad's destinations against Euromonitor Top 100 City Destinations 2024
- Found we covered 85/100 (85%) of top tourist cities
- Identified missing heavy-hitters: Istanbul (#8), Antalya (#4), Macau (#12), etc.

#### 2. Added 13 Heavy-Hitter Destinations
- Istanbul, Antalya, Tbilisi, Fukuoka, Sapporo, Pattaya, Johor Bahru
- Guangzhou, Shenzhen, Macau, Zhuhai, Medina, Sharjah
- Total destinations: 410 → **423**
- Tourism coverage: 85% → **~93%** of top 100 cities

#### 3. Pexels Image Migration System (NEW)
- Created `scripts/image-migration/pexels-config.ts` - Configuration for Pexels API
- Created `scripts/image-migration/pexels-migrate.ts` - Smart query builder with:
  - 30 query categories for variety (landmarks, food, streets, nightlife, etc.)
  - Adaptive sizing for small vs large destinations
  - Per-category image limits to ensure variety
  - Pagination and shuffling to avoid repetitive results
- **CURRENT STATUS:** 10/423 destinations complete (~2.4%)
- **Images downloaded:** ~500-585 (Istanbul, Antalya, Tbilisi, Macau, Guangzhou, Shenzhen, Fukuoka, Sapporo, Pattaya, Johor Bahru)
- Rate: 200 requests/hour, 60 images/destination, 20-min cooldown between batches

#### 4. Unsplash Migration Bug Fix
- Fixed queue format bug - script was treating `{destId, isPopular}` objects as strings
- Restarted migration in continuous mode
- **Running in parallel with Pexels**

#### 5. POI Migration Status
- Attempted to run POI migration for 13 new cities
- **BLOCKED:** Google Places API key has budget cap (user previously spent $900)
- 410 cities have POI data, 13 new cities pending

#### 6. Hotel/Stays API Deep Dive

**Travelpayouts (Hotellook) Analysis:**
- Two-tier API: Data API (cached) vs Search API (real-time)
- Data API gives cached pricing - causes trust issues when redirect shows different price
- Search API requires approval with strict thresholds: 9% search-to-click, 5% click-to-book
- Chicken-and-egg problem: can't hit thresholds without real-time data
- Commission: 40-70% of their cut (effective ~2-4% of booking value)

**LiteAPI (Nuitee) Discovery - BETTER OPTION:**
- Real-time pricing (no caching issue)
- No approval required - instant sandbox, credit card for production
- 2.6M+ hotels, 300+ suppliers
- You control your margin (set 0-whatever%)
- 27,000 requests/minute rate limit (vs Travelpayouts' 200/hour)
- Only charges for excess above 5000:1 search-to-book ratio
- $48M Series A from Accel - well-funded
- Weekly payouts, no booking fees

#### 7. LiteAPI Sandbox Testing (COMPLETED)
- **Sandbox key saved to `.env.local`:** `LITEAPI_SANDBOX_KEY=sand_44382eb7-42e7-47e3-8dbe-da7ea7b15546`
- **Test scripts created:**
  - `scripts/liteapi-test.ts` - Basic hotel search, details, rates testing
  - `scripts/liteapi-coords-test.ts` - Coordinate-based search (matches our destination data)
  - `scripts/liteapi-full-dump.ts` - Complete JSON response documentation
- **All endpoints verified working:**
  - `/data/hotels` - Search by city or coordinates (7,848 hotels in Lisbon)
  - `/data/hotel` - Full details (105 photos, 85+ amenities, room details)
  - `/hotels/rates` - Real-time pricing ($826-920 for 3 nights at 5-star)
  - `/data/reviews` - Guest reviews with pros/cons (406 reviews for Sheraton)

**LiteAPI Data Summary:**
| Endpoint | Key Data Returned |
|----------|-------------------|
| Hotel List | id, name, stars, rating, reviewCount, lat/lng, chain, thumbnail |
| Hotel Details | 100+ photos, checkin/checkout times, 85+ facilities, full room details |
| Rates | Real-time pricing, tax breakdown, commission, refund policy, payment types |
| Reviews | averageScore (0-10), pros, cons, traveler type, date |

**Key LiteAPI Findings:**
- Transparent pricing: You see wholesale cost ($826), suggested retail ($896), your commission ($46.75)
- MoR option: `paymentTypes: ["NUITEE_PAY"]` = LiteAPI handles payments/chargebacks
- Tax transparency: `included: true/false` flag shows what's in price vs pay-at-hotel
- Coordinate search works perfectly with our destination lat/lng data

**Outstanding Question for LiteAPI:**
- Resort fees / pay-at-property charges not visible in API - need to confirm with LiteAPI before launch

**Recommendation:** LiteAPI as primary hotel API, Travelpayouts as backup

**Files Created:**
- `scripts/image-migration/pexels-config.ts`
- `scripts/image-migration/pexels-migrate.ts`
- `scripts/image-migration/pexels-progress.json`
- `scripts/image-migration/pexels-manifest.json`
- `scripts/image-migration/pexels-images/istanbul/` (60 images)
- `scripts/image-migration/pexels-images/antalya/` (60 images)
- `scripts/liteapi-test.ts` - Basic sandbox test
- `scripts/liteapi-coords-test.ts` - Coordinate search test
- `scripts/liteapi-full-dump.ts` - Full JSON dump

**Files Modified:**
- `lib/flash/destinations.ts` - Added 13 new destinations
- `scripts/image-migration/migrate-images.ts` - Fixed queue object handling
- `scripts/image-migration/progress.json` - Added new destinations to queue
- `.env.local` - Added PEXELS_API_KEY, LITEAPI_SANDBOX_KEY

**Git Commits:**
- `f58b204` - Add 13 heavy-hitter destinations (Istanbul, Antalya, Macau, etc.)

**Background Tasks (WILL STOP ON RESTART):**
- Pexels migration: task `be68361` and `b5916a3` - 10/423 complete (~2.4%)
- Both running in 20-minute cooldown cycles

---

### Session 6 - January 24, 2025 (Loyalty Programs, Preferences, Polish)

**What We Did:**

#### 1. Wizard Streamlined (8 → 4 Steps)
- Reduced wizard from 8 steps to 4 essential steps
- Steps: Airports → Interests → Budget → Flash Input
- New Flash Input combines dates into single freeform textarea
- Removed redundant steps (activities, pace, accommodation, etc.)

#### 2. Revealed Preference Learning System
- Created `lib/flash/preferences/` module with:
  - `preferenceEngine.ts` - Scoring algorithm for destinations
  - `swipeTracker.ts` - Records and analyzes swipe behavior
  - `types.ts` - TypeScript interfaces
- `POST /api/flash/swipe` - Tracks each swipe (like/dislike)
- `GET /api/flash/preferences/revealed` - Returns learned preferences
- Integrated into trip generation for personalized recommendations

#### 3. Draft Trips Persistence
- Drafts now save to Supabase (not just localStorage)
- Added `draft_trips` table with RLS policies
- Draft trips appear in "My Bookings" section
- Can resume drafts from any device

#### 4. Loyalty Program Integration
- **Settings Page Redesigned:**
  - Removed redundant "Travel Preferences" section
  - Added "Account" section (name, email, phone)
  - Added "Loyalty Programs" section with add/remove UI
- **Airline Loyalty (`lib/loyalty/airlines.ts`):**
  - 12 airline programs mapped to IATA codes
  - Alliance partnership detection (oneworld, Star Alliance, SkyTeam)
  - `findMatchingLoyaltyProgram()` for best match selection
- **Hotel Loyalty (`lib/loyalty/hotels.ts`):**
  - 9 hotel chains with keyword matching
  - `findMatchingHotelLoyalty()` for check-in reminders
- **Flight Booking Integration:**
  - Added `loyaltyProgramAccounts` to `FlightBookingPassenger` type
  - Duffel API receives loyalty numbers for automatic mile accrual

#### 5. Continuous Lazy Loading Fix
- Changed `hasLoadedMore: boolean` to `loadedBatches: number`
- Now loads up to 10 batches (80 trips total)
- Triggers when 4 or fewer trips remaining
- Session storage persists batch count

#### 6. Image Proxy Disabled
- Disabled `/api/places/photo` to stop Google Places API costs
- POI images now show emoji-only markers
- Map marker onerror crash fixed

**Files Created:**
- `lib/flash/preferences/preferenceEngine.ts`
- `lib/flash/preferences/swipeTracker.ts`
- `lib/flash/preferences/types.ts`
- `lib/flash/preferences/index.ts`
- `lib/loyalty/airlines.ts`
- `lib/loyalty/hotels.ts`
- `lib/loyalty/index.ts`
- `app/api/flash/swipe/route.ts`
- `app/api/flash/preferences/revealed/route.ts`

**Files Modified:**
- `app/settings/page.tsx` - Redesigned with Account + Loyalty Programs
- `app/flash/wizard/page.tsx` - 4-step wizard
- `components/flash/ProfileWizard/` - Updated step components
- `hooks/useFlashVacation.ts` - Continuous lazy loading
- `types/flight.ts` - Added `LoyaltyProgramAccount`, `loyaltyProgramAccounts`
- `lib/duffel/flights.ts` - Pass loyalty accounts to Duffel API
- `app/api/flash/generate/route.ts` - Integrate revealed preferences

**Git Commits:**
- `55a16e0` - Redesign settings page with Account and Loyalty Programs sections
- `cbbea69` - Add airline loyalty program integration for automatic mile accrual
- `66fa514` - Add hotel loyalty program matching for check-in reminders
- `e9584cc` - Fix continuous lazy loading for Flash vacation swipe

---

### Session 5 - January 2025 (Step 1 & 2 Polish)

**What We Did:**
- **POI Data Migration** - Migrated 68,561 POIs across 410 destinations from Google Places API
- **Explore Page** (`/flash/explore`) - Full-screen Mapbox map with POI markers
- **Google Places Image Proxy** - Created `/api/places/photo` to hide API keys from client
- **Favorites System** - Uses Google Place ID (stable) instead of position-based IDs
- **Draft Persistence** - Created `lib/flash/draft-storage.ts` for localStorage auto-save
- **Lazy Loading Swipe Cards** - Load 8 initially, +8 more when user reaches card 4
- **Skip Button** - Users can bypass POI customization and go straight to booking
- **Back Button Fix** - z-index layering (z-50) to appear above global navbar (z-40)
- **Error Handling UI** - Dismissible warnings and empty states for POI loading
- **Mobile Responsiveness** - Tested and fixed various mobile issues

**Files Created:**
- `app/flash/explore/page.tsx` - Explore/itinerary page
- `lib/flash/draft-storage.ts` - localStorage persistence for drafts
- `app/api/places/photo/route.ts` - Google Places image proxy
- `app/api/pois/[city]/route.ts` - POI data endpoint
- `data/pois/*.json` - 410 JSON files with POI data

**Files Modified:**
- `hooks/useFlashVacation.ts` - Added lazy loading logic (loadMoreTrips, hasLoadedMore)
- `types/flash.ts` - Added excludeDestinations to FlashGenerateParams
- `lib/flash/tripGenerator.ts` - Filter excluded destinations for lazy loading
- `app/api/flash/generate/route.ts` - Pass excludeDestinations parameter
- `components/flash/ImmersiveSwipeContainer.tsx` - Swipe UI updates
- Various component updates for favorites, error states, mobile fixes

**User Decisions:**
- Load 8 cards initially, then 8 more at card 4 (seamless background loading)
- Use Google Place ID for favorites (not position-based)
- Skip button for users who don't want to customize
- Show draft trips in "My Bookings" (future task)

---

### Session 4 - January 2025 (Flights-Only Mode)

**What We Did:**
- Fixed snake_case to camelCase transformation in `lib/supabase/profiles.ts`
- Added Flash Vacation Profile section to Settings page
- Debugged why Flash page wasn't showing wizard prompt (data transformation issue)
- Discovered hotel search failing for all destinations (Duffel Stays API not enabled)
- **Switched to flights-only mode per user decision**
- Removed hotel search from trip generator
- Made `hotel` property optional in `FlashTripPackage` type
- Updated all UI components to handle missing hotel gracefully
- Deployed flights-only changes

**Files Modified:**
- `lib/supabase/profiles.ts` - snake_case to camelCase transformation
- `app/settings/page.tsx` - Flash profile section
- `lib/duffel/search.ts` - Mock data fallback (then disabled entirely)
- `types/flash.ts` - Made hotel optional
- `lib/flash/tripGenerator.ts` - Removed hotel search
- `components/flash/SwipeCard.tsx` - Flights-only display
- `components/flash/TripDetailModal.tsx` - Flights-only display
- `app/flash/confirm/page.tsx` - Flights-only display

**User Decisions:**
- "lets disable hotels for now and nail down the flight experience for the time being"
- Future: streamline wizard from 8 to ~4 steps
- Future: implement revealed preference learning

---

### Session 3 - January 2025 (Flash Vacation Implementation)

**What We Did:**
- Implemented complete Flash Vacation feature:
  - 8-step profile wizard
  - Destination database (50+ cities)
  - Diversity engine for varied trip suggestions
  - Trip generator with Duffel flight API
  - Swipe interface with gestures
  - Detail modal and confirm page
- Created all types in `types/flash.ts`
- Created all API routes for preferences and generation
- Created all wizard step components
- Created swipe UI components

**Files Created:**
- `types/flash.ts`
- `app/flash/page.tsx`
- `app/flash/wizard/page.tsx`
- `app/flash/wizard/layout.tsx`
- `app/flash/swipe/page.tsx`
- `app/flash/confirm/page.tsx`
- `app/api/flash/preferences/route.ts`
- `app/api/flash/generate/route.ts`
- `components/flash/ProfileWizard/WizardContainer.tsx`
- `components/flash/ProfileWizard/StepIndicator.tsx`
- All 8 wizard step components
- `components/flash/FlashPlanInput.tsx`
- `components/flash/VibeSelector.tsx`
- `components/flash/SwipeCard.tsx`
- `components/flash/SwipeContainer.tsx`
- `components/flash/TripDetailModal.tsx`
- `hooks/useFlashVacation.ts`
- `hooks/useSwipeGestures.ts`
- `hooks/useProfileWizard.ts`
- `lib/flash/destinations.ts`
- `lib/flash/tripGenerator.ts`
- `lib/flash/diversityEngine.ts`

---

### Session 2 - January 2025 (Fixes & Deployment)

**What We Did:**
- Fixed flight search integration with Duffel API
- Fixed hotel type property names (rating.reviewScore, pricing, photos)
- Fixed Set iteration error in diversityEngine
- Fixed signup database error - added INSERT policy for profiles
- Deployed to Vercel

---

### Session 1 - January 2025 (Initial Build)

**What We Did:**
- Reviewed technical specification document
- Created PRD.md with full product requirements
- Built entire base application from scratch
- Authentication, chat, hotel search, booking, itinerary

---

## Files Structure - Flash Vacation

```
app/
├── flash/
│   ├── page.tsx              # Main flash plan page
│   ├── wizard/
│   │   ├── page.tsx          # 4-step wizard page
│   │   └── layout.tsx        # Wizard layout
│   ├── swipe/
│   │   └── page.tsx          # Swipe interface (Step 1)
│   ├── explore/
│   │   └── page.tsx          # 4-step booking flow (Step 2)
│   └── confirm/
│       └── page.tsx          # Booking confirmation (Step 3)
├── settings/
│   └── page.tsx              # Account + Loyalty Programs
├── api/
│   ├── flash/
│   │   ├── preferences/
│   │   │   ├── route.ts      # GET/PUT preferences
│   │   │   └── revealed/
│   │   │       └── route.ts  # GET revealed preferences
│   │   ├── generate/
│   │   │   └── route.ts      # POST generate trips
│   │   └── swipe/
│   │       └── route.ts      # POST track swipe behavior
│   ├── pois/
│   │   └── [city]/
│   │       └── route.ts      # GET POIs for destination
│   └── places/
│       └── photo/
│           └── route.ts      # DISABLED - was Google Places proxy

components/
└── flash/
    ├── ProfileWizard/
    │   ├── WizardContainer.tsx
    │   ├── StepIndicator.tsx
    │   └── [4 step components]  # Airports, Interests, Budget, FlashInput
    ├── FlashPlanInput.tsx
    ├── VibeSelector.tsx
    ├── ImmersiveSwipeContainer.tsx  # Main swipe UI
    ├── SwipeCard.tsx
    └── TripDetailModal.tsx

hooks/
├── useFlashVacation.ts       # Flash state + continuous lazy loading
├── useSwipeGestures.ts       # Touch/mouse swipe detection
└── useProfileWizard.ts       # Wizard state

lib/
├── flash/
│   ├── destinations.ts       # 410 curated destinations
│   ├── tripGenerator.ts      # Batch trip generation (flights-only)
│   ├── diversityEngine.ts    # Destination selection algorithm
│   ├── draft-storage.ts      # localStorage persistence
│   └── preferences/          # Revealed preference learning
│       ├── index.ts
│       ├── preferenceEngine.ts  # Scoring algorithm
│       ├── swipeTracker.ts      # Swipe behavior tracking
│       └── types.ts
└── loyalty/                  # Loyalty program integration
    ├── index.ts              # Main exports + helper functions
    ├── airlines.ts           # 12 airline programs, alliances
    └── hotels.ts             # 9 hotel chain mappings

data/
└── pois/
    └── *.json                # 410 JSON files, 68,561 POIs

types/
├── flash.ts                  # Flash vacation types
└── flight.ts                 # Flight types + LoyaltyProgramAccount
```

---

## Known Issues

1. **Hotel search disabled** - LiteAPI sandbox tested and ready, need to build integration
2. **Flights-only mode** - All trip cards show "Hotel not included"
3. **Booking flow incomplete** - "Proceed to Payment" shows alert placeholder
4. **Image proxy disabled** - POI images not loading to prevent API costs
5. **Destination images** - Pexels migration 10/423 complete, NEEDS RESTART after reboot
6. **POI data for 13 new cities** - Blocked by Google API budget cap
7. **POI images** - Still served via Google API, need Supabase migration
8. **LiteAPI hidden fees?** - Need to confirm resort fees / pay-at-property charges before launch

## Completed Features (Session 6)

- [x] Streamline wizard from 8 to 4 steps
- [x] Revealed preference learning from swipe behavior
- [x] Draft trips saved to Supabase (visible in My Bookings)
- [x] Loyalty programs in settings (add/remove UI)
- [x] Airline loyalty auto-attachment to flight bookings
- [x] Hotel loyalty matching for check-in reminders
- [x] Continuous lazy loading (up to 80 trips)
- [x] 4-step explore/booking flow (itinerary → flights → hotels → checkout)

---

## Notes for Next Session

**Where we left off (PRE-RESTART CHECKPOINT - Jan 25, 2025):**
- LiteAPI sandbox testing COMPLETE - all endpoints verified working
- Image migrations STOPPED (background tasks killed on restart)
- 423 destinations covering ~93% of global tourism traffic
- POI migration for 13 new cities blocked by Google API budget cap

**Image Migration Status at Restart:**
- **Pexels:** 10/423 destinations (~2.4%), ~500-585 images downloaded
- **Cities completed:** Istanbul, Antalya, Tbilisi, Macau, Guangzhou, Shenzhen, Fukuoka, Sapporo, Pattaya, Johor Bahru
- **Need to restart:** `npx tsx scripts/image-migration/pexels-migrate.ts --continuous`
- Progress is saved in `scripts/image-migration/pexels-progress.json`

**Immediate next steps:**
1. **Restart image migrations** - Run Pexels script again (it picks up where it left off)
2. **Build hotel search integration** - LiteAPI sandbox tested, ready to integrate
3. **POI migration for 13 new cities** - When Google API budget is approved
4. **Migrate POI images to Supabase Storage** - Avoid per-request Google API costs
5. **Connect /flash/confirm to Duffel booking API** - Actual flight payment flow

**Hotel API Decision (FINALIZED):**
- **PRIMARY: LiteAPI (Nuitee)** - Real-time pricing, no approval needed, you control margin
- **Sandbox key in `.env.local`:** `LITEAPI_SANDBOX_KEY=sand_44382eb7-42e7-47e3-8dbe-da7ea7b15546`
- **BACKUP: Travelpayouts** - If inventory gaps, but has cached pricing issues
- **SKIP: Duffel Stays** - Inventory too limited for nomad destinations

**LiteAPI Integration Ready:**
- Test scripts in `scripts/liteapi-*.ts`
- Endpoints documented in SESSION 7 notes above
- Data structure: hotels have 100+ photos, 85+ amenities, real-time rates
- Coordinate search works with our destination data
- MoR option available (NUITEE_PAY) to avoid chargeback liability

**Key Technical Notes:**
- LiteAPI: 27,000 req/min, 2.6M hotels, 300+ suppliers, weekly payouts
- Travelpayouts Data API: Cached prices (bad UX), Search API needs 9%/5% conversion
- Pexels: 200 req/hour, 60 images/destination, adaptive for small/large cities
- Unsplash: 50 req/hour, running in parallel with Pexels

**Questions to resolve:**
- LiteAPI hidden fees? Resort fees, pay-at-property charges - need to confirm
- Payment flow: Stripe for card tokenization → Duffel for booking?
- Booking confirmation: What details to show after successful payment?

**Technical notes:**
- Swipe cards: 8 initial, continuous loading up to 80 (10 batches × 8)
- Revealed preferences: Learned from swipe history, affects trip scoring
- Loyalty programs: Stored in user profile, auto-attached to flight bookings
- POIs use Google Place ID for stable favorites
- Image proxy DISABLED to stop API costs
- Drafts auto-save to Supabase (not just localStorage)

**Loyalty Program Coverage:**
- Airlines: AA, UA, DL, WN, B6, AS, BA, AF, LH, EK, QR, SQ
- Alliances: oneworld, Star Alliance, SkyTeam
- Hotels: Marriott, Hilton, IHG, Hyatt, Wyndham, Choice, Best Western, Accor, Radisson

---

## Contact / Resources

- **Duffel Docs:** https://duffel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Anthropic Docs:** https://docs.anthropic.com
- **Mapbox Docs:** https://docs.mapbox.com
- **Next.js Docs:** https://nextjs.org/docs

---

*Update this file at the start and end of each session to maintain continuity.*
