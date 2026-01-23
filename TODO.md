# HonestNomad - Quick Action Checklist

> For detailed status and session logs, see `PROJECT-STATUS.md`

---

## Product Vision: Full Travel Lifecycle

```
BEFORE (Web + Mobile)     DURING (Mobile Native)     AFTER (Web + Mobile)
────────────────────      ────────────────────       ────────────────────
• Swipe to pick trip      • Live map guidance        • Auto trip diary
• AI chat planning        • Geofenced POI alerts     • Photo memories
• Book flights/hotels     • "You're near X!"         • Share your trip
• Curate POIs             • Offline maps             • Learn preferences
```

**Goal:** Own the entire journey, not just the booking moment.

---

## Current Focus: Flash Vacation Feature

### Completed (Phase 1-6)
- [x] Type definitions (`types/flash.ts`)
- [x] API routes for preferences (`app/api/flash/preferences/route.ts`)
- [x] API routes for trip generation (`app/api/flash/generate/route.ts`)
- [x] Profile wizard - 8 steps (travelers, homeBase, budget, accommodation, travelStyle, interests, restrictions, surpriseTolerance)
- [x] Destination database with 50+ curated destinations (`lib/flash/destinations.ts`)
- [x] Diversity engine for destination selection (`lib/flash/diversityEngine.ts`)
- [x] Trip generator - **flights-only mode** (`lib/flash/tripGenerator.ts`)
- [x] Flash plan input page (`app/flash/page.tsx`)
- [x] Swipe interface with card stack (`app/flash/swipe/page.tsx`)
- [x] SwipeCard and TripDetailModal components
- [x] Confirm/booking page (`app/flash/confirm/page.tsx`)
- [x] Flash profile section in Settings page
- [x] Snake_case to camelCase database transformation fix
- [x] **POI data migration** - 410 destinations with 68,561 POIs from Google Places API
- [x] **Explore/Itinerary page** (`app/flash/explore/page.tsx`) with Mapbox map
- [x] **Lazy loading swipe cards** - Load 8 initially, +8 more at card 4 (seamless background loading)
- [x] **Draft persistence** - localStorage for "unfinished trips" (`lib/flash/draft-storage.ts`)
- [x] **Google Places image proxy** - Hides API keys from client (`app/api/places/photo/route.ts`)
- [x] **Skip button** - Users can bypass customization and go straight to booking
- [x] **Back button fix** - z-index layering for explore page overlay
- [x] **Error handling UI** - Dismissible warnings and empty states for POI loading
- [x] **Draft trips in My Bookings** - Supabase-backed persistence, shows 3 most recent unfinished trips

### Next Up (Web)
- [ ] Streamline wizard from 8 steps to ~4 essential steps
- [ ] Implement "revealed preference" learning from swipe behavior
- [ ] Re-enable hotel search once Duffel Stays API access is granted
- [ ] Connect swipe "accept" to actual booking flow (Duffel booking API)
- [ ] Add PWA support (manifest.json, service worker) to validate mobile demand

### Known Issues
- Hotel search disabled (Duffel Stays API not enabled on account)
- Flights-only mode active - hotels show as "not included" in trip cards

---

## Mobile Native Roadmap (Expo/React Native)

### Phase 1: PWA Validation
- [ ] Add manifest.json for installability
- [ ] Add service worker for offline basics
- [ ] Test "Add to Home Screen" flow
- [ ] Measure mobile usage/installs

### Phase 2: Core Native App
- [ ] Set up Expo monorepo structure
- [ ] Extract shared code to `packages/core/`
- [ ] Implement Supabase auth with SecureStore
- [ ] Build React Navigation stack
- [ ] Native swipe UI (gesture-handler + reanimated)
- [ ] Mapbox GL integration with live location
- [ ] POI display on native map

### Phase 3: Live Trip Mode
- [ ] Arrival detection (entered destination city)
- [ ] Geofencing for saved POIs (500m radius)
- [ ] Push notifications ("You're near X!")
- [ ] Offline map tile caching per destination
- [ ] Offline POI data storage

### Phase 4: Trip Diary
- [ ] Background location tracking (opt-in)
- [ ] Auto-log visited places
- [ ] Photo geo-matching from camera roll
- [ ] Auto-generated trip summary
- [ ] Shareable trip card for social

