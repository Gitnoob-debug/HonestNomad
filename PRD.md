# HonestNomad - Product Requirements Document

## Executive Summary

HonestNomad is an AI-powered travel platform that owns the **full travel lifecycle** - not just booking, but the entire journey from discovery to memories.

1. **Chat-First Mode** - Natural language hotel booking with Claude AI
2. **Flash Vacation Mode** - Tinder-style trip swiping with instant package generation
3. **Live Trip Mode** - In-destination companion with real-time guidance (mobile)

**Working Title:** HonestNomad

---

## Product Vision

### The Full Travel Lifecycle

Unlike Booking.com and Airbnb who focus only on the **booking moment**, HonestNomad owns the complete user journey:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE HONESTNOMAD JOURNEY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   BEFORE              DURING                 AFTER                  │
│   ──────              ──────                 ─────                  │
│   • Swipe to pick     • Live map guidance    • Auto trip diary     │
│   • AI chat planning  • Geofenced alerts     • Photo memories      │
│   • Book flights      • "You're near X!"     • Share your trip     │
│   • Curate POIs       • Offline maps         • Preference learning │
│                       • Real-time updates                          │
│                                                                     │
│   [Web + Mobile]      [Mobile Native]        [Web + Mobile]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Core Value Proposition:** "From swipe to landing to memories - we're with you the whole trip."

### Why This Matters

The giants (Booking, Expedia, Airbnb) abandon users after checkout. HonestNomad stays with them:
- **During the trip:** Live map with their saved POIs, location-aware alerts
- **After the trip:** Auto-generated diary, preference learning for next time

This creates a defensible moat through user data and habit formation.

---

## Target Users

- **Primary:** Solo travelers, couples, and small groups planning leisure trips
- **Geography:** North America and Europe (based on Duffel inventory density)
- **Behavior:** Users who prefer quick decisions (Flash) OR conversational discovery (Chat)
- **Mobile-first:** Travelers who want a companion app during their trip, not just a booking tool

---

## Technology Stack

### Current (Web)

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

### Planned (Mobile Native)

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | Expo (React Native) | Cross-platform iOS + Android |
| Navigation | React Navigation | Native stack/tab navigation |
| Gestures | react-native-gesture-handler | Buttery smooth swipe cards |
| Animations | react-native-reanimated | 60fps native animations |
| Maps | react-native-mapbox-gl | Live location + offline packs |
| Location | expo-location | Foreground, background, geofencing |
| Notifications | expo-notifications | Smart trip alerts |
| Storage | expo-secure-store | Auth tokens |
| Offline | AsyncStorage + Mapbox offline | Works without data |

### Code Sharing Strategy (Monorepo)

```
honestNomad/
├── apps/
│   ├── web/              # Next.js (current)
│   └── mobile/           # Expo (planned)
├── packages/
│   └── core/             # Shared business logic
│       ├── lib/supabase/ # 95% reuse
│       ├── lib/flash/    # 100% reuse
│       ├── lib/duffel/   # 100% reuse
│       ├── types/        # 100% reuse
│       └── data/         # 100% reuse (POIs)
```

**Estimated code reuse: 60-70%** (UI components rewritten, logic shared)

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
- [x] **POI data** - 410 destinations with 68,561 POIs from Google Places
- [x] **Explore/Itinerary page** - Mapbox map with POI markers
- [x] **Lazy loading** - Load 8 cards initially, +8 more at card 4
- [x] **Draft persistence** - Save unfinished trips to localStorage
- [x] **Google Places image proxy** - Hide API keys from client
- [x] **Skip button** - Bypass customization flow
- [x] **Back navigation** - Return from explore to swipe

### In Progress
- [ ] Show draft trips in "My Bookings" section
- [ ] Connect Flash to actual booking/payment (Duffel API)

### Planned (Web)
- [ ] Streamline wizard to 4 steps
- [ ] Revealed preference learning from swipes
- [ ] Hotel integration (pending Duffel Stays API access)
- [ ] PWA support (installable, offline basics)

### Planned (Mobile Native - Expo)
- [ ] Core app setup (auth, navigation, screens)
- [ ] Native swipe UI with gesture-handler + reanimated
- [ ] Live trip map with user location
- [ ] Geofencing alerts ("You're near your saved restaurant!")
- [ ] Offline mode (cached maps + POIs)
- [ ] Smart notifications (trip reminders, flight updates)
- [ ] Background location for trip diary
- [ ] Auto-generated trip summary with photos
- [ ] AR POI discovery (future)

---

## Flash Vacation Feature

### User Flow

