# HonestNomad - Product Requirements Document

## Executive Summary

HonestNomad is an AI-powered travel booking platform with two modes:

1. **Chat-First Mode** - Natural language hotel booking with Claude AI
2. **Flash Vacation Mode** - Tinder-style trip swiping with instant package generation

**Working Title:** HonestNomad

---

## Product Vision

A travel platform that offers two complementary experiences:
- **Chat mode** for users who want to describe their needs conversationally
- **Flash mode** for users who want to quickly swipe through curated trip packages

**Core Value Proposition:** "Tell us where you want to go. We'll handle the rest."

---

## Target Users

- **Primary:** Solo travelers, couples, and small groups planning leisure trips
- **Geography:** North America and Europe (based on Duffel inventory density)
- **Behavior:** Users who prefer quick decisions (Flash) OR conversational discovery (Chat)

---

## Technology Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js 14 (App Router) | React, TypeScript, SSR |
| Styling | Tailwind CSS | Utility-first, rapid development |
| Database | Supabase (PostgreSQL) | Auth, realtime, RLS |
| AI | Claude 3.5 Sonnet | Conversation & intent parsing |
| Flights | Duffel Flights API | Search, rates, booking |
| Hotels | Duffel Stays API | **Not yet enabled** - using mock data |
| Payments | Duffel Pay | PCI compliance handled |
| Geocoding | Mapbox Geocoding API | Robust city/address lookup |
| Maps | Leaflet + OpenStreetMap | Free, no API key for tiles |
| Hosting | Vercel | Edge functions, zero-config |

---

## Feature Status

### Complete (MVP)
- [x] Chat interface with Claude AI
- [x] Hotel search & display (mock data mode)
- [x] Booking flow with payment form
- [x] Itinerary generation
- [x] User authentication (email + OAuth)
- [x] User profiles and preferences
- [x] Settings page

### Complete (Flash Vacation)
- [x] Profile wizard (8 steps)
- [x] Destination database (50+ cities)
- [x] Trip generation with flight search
- [x] Swipe interface (gestures + keyboard)
- [x] Trip detail modal
- [x] Confirmation page

### In Progress
- [ ] End-to-end testing of Flash flow
- [ ] Connect Flash to actual booking/payment

### Planned
- [ ] Streamline wizard to 4 steps
- [ ] Revealed preference learning from swipes
- [ ] Hotel integration (pending Duffel Stays API access)

---

## Flash Vacation Feature

### User Flow

```
1. User navigates to /flash
2. IF profile incomplete → Redirect to wizard
3. User completes 8-step wizard (one-time):
   - Travelers (solo/couple/family/group)
   - Home base (departure airport)
   - Budget (min/max per trip)
   - Accommodation preferences
   - Travel style (adventure vs relaxation, etc.)
   - Interests (museums, food, nightlife, etc.)
   - Restrictions (dietary, accessibility)
   - Surprise tolerance (1-5)
4. User returns to /flash
5. User selects dates + optional vibe/region filters
6. Clicks "Generate Flash Trips"
7. System generates 5-10 diverse trip packages
8. User swipes through cards:
   - Swipe right = Like (goes to confirm)
   - Swipe left = Pass (next card)
   - Tap card = View full details
9. On "like", user lands on /flash/confirm
10. Reviews trip summary
11. Proceeds to booking
```

### Trip Generation Algorithm

1. **Select destinations** based on:
   - Budget constraints
   - Seasonal appropriateness
   - Profile match score
   - Surprise tolerance (low = similar, high = diverse)

2. **Search flights in parallel** via Duffel API

3. **Build complete trip packages** for valid results

4. **Sort by match score**

**Current Mode:** Flights-only (hotels disabled)

### Destination Database

- 50+ curated destinations
- Rich metadata per destination:
  - City, country, airport codes
  - Vibes (beach, adventure, culture, romance, etc.)
  - Best months
  - Average cost estimates
  - Highlights and activities
  - Image URLs

---

## Original Chat Features

### 1. Conversational Chat Interface
- Natural language input for travel requests
- Real-time typing indicators
- Message history within session

### 2. AI Intent Parsing
- Extract: destination, dates, guests, rooms, budget, preferences
- Handle relative dates ("next weekend")
- Accumulate preferences across turns
- Clarify missing required fields

### 3. Hotel Search & Results
- Query Duffel Stays API (mock mode currently)
- Filter by budget, location, amenities
- Display results as interactive cards

### 4. Booking Flow
- Guest details form
- Payment via Duffel Pay
- Confirmation with booking reference

### 5. Itinerary Generator
- AI-generated day-by-day plans
- Restaurant/activity recommendations
- Export to text / print

---

## Database Schema

### Tables

1. **users** (Supabase Auth)
2. **profiles** - Extended user data including:
   - Basic info (name, email, phone)
   - General preferences (currency, traveler type, budget)
   - **Flash preferences** (stored in `preferences` JSONB column):
     - travelers
     - homeBase
     - budget
     - accommodation
     - travelStyle
     - interests
     - restrictions
     - surpriseTolerance
     - profileCompleted
3. **conversations** - Chat sessions
4. **messages** - Individual messages
5. **bookings** - Completed bookings
6. **itineraries** - Generated trip plans
7. **search_logs** - Analytics

---

## API Endpoints

### Original Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main conversation handler |
| `/api/search` | POST | Direct hotel search |
| `/api/book` | POST | Create booking |
| `/api/booking/[id]` | GET | Get booking details |
| `/api/itinerary` | POST | Generate itinerary |
| `/api/user/preferences` | GET/PUT | User preferences |
| `/api/user/bookings` | GET | Booking history |
| `/api/geocode` | GET | Geocode address |
| `/api/webhooks/duffel` | POST | Duffel webhooks |

### Flash Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/flash/preferences` | GET | Get flash profile + completion status |
| `/api/flash/preferences` | PUT | Update flash profile |
| `/api/flash/generate` | POST | Generate trip batch |

---

## Pages

### Original Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing + Chat interface |
| `/auth/login` | Login page |
| `/auth/signup` | Signup page |
| `/booking/[id]` | Booking details |
| `/bookings` | Booking history |
| `/settings` | User preferences + Flash profile |

### Flash Pages
| Route | Purpose |
|-------|---------|
| `/flash` | Main flash plan page (date picker + generate) |
| `/flash/wizard` | 8-step profile wizard |
| `/flash/swipe` | Swipe interface |
| `/flash/confirm` | Selected trip confirmation |

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Duffel
DUFFEL_ACCESS_TOKEN=
DUFFEL_WEBHOOK_SECRET=

# Mapbox (Geocoding)
MAPBOX_ACCESS_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Known Limitations

1. **Hotel search disabled** - Duffel Stays API requires separate access
2. **Flights-only mode** - Trip packages only include flights
3. **Booking incomplete** - Flash "Proceed to Payment" is placeholder

---

## Success Metrics

1. **Flash Completion Rate:** Profile started → Trips generated
2. **Swipe Engagement:** Swipes per session
3. **Conversion Rate:** Trips viewed → Bookings completed
4. **Return Users:** Users who book again

---

## Future Enhancements

### Near-term
- Streamline wizard from 8 to 4 steps
- Revealed preference learning from swipe behavior
- Enable hotel search when API access granted

### Medium-term
- Price alerts/drop notifications
- Flight + hotel bundling
- Multi-room complex bookings

### Long-term
- Mobile native app
- Loyalty program integrations
- White-label/B2B API

---

*Document Version: 2.0*
*Last Updated: January 2025*