### Phase 5: Launch
- [ ] Smart notifications (morning itinerary, flight reminders)
- [ ] App Store / Play Store assets
- [ ] Beta testing via TestFlight / Play Console
- [ ] Submit for review

### Future Mobile Features
- [ ] AR POI discovery (point camera at street)
- [ ] Social features (share trips, see friends')
- [ ] Apple Pay / Google Pay integration
- [ ] Widget for trip countdown

---

## Original MVP Features (Complete)

### Build Status
- [x] Project setup (Next.js 14, TypeScript, Tailwind)
- [x] Database schema & Supabase integration
- [x] Authentication (email + Google + Facebook OAuth)
- [x] Claude AI integration (conversation + itinerary)
- [x] Duffel API integration (flights search + booking)
- [x] Mapbox geocoding
- [x] Chat interface
- [x] Hotel search & display (mock data mode)
- [x] Booking flow with payment form
- [x] Map components (Leaflet)
- [x] Itinerary generation & display
- [x] User pages (bookings, settings)
- [x] All API routes

### Setup Tasks
- [x] npm install
- [x] Supabase project setup
- [x] API keys configured
- [x] Deployed to Vercel

---

## Install & Run

```bash
cd C:\HonestNomad
npm install
npm run dev
```

---

## API Keys Needed

| Service | Get From | Free Tier |
|---------|----------|-----------|
| Supabase | supabase.com | 500MB DB, 50k MAU |
| Anthropic | console.anthropic.com | Pay as you go |
| Duffel | dashboard.duffel.com | Commission model |
| Mapbox | account.mapbox.com | 100k geocodes/month |

---

## Test Flow - Flash Vacation

### Step 1: City Selection (Swipe Interface)
1. **Open app** → Navigate to `/flash`
2. **Complete wizard** (if profile incomplete) → 8 steps of preferences
3. **Select dates** and optional vibe filters → Click "Generate Flash Trips"
4. **Swipe interface** loads with 8 trip cards (flights-only mode)
5. **Swipe left** to pass (next card), more cards load automatically at card 4
6. **Swipe right** to like → Goes to explore page

### Step 2: Explore/Itinerary Page
7. **Explore page** shows destination with Mapbox map + POIs
8. **Browse POIs** - restaurants, attractions, activities loaded from Google Places
9. **Favorite POIs** - tap heart to save for itinerary
10. **Shuffle itinerary** - randomize day assignments
11. **Skip button** - bypass customization, go straight to confirm
12. **Back button** - return to swipe interface

### Step 3: Booking (Coming Soon)
13. **Confirm trip** → Review summary
14. **Proceed to booking** → Duffel checkout (placeholder)

---

## File Quick Reference

| Need to... | Look in... |
|------------|------------|
| Change AI prompts | `lib/claude/prompts.ts` |
| Modify flight search | `lib/duffel/flights.ts` |
| Edit chat UI | `components/chat/` |
| Update database schema | `lib/supabase/migrations.sql` |
| **Flash wizard steps** | `components/flash/ProfileWizard/` |
| **Trip generation** | `lib/flash/tripGenerator.ts` |
| **Swipe UI** | `components/flash/ImmersiveSwipeContainer.tsx` |
| **Destination data** | `lib/flash/destinations.ts` |
| **POI data** | `data/pois/` (410 JSON files, 68k POIs) |
| **Explore page** | `app/flash/explore/page.tsx` |
| **Draft persistence** | `lib/flash/draft-storage.ts` |
| **Image proxy** | `app/api/places/photo/route.ts` |

---

## Code Reuse for Mobile (Reference)

When building the Expo app, these can be shared directly:

| Layer | Reuse | Notes |
|-------|-------|-------|
| `types/*.ts` | 100% | Copy directly |
| `lib/flash/destinations.ts` | 100% | Destination database |
| `lib/flash/tripGenerator.ts` | 100% | Trip generation logic |
| `lib/flash/diversityEngine.ts` | 100% | Selection algorithm |
| `lib/supabase/*.ts` | 95% | Swap token storage only |
| `lib/duffel/*.ts` | 100% | API calls unchanged |
| `data/pois/*.json` | 100% | Bundle or fetch |
| `lib/flash/draft-storage.ts` | 95% | Uses Supabase API, fully portable |
| UI Components | 0-20% | Full rewrite for native |

---

*Last updated: January 2025*