```
STEP 1: City Selection (Swipe Interface)
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
7. System generates 8 trip packages (lazy loads +8 more at card 4)
8. User swipes through cards:
   - Swipe right = Like (goes to explore)
   - Swipe left = Pass (next card)
   - Can go back to previous cards

STEP 2: Explore/Itinerary Page
9. On "like", user lands on /flash/explore
10. Full-screen Mapbox map shows destination + POIs
11. POIs loaded from Google Places (restaurants, attractions, activities)
12. User can:
    - Browse POIs on map
    - Favorite POIs for itinerary
    - Shuffle itinerary assignments
    - Skip customization entirely
    - Go back to swipe interface
13. Draft saved to localStorage automatically

STEP 3: Booking (Coming Soon)
14. User proceeds to /flash/confirm
15. Reviews trip summary (flight + favorites)
16. Proceeds to booking via Duffel API
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

- **410 curated destinations** with rich metadata:
  - City, country, airport codes
  - Vibes (beach, adventure, culture, romance, etc.)
  - Best months
  - Average cost estimates
  - Highlights and activities
  - Image URLs

### POI Database

- **68,561 POIs** from Google Places API across 410 destinations
- Categories: restaurants, cafes, attractions, museums, nightlife, activities
- Each POI includes:
  - Name, address, coordinates
  - Google Place ID (stable identifier)
  - Rating, price level, photos
  - Opening hours (where available)
- Images served via proxy to hide API keys

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
| `/api/flash/generate` | POST | Generate trip batch (supports lazy loading) |
| `/api/pois/[city]` | GET | Get POIs for a destination |
| `/api/places/photo` | GET | Proxy Google Places photos (hides API key) |

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
| `/flash/swipe` | Swipe interface (Step 1 - city selection) |
| `/flash/explore` | Explore/itinerary page (Step 2 - POI browsing) |
| `/flash/confirm` | Selected trip confirmation (Step 3 - booking) |

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

## Mobile App Strategy

### Why Native (Not Web Wrapper)

HonestNomad's core features require native capabilities:

| Feature | Why Native Required |
|---------|---------------------|
| Swipe gestures | Web gestures feel laggy vs native |
| Live maps | Mapbox GL Native outperforms web |
| Geofencing | Background location APIs |
| Offline maps | Native tile caching |
| Push notifications | Reliable delivery, rich content |
| Trip diary | Background location tracking |

### The "During Trip" Experience

This is the killer differentiator. When a user lands at their destination:

```
1. ARRIVAL DETECTION
   └→ App detects user arrived in Barcelona
   └→ Switches to "Live Trip" mode
   └→ Map goes live with their location + saved POIs

2. GEOFENCED ALERTS
   └→ User walks within 500m of saved restaurant
   └→ Push: "Cervecería Catalana is right here - rated 4.8⭐"
   └→ Tap → Opens directions or shows details

3. PASSIVE TRACKING
   └→ Background location logs where they went
   └→ No user action required
   └→ Building their trip story automatically

4. SMART NOTIFICATIONS
   └→ Morning: "Day 2! You planned Sagrada Familia today"
   └→ Contextual: "It's 12:30 - lunch spots near you"
   └→ Flight day: "6 hours to flight, traffic is light"

5. OFFLINE MODE
   └→ User downloads trip before flying
   └→ Map tiles cached for destination
   └→ All POIs available without data
```

### The "After Trip" Experience

```
1. TRIP DIARY AUTO-GENERATED
   └→ "You visited 12 places over 4 days"
   └→ Map showing their actual path
   └→ Photos from camera roll geo-matched to POIs

2. SHAREABLE SUMMARY
   └→ Beautiful trip card for social media
   └→ "My Barcelona trip with HonestNomad"

3. PREFERENCE LEARNING
   └→ They visited 4 restaurants, 1 museum
   └→ System learns: this user is food-focused
   └→ Next trip suggestions weighted accordingly
```

### Development Phases

| Phase | Deliverables |
|-------|--------------|
| **Phase 1: PWA** | Installable web app, validate mobile demand |
| **Phase 2: Core Native** | Auth, swipe, maps, basic location |
| **Phase 3: Live Trip** | Geofencing, offline, push notifications |
| **Phase 4: Trip Diary** | Background tracking, auto-summary, sharing |
| **Phase 5: Launch** | App Store submission, beta testing |

---

## Future Enhancements

### Near-term (Web)
- Streamline wizard from 8 to 4 steps
- Revealed preference learning from swipe behavior
- Enable hotel search when API access granted
- PWA support for mobile web

### Medium-term (Mobile)
- Expo/React Native app with native swipe UI
- Live trip map with geofencing
- Offline mode for destinations
- Smart push notifications
- Trip diary with auto-generated summaries

### Long-term
- AR POI discovery (point camera, see restaurants)
- Price alerts/drop notifications
- Flight + hotel bundling
- Social features (share trips, see friends' trips)
- Loyalty program integrations
- White-label/B2B API

---

## Competitive Advantage

| Competitor | Focus | Gap |
|------------|-------|-----|
| Booking.com | Before (booking only) | Abandons user after checkout |
| Airbnb | Before (booking only) | No in-trip guidance |
| TripIt | During (itinerary only) | No discovery or booking |
| Google Maps | During (navigation only) | No trip context |
| **HonestNomad** | **Before + During + After** | **Full lifecycle ownership** |

The giants can't easily copy this because:
1. They're optimized for transaction volume, not user engagement
2. Their apps are built for search/book, not live guidance
3. User habit: they're "booking apps" not "travel companion apps"

---

*Document Version: 3.0*
*Last Updated: January 2025*
