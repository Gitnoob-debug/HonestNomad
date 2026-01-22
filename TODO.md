# HonestNomad - Quick Action Checklist

> For detailed status and session logs, see `PROJECT-STATUS.md`

---

## Current Focus: Flash Vacation Feature

### Completed (Phase 1-5)
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

### In Progress
- [ ] **Test flight search end-to-end** - Verify trips generate and display in swipe UI

### Next Up
- [ ] Streamline wizard from 8 steps to ~4 essential steps
- [ ] Implement "revealed preference" learning from swipe behavior
- [ ] Re-enable hotel search once Duffel Stays API access is granted
- [ ] Connect swipe "accept" to actual booking flow

### Known Issues
- Hotel search disabled (Duffel Stays API not enabled on account)
- Flights-only mode active - hotels show as "not included" in trip cards

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

1. **Open app** → Navigate to `/flash`
2. **Complete wizard** (if profile incomplete) → 8 steps of preferences
3. **Select dates** and optional vibe filters → Click "Generate Flash Trips"
4. **Swipe interface** loads with trip cards (flights-only mode)
5. **Swipe right** to like, **left** to pass, or **tap** for details
6. **Confirm trip** → Proceed to booking

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
| **Swipe UI** | `components/flash/SwipeCard.tsx`, `SwipeContainer.tsx` |
| **Destination data** | `lib/flash/destinations.ts` |

---

*Last updated: January 2025*
