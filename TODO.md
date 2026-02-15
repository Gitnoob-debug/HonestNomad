# HonestNomad - Roadmap & TODO

> Last updated: February 15, 2026
> Architecture: Next.js 14 + Supabase + LiteAPI + Mapbox + Claude (OpenRouter)
> Hotels + experiences only. No flights. No chat mode.

---

## Current State (v2.1 — Deployed)

Flow: Landing Page → Quick Intent Form → Swipe 16 Cities → Explore POIs on Map → Hotels → Review → Adventure Package

- 500 curated destinations, 85k+ POIs, 5GB+ Supabase images
- LiteAPI sandbox for hotel search (mock pricing active)
- Anonymous browsing, auth gate only at booking
- Zero-friction form: dates + traveler type + vibes + budget tier → go
- 5-step progress bar: Vibe → Explore → Stay → Review → Package
- AI Magic Package on confirm page (packing lists, tips, adventure guide)
- Travel time matrix for 500+ destinations
- Deployed to Vercel: https://honest-nomad-ud6y.vercel.app

---

## Recently Completed (frosty-banach branch)

### Session 1 — WOW Factor & Visual Polish
- [x] Richer swipe cards with image carousels, taglines, POI counts, seasonal badges
- [x] Hotel map view with POI overlay markers
- [x] Smart hotel zone clustering (IQR-based) with tighter search radius
- [x] Hotel-zone alignment scoring for proximity-based results

### Session 2 — Progress & Packaging
- [x] 5-step progress bar (Vibe → Explore → Stay → Review → Package)
- [x] "Your Adventure Package" reveal step after checkout with assembled items, stats, crossed-off tedious tasks

### Session 3 — Zero Friction Onboarding
- [x] Fix auto-redirect bug (stale trips in sessionStorage sent users past the form)
- [x] Resume banner for existing trips instead of auto-redirect
- [x] Add "Who's going?" traveler pills (Solo/Couple/Family/Friends) inline on form
- [x] Move region selector behind collapsible "More filters" toggle
- [x] Remove profile wizard nudges from /flash page

### Session 4 — Kill the Profile Gate
- [x] Remove `scoreProfileMatch()` from scoring engine (was 35% weight, always returned 0.5)
- [x] Redistribute scoring: vibes 40%, seasonal 35%, budget 25% (no profile needed)
- [x] With revealed prefs: behavior 40%, vibes 25%, seasonal 20%, budget 15%
- [x] Remove saved-profile dependency from generate API (always uses defaults)
- [x] Remove saved-profile dependency from hotel search API (reads travelers from request body)
- [x] Wire traveler type through: form → sessionStorage → hotel search → room occupancy
- [x] Remove profileComplete/missingSteps/preferencesLoading from useFlashVacation hook
- [x] Clean up settings page (removed wizard section, added simple "Start Exploring" CTA)
- [x] Clean up swipe page (removed Spinner loading gate)
- [x] Net: -301 lines removed, zero friction to first trip

---

## P0 — Critical Fixes (Before Sharing)

- [ ] **Replace alert() booking button** — `app/flash/confirm/page.tsx` pops `alert("Booking flow coming soon!")`. Replace with proper "coming soon" modal or real booking redirect
- [ ] **Remove console.log statements** — Strip or wrap in `process.env.NODE_ENV === 'development'`
- [ ] **Fix hardcoded Supabase image URLs** — `app/page.tsx` has raw Supabase Storage URLs for landing page feature images
- [ ] **Fix database schema mismatch** — `bookings` table still has `duffel_*` columns but code writes `provider_*`. Need ALTER TABLE migration
- [ ] **Fix `any` types** — `app/flash/confirm/page.tsx` has `itinerary: any[]` and `favoriteStops: any[]`

---

## P1 — Polish & UX (Next Sprint)

- [ ] **Landing page hero image** — Replace generic gradient with a real destination photo background
- [ ] **Session storage resilience** — Add "session expired, start over" fallback for browser back/forward
- [ ] **Don't auto-select first hotel** — Require explicit tap instead of pre-selecting
- [ ] **Lazy-load Magic Package** — Use skeleton placeholder or background fetch if Claude API is slow
- [ ] **Consistent error messaging** — Unify voice/tone across error states
- [ ] **Accessibility** — Missing aria-labels, generic image alt text, no screen reader announcements
- [ ] **Mobile swipe card polish** — Image carousel portrait orientation, tap zone affordance

---

## P2 — Hotel Booking (Make It Real)

### Database Migration
- [ ] Rename `duffel_*` columns to `provider_*` in bookings table
- [ ] Drop unused `conversation_id` column

