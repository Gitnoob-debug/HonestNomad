# HonestNomad - Product Requirements Document

## Executive Summary

HonestNomad is an AI-powered hotel booking assistant that translates natural language travel requests into hotel bookings. Users describe what they want conversationally, the system interprets intent via Claude, queries hotel inventory via Duffel API, completes bookings with integrated payments, and generates personalized trip itineraries.

**Working Title:** HonestNomad
**Alternative Names to Consider:** Wanderly, StayWhisper, Roamly, TripPilot

---

## Product Vision

A single conversational interface that replaces the fragmented hotel booking experience. Users talk naturally about their travel needs, and the assistant handles everything: understanding preferences, finding options, booking, and planning their trip.

**Core Value Proposition:** "Tell us where you want to go. We'll handle the rest."

---

## Target Users

- **Primary:** Solo travelers, couples, and small groups planning leisure trips
- **Geography:** North America and Europe (based on Duffel inventory density)
- **Behavior:** Users who prefer conversational interfaces over form-heavy booking sites

---

## Technology Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js 14 (App Router) | React, TypeScript, SSR |
| Styling | Tailwind CSS | Utility-first, rapid development |
| Database | Supabase (PostgreSQL) | Auth, realtime, RLS |
| AI | Claude 3.5 Sonnet | Conversation & intent parsing |
| Hotels | Duffel Stays API | Search, rates, booking |
| Payments | Duffel Pay | PCI compliance handled |
| Geocoding | Mapbox Geocoding API | Robust city/address lookup |
| Maps | Leaflet + OpenStreetMap | Free, no API key for tiles |
| Hosting | Vercel | Edge functions, zero-config |
| Analytics | Vercel Analytics + PostHog | Usage tracking |
| Errors | Sentry | Error monitoring |

---

## Core Features (All MVP)

### 1. Conversational Chat Interface
- Natural language input for travel requests
- Real-time typing indicators
- Message history within session
- Streaming responses (nice-to-have, can be added later)

### 2. AI Intent Parsing & Orchestration
- Extract: destination, dates, guests, rooms, budget, preferences
- Handle relative dates ("next weekend", "4 nights starting March 10")
- Accumulate preferences across conversation turns
- Clarify missing required fields naturally

### 3. Hotel Search & Results
- Query Duffel Stays API with parsed parameters
- Filter by budget, location, amenities
- Display results as interactive cards
- Show photos, ratings, pricing, amenities
- Sort by relevance, price, rating

### 4. Interactive Map
- Display hotel location on map
- Show nearby attractions (Claude-generated suggestions)
- Leaflet + OpenStreetMap (free)
- Click markers for details

### 5. Booking Flow
- Select hotel and room type
- Guest details form (name, email, phone)
- Payment via Duffel Pay
- Confirmation with booking reference
- Email confirmation (via Duffel)

### 6. User Authentication
- Email/password signup and login (Supabase Auth)
- Anonymous sessions that can convert to accounts
- OAuth (Google) - optional enhancement

### 7. User Profiles & Preferences
- Save travel preferences (budget range, preferred amenities, traveler type)
- Booking history
- Quick re-search from past trips

### 8. Itinerary Generator
- AI-generated day-by-day plans after booking
- Specific restaurant/activity recommendations
- Time estimates and walking distances
- Packing tips and local tips
- Emergency info
- Interactive checklist (mark items complete)
- Export to text / print

### 9. Geocoding
- Robust city/address lookup via Mapbox
- Support for neighborhoods ("Shibuya, Tokyo")
- Coordinate-based searches
- Fallback handling for ambiguous locations

---

## User Flows

### Flow 1: New User Books a Hotel

```
1. User lands on homepage
2. Sees chat interface with greeting
3. Types: "I need a boutique hotel in Paris, March 15-18, under €150/night"
4. AI confirms understanding, shows searching indicator
5. Results appear as cards below chat
6. User clicks "Book This" on preferred hotel
7. Prompted to sign up or continue as guest
8. User signs up (email/password)
9. Guest details form appears
10. Payment form (Duffel Pay)
11. Booking confirmed, reference number shown
12. Offered to generate itinerary
13. User accepts, itinerary generated and displayed
14. Can export/print itinerary
```

