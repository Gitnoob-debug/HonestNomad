# HonestNomad - Product Requirements Document

## Vision

**One sentence. One complete trip.**

HonestNomad is an AI-powered trip planning platform that transforms a single natural language request into a complete, bookable travel package—flights, hotels, and a personalized day-by-day itinerary.

## Problem Statement

Current travel booking is fragmented and overwhelming:
- Users visit 5-10 different sites to plan one trip
- Endless comparison shopping leads to decision fatigue
- No integration between flights, hotels, and activities
- Generic recommendations that don't feel personalized
- Complex checkout flows across multiple vendors

## Solution

HonestNomad provides **opinionated curation** - we pick FOR the user based on their natural language description, treating the trip as a single unit rather than separate bookings.

### Core Value Propositions

1. **Simplicity**: One input, one complete trip
2. **Curation**: AI picks the best options, not just lists them
3. **Integration**: Flights + hotels + itinerary as a unified experience
4. **Personalization**: Tailored to stated preferences and travel style
5. **Transparency**: Clear pricing, no hidden fees ("Honest" Nomad)

---

## Current State (v0.2 - Flash Mode)

### What Works
- [x] Natural language intent parsing via Claude
- [x] Flight search via Duffel API (real data)
- [x] Hotel search via Duffel API (mock data, pending approval)
- [x] Trip planning orchestration (parallel search)
- [x] **NEW: Flash Mode** - TikTok/Tinder-style swipe experience
- [x] **NEW: 410+ Destinations** - Comprehensive global coverage (95%+ Europe/North America)
- [x] **NEW: Immersive swipe cards** - Full-screen destination cards with gesture support
- [x] **NEW: 5-step booking flow** - Dates → Travelers → Flights → Hotels → Confirmation
- [x] **NEW: 7 itinerary path types** - Classic, foodie, adventure, cultural, relaxation, nightlife, trendy
- [x] **NEW: Hand-curated POIs** - 6 major cities with trendy/local spots (Paris, Rome, Barcelona, Tokyo, London, Amsterdam)
- [x] **NEW: Google Places integration** - Ready for POI migration (pending API key)
- [x] TripCard UI with hero images
- [x] Flight/hotel swap via alternatives modal
- [x] Conversation persistence in Supabase
- [x] Responsive landing page

### In Progress
- [ ] **POI Migration** - Google Places API integration built, awaiting API key to run migration on 410 destinations
- [ ] **Foursquare blocked** - New accounts can't access v3 API (deprecated), switched to Google Places

### What's Broken/Missing
- [ ] Duffel Stays API pending approval (using mocks)
- [ ] No actual booking flow (payment integration)
- [ ] No user accounts or saved trips
- [ ] No email confirmations
- [ ] No real destination images (using Unsplash placeholders)

---

## Roadmap

### Phase 1: Core Booking Flow (MVP)
**Goal**: Users can actually book a complete trip

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| P0 | Duffel Stays Approval | Get Stays API access approved | Blocker |
| P0 | Payment Integration | Stripe/Duffel payment flow | High |
| P0 | Booking Confirmation | Email receipt with all details | Medium |
| P1 | Error Handling | Graceful failures, retries | Medium |
| P1 | Price Refresh | Handle stale prices before booking | Medium |
| P1 | Guest Details Form | Complete traveler info collection | Medium |

### Phase 2: Intelligence Upgrade
**Goal**: Make the AI truly smart and personalized

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| P0 | Dynamic Itineraries | Real AI-generated day plans | High |
| P0 | Origin Detection | Auto-detect user's departure city | Low |
| P1 | Date Flexibility | "Cheapest week in March" | Medium |
| P1 | Multi-City Trips | Paris → Rome → Barcelona | High |
| P1 | Budget Optimization | Find best value within constraints | Medium |
| P2 | Weather Integration | Factor weather into recommendations | Low |
| P2 | Event Awareness | Know about local festivals, concerts | Medium |

### Phase 3: User Experience
**Goal**: Polish and delight

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| P0 | Mobile Responsive | Full mobile experience | Medium |
| P0 | Loading States | Skeleton screens, progress indicators | Low |
| P1 | Trip Sharing | Share trip link with friends/family | Low |
| P1 | Save/Favorites | Save trips for later | Medium |
| P1 | Price Alerts | Notify when trip price drops | Medium |
| P2 | PDF Export | Download itinerary as PDF | Low |
| P2 | Calendar Sync | Add to Google/Apple calendar | Low |