### Enable Real Pricing
- [ ] Set `USE_MOCK_RATES = false` in `lib/liteapi/hotels.ts`
- [ ] Handle edge cases: no rates returned, rate expiration, currency conversion

### Implement LiteAPI Payment SDK
- [ ] Add prebook endpoint: `POST /rates/prebook` with `usePaymentSdk: true`
- [ ] Embed LiteAPI payment JS widget (Stripe Elements under the hood)
- [ ] Handle payment redirect flow → book confirmation
- [ ] Store real booking reference in Supabase
- [ ] Remove mock card fields from GuestForm.tsx

### Booking Management
- [ ] Cancel booking endpoint
- [ ] Booking status in My Bookings page
- [ ] Email confirmation

---

## P3 — Price Intelligence & "Hot Deals"

- [ ] Create `price_index` Supabase table for historical rate tracking
- [ ] Seed data: 50 key destinations, benchmark hotels, rolling date windows
- [ ] Vercel/Supabase cron for daily rate sampling
- [ ] Price signal badges on swipe cards (Hot Deal, Prices Dropping, etc.)
- [ ] "Best time to visit" cross-referencing price data with seasonal data

---

## P4 — Data Enrichment (Backburner)

- [ ] Fix 49% junk POI descriptions ("Museum - highly rated") from existing data (no API)
- [ ] Fix image bug: `itinerary-generator.ts` `poiToItineraryStop()` uses expired `poi.imageUrl` instead of `resolvePOIImageUrl()`
- [ ] Enrich `bestTimeOfDay` from POI categories (56% currently "any")
- [ ] Re-fetch opening hours from Google Places (~$170-500 for top destinations)
- [ ] 17 destinations have <10% Supabase image coverage (Istanbul, Tbilisi, etc.)

---

## P5 — Loyalty & Personalization

- [ ] Wire up `lib/loyalty/` — hotel chain → loyalty program matching (built, not connected)
- [ ] Show loyalty badges on hotel cards
- [ ] Revealed preferences already learning from swipes (active, 40% weight when 10+ signals)
- [ ] "Because you liked X" recommendations from swipe history

---

## P6 — Trust & Social Proof

- [ ] Testimonials or stats on landing page
- [ ] Share/save trip link for travel partners
- [ ] Price range preview before budget tier selection

---

## P7 — Mobile & Platform

- [ ] PWA support (manifest.json, service worker)
- [ ] Responsive polish pass
- [ ] Eventually: React Native (Expo) app

---

## API Keys & Services

| Service | Purpose | Cost Model |
|---------|---------|------------|
| Supabase | DB, Auth, Storage (5GB images) | Free tier (500MB DB, 50k MAU) |
| LiteAPI/Nuitee | Hotel search, rates, booking | Free searches, 2.9-3.9% per booking |
| Mapbox | Maps, geocoding | Free tier (100k loads/month) |
| OpenRouter → Claude | Magic Package AI, future features | Pay per token |
| Google Places | POI data (migration scripts only) | **DO NOT RUN** without permission |
| Pexels | Image migration (scripts only) | **DO NOT RUN** without permission |

---

## File Quick Reference

| Need to... | Look in... |
|------------|------------|
| Hotel search logic | `lib/liteapi/hotels.ts` |
| Hotel API client | `lib/liteapi/client.ts` |
| Hotel types | `lib/liteapi/types.ts` |
| AI prompts (Magic Package) | `lib/claude/prompts.ts` |
| Trip generation + scoring | `lib/flash/tripGenerator.ts`, `lib/flash/diversityEngine.ts` |
| Destination database (500) | `lib/flash/destinations.ts` |
| POI data (85k) | `data/pois/*.json` |
| POI loader | `lib/flash/poi-loader.ts` |
| Travel time matrix | `lib/flash/travelTimeMatrix.ts` |
| Swipe UI | `components/flash/ImmersiveSwipeCard.tsx` |
| Explore/Map page | `app/flash/explore/page.tsx` |
| Flash input form | `components/flash/FlashPlanInput.tsx` |
| Trip state management | `hooks/useFlashVacation.ts` |
| Revealed preferences | `hooks/useRevealedPreferences.ts` |
| Profile wizard (dormant) | `components/flash/ProfileWizard/` — exists but not linked anywhere |
| Loyalty mapping | `lib/loyalty/` |
| Booking storage | `lib/supabase/bookings.ts` |
| Draft persistence | `lib/flash/draft-storage.ts` |
| Supabase image helper | `lib/supabase/images.ts` |

---

*Brand name "HonestNomad" is temporary — keep everything theme-able.*