### Flow 2: Returning User

```
1. User logs in
2. Sees past bookings and saved preferences
3. Starts new chat, preferences pre-loaded
4. "Find me something similar to my Paris trip but in Barcelona"
5. AI uses context from previous bookings
6. Faster booking flow (saved details)
```

### Flow 3: Anonymous User

```
1. User starts chatting without signing up
2. Books hotel as guest
3. Post-booking, prompted to create account to save booking
4. Can convert to full account, booking attached
```

---

## Database Schema

### Tables

1. **users** (Supabase Auth handles this)
2. **profiles** - Extended user data and preferences
3. **conversations** - Chat sessions with state
4. **messages** - Individual messages
5. **bookings** - Completed bookings
6. **itineraries** - Generated trip plans
7. **search_logs** - Analytics and debugging

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Main conversation handler |
| `/api/search` | POST | Direct hotel search (bypass chat) |
| `/api/book` | POST | Create booking |
| `/api/booking/[id]` | GET | Get booking details |
| `/api/booking/[id]` | DELETE | Cancel booking |
| `/api/itinerary` | POST | Generate itinerary |
| `/api/itinerary/[id]` | GET | Get itinerary |
| `/api/user/preferences` | GET/PUT | User preferences |
| `/api/user/bookings` | GET | User's booking history |
| `/api/webhooks/duffel` | POST | Duffel booking webhooks |
| `/api/geocode` | GET | Geocode city/address |

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing + Chat interface |
| `/auth/login` | Login page |
| `/auth/signup` | Signup page |
| `/booking/[id]` | Booking confirmation/details |
| `/bookings` | User's booking history |
| `/itinerary/[id]` | Itinerary view |
| `/settings` | User preferences |

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

# Sentry
SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Design System

### Colors (Suggested)
- Primary: Blue (#2563EB) - Trust, travel
- Secondary: Slate grays for text/backgrounds
- Accent: Amber for CTAs and highlights
- Success: Green for confirmations
- Error: Red for errors

### Typography
- Sans-serif system font stack
- Clear hierarchy: headings, body, captions

### Components
- Chat bubbles (user: right/blue, assistant: left/gray)
- Hotel cards with image, details, CTA
- Form inputs with validation states
- Buttons: primary, secondary, ghost
- Loading states and skeletons
- Map with custom markers

### Asset Placeholders
- Logo: `/public/logo.svg` (512x512)
- Favicon: `/public/favicon.ico`
- OG Image: `/public/og-image.png` (1200x630)
- Map markers: `/public/markers/hotel.png`, `/public/markers/attraction.png`
- Default hotel image: `/public/images/hotel-placeholder.jpg`

---

## Success Metrics

1. **Conversion Rate:** Chat started → Booking completed
2. **Search-to-Book:** Searches → Bookings
3. **Itinerary Engagement:** % of bookings that generate itinerary
4. **Return Users:** Users who book again
5. **Chat Completion:** Conversations that reach resolution

---

## Security Considerations

- All API routes validate session/auth
- RLS policies on all Supabase tables
- No PII in logs
- Duffel handles PCI compliance for payments
- Webhook signature verification
- Rate limiting on API routes

---

## Out of Scope (Future Phases)

- Flight bundling
- Price alerts/drop notifications
- Mobile native app
- Multi-room complex bookings
- Loyalty program integrations
- White-label/B2B API
- Real-time price comparison

---

## Open Questions / Decisions

1. **OAuth providers:** Start with just email/password, or include Google OAuth?
2. **Streaming responses:** Implement now or add later?
3. **Email sending:** Rely on Duffel's confirmation emails, or send our own?

---

*Document Version: 1.0*
*Created: January 2025*