### Phase 4: Trust & Business
**Goal**: Build sustainable business

| Priority | Feature | Description | Complexity |
|----------|---------|-------------|------------|
| P0 | User Accounts | Auth, saved preferences | Medium |
| P0 | Booking Management | View/modify/cancel bookings | High |
| P1 | Reviews Integration | Show TripAdvisor/Google reviews | Medium |
| P1 | Price Comparison | Show we're competitive | Medium |
| P2 | Affiliate Revenue | Track and optimize commissions | Medium |
| P2 | B2B/White-label | Travel agent dashboard | High |

---

## Feature Deep Dives

### 1. Payment Integration (P0)

**Current State**: No payment flow exists

**Requirements**:
- Collect card details securely (Stripe Elements or Duffel's payment widget)
- Support card tokenization for PCI compliance
- Handle 3D Secure / SCA requirements
- Process flight booking first, then hotel
- Atomic booking (rollback if either fails)
- Store booking references in Supabase

**Technical Approach**:
```
1. User clicks "Book Trip"
2. Show payment form (Stripe Elements)
3. Tokenize card → paymentMethodId
4. POST /api/book with tripPlanId + paymentMethodId
5. Server: Book flight via Duffel
6. Server: Book hotel via Duffel
7. Server: Store booking, send confirmation email
8. Client: Show success page with booking refs
```

**Dependencies**:
- Stripe account setup
- Duffel Stays API approval
- Email service (Resend/SendGrid)

---

### 2. Dynamic Itineraries (P0)

**Current State**: Templated activities per city

**Requirements**:
- Generate unique itineraries based on:
  - Trip duration
  - Traveler type (solo, couple, family)
  - Interests (food, culture, adventure, relaxation)
  - Hotel location (plan activities nearby)
  - Flight times (don't plan activities during travel)
- Include specific venues, not generic categories
- Opening hours and reservation requirements
- Walking/transit routing between activities
- Cost estimates for each activity

**Technical Approach**:
```
1. Build rich prompt with all trip context
2. Call Claude to generate structured itinerary JSON
3. Validate/enhance with external APIs:
   - Google Places for venue details
   - OpenTripMap for attractions
   - Yelp for restaurant recommendations
4. Return formatted itinerary with real data
```

**Data Sources Needed**:
- Google Places API
- OpenTripMap (free, open data)
- Yelp Fusion API
- TripAdvisor Content API

---

### 3. Origin Detection (P1)

**Current State**: User must specify origin city

**Requirements**:
- Auto-detect user's likely departure city
- Use IP geolocation as initial guess
- Allow override in preferences
- Find nearest airport(s)
- Handle multi-airport cities (NYC: JFK, LGA, EWR)

**Technical Approach**:
```
1. Client: Get IP-based location (ipapi.co or similar)
2. Server: Map to nearest airport code(s)
3. Show in UI: "Departing from New York (JFK)"
4. Allow user to change if needed
5. Store preference for returning users
```

---

### 4. Mobile Experience (P0)

**Current State**: Desktop-focused, not optimized for mobile

**Requirements**:
- Full functionality on mobile web
- Touch-friendly interactions
- Swipe gestures for browsing alternatives
- Simplified navigation
- Fast load times on 3G

**Key Screens to Optimize**:
1. Landing page - large touch targets
2. Chat interface - full-screen keyboard consideration
3. Trip Card - scrollable, collapsible sections
4. Booking form - mobile-optimized inputs
5. Confirmation - shareable screenshot-friendly

---

## Success Metrics

### North Star Metric
**Bookings per Week** - Complete trips booked through the platform

### Leading Indicators
| Metric | Target (Launch) | Target (6mo) |
|--------|-----------------|--------------|
| Trip Plans Generated | 100/week | 5,000/week |
| Plan → Booking Conversion | 5% | 15% |
| Average Trip Value | $1,500 | $2,000 |
| Return User Rate | 10% | 30% |
| NPS | 40 | 60 |

### Tracking Requirements
- [ ] Set up Mixpanel/Amplitude
- [ ] Event tracking: searches, plans, swaps, bookings
- [ ] Funnel analysis: landing → chat → plan → book
- [ ] Revenue attribution

---

## Technical Architecture

### Current Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude via OpenRouter
- **Travel APIs**: Duffel (Flights + Stays)
- **Hosting**: Vercel

### Recommended Additions
- **Payments**: Stripe
- **Email**: Resend or SendGrid
- **Monitoring**: Sentry
- **Analytics**: Mixpanel
- **Feature Flags**: LaunchDarkly or Vercel Edge Config
- **Image CDN**: Cloudinary or Imgix (for destination photos)

### API Integrations Needed
| API | Purpose | Priority |
|-----|---------|----------|
| Stripe | Payments | P0 |
| Resend | Transactional email | P0 |
| Google Places | Venue details | P1 |
| Unsplash | Destination images | P1 |
| OpenTripMap | Attractions | P2 |
| WeatherAPI | Forecasts | P2 |

---

## Competitive Landscape

### Direct Competitors
| Competitor | Strength | Weakness | Our Angle |
|------------|----------|----------|-----------|
| Google Travel | Brand, data | Fragmented UX | Unified experience |
| Kayak/Expedia | Price comparison | No curation | Opinionated picks |
| Wanderlog | Itinerary planning | No booking | End-to-end |
| Hopper | Price predictions | Flights only | Complete trips |

### Differentiation
1. **Natural language first** - No forms, just conversation
2. **One-click complete trip** - Not just flights OR hotels
3. **Curated, not compared** - We pick, you refine
4. **Honest pricing** - No hidden fees or dark patterns

---

## Go-to-Market Strategy

### Launch Audience
- Tech-savvy millennials (25-40)
- Weekend trip planners
- Couples planning romantic getaways
- People who hate travel planning

### Initial Markets
1. US domestic travel (simpler, one currency)
2. Popular international destinations (Paris, London, Tokyo)
3. Expand to Europe, Asia over time

### Growth Channels
1. **SEO**: "Plan trip to [city]" content pages
2. **Social**: Travel TikTok/Instagram content
3. **Referrals**: Share your trip with friends
4. **Partnerships**: Travel bloggers, influencers

---

## Risk & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Duffel Stays rejected | High | Medium | Fallback to Booking.com API |
| AI hallucinations | Medium | Medium | Validate against real data |
| Payment fraud | High | Low | Stripe Radar, 3DS |
| Booking failures | High | Medium | Graceful rollback, refunds |
| Competitor copies | Medium | High | Move fast, build brand |

---

## Team Requirements

### Current (Solo/Small Team)
- Full-stack developer
- Access to Claude/AI APIs

### To Scale
- 1 Product Designer (UX/UI)
- 1 Backend Engineer (APIs, booking logic)
- 1 Growth/Marketing
- Part-time: Legal (terms, refunds), Finance (bookkeeping)

---

## Next Steps (This Week)

### POI System (In Progress)
1. [ ] Get Google Places API key from https://console.cloud.google.com/apis/credentials
2. [ ] Enable "Places API (New)" in Google Cloud Console
3. [ ] Run test migration: `npx tsx scripts/poi-migration/migrate-pois-google.ts --test`
4. [ ] Run full migration on all 410 destinations
5. [ ] Update itinerary generator to use cached POIs from `data/pois/`

### Core Platform
6. [ ] Apply for Duffel Stays production access
7. [ ] Set up Stripe account and test payment flow
8. [ ] Add proper error handling throughout
9. [ ] Set up Sentry for error monitoring
10. [ ] Create email templates for booking confirmation

---

## Files Created This Session

### POI/Places Integration
- `types/poi.ts` - POI type definitions (Google + Foursquare support)
- `lib/google-places/client.ts` - Google Places API client with path-type search
- `lib/google-places/index.ts` - Exports
- `lib/foursquare/client.ts` - Foursquare client (deprecated, v3 blocked for new accounts)
- `lib/foursquare/index.ts` - Exports
- `scripts/poi-migration/migrate-pois-google.ts` - Migration script for Google Places
- `scripts/poi-migration/migrate-pois.ts` - Legacy Foursquare migration script

### Updated Files
- `.env.local` - Added GOOGLE_PLACES_API_KEY placeholder
- `.env.local.example` - Added Google Places key documentation
- `lib/flash/itinerary-generator.ts` - Added TRENDY_POIS for 6 cities + generateTrendyItinerary()

---

*Last Updated: January 22, 2026*
