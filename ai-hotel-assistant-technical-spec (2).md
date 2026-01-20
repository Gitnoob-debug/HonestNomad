# AI Hotel Booking Assistant — Technical Specification

## Executive Summary

A conversational AI interface that translates natural language travel requests into hotel bookings. Users describe what they want in plain English, the system interprets intent, queries hotel inventory via Duffel API, and completes bookings with payment processing.

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT                                      │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Next.js Application                          │  │
│  │                                                                      │  │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐   │  │
│  │   │    Chat     │   │   Results   │   │   Booking/Payment       │   │  │
│  │   │  Interface  │   │   Display   │   │   Flow                  │   │  │
│  │   └─────────────┘   └─────────────┘   └─────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                      │
│                         (Next.js API Routes)                               │
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   /chat     │  │  /search    │  │   /book     │  │   /webhook      │   │
│  │             │  │             │  │             │  │   (Duffel)      │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼──────────────────┼────────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    Conversation Orchestrator                        │   │
│  │                                                                     │   │
│  │  1. Receive user message                                            │   │
│  │  2. Load conversation history from Supabase                         │   │
│  │  3. Send to Claude for intent extraction                            │   │
│  │  4. Route to appropriate handler (search, clarify, book)            │   │
│  │  5. Execute hotel API calls if needed                               │   │
│  │  6. Send results back to Claude for natural language response       │   │
│  │  7. Store updated conversation state                                │   │
│  │  8. Return response to client                                       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐     │
│  │  Claude API      │  │  Duffel API      │  │  Supabase            │     │
│  │  (Anthropic)     │  │  (Hotels)        │  │  (State + Auth)      │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 14 (App Router) | SSR, API routes, fast iteration |
| Styling | Tailwind CSS | Rapid UI development |
| Hosting | Vercel | Zero-config deployment, edge functions |
| Database | Supabase (PostgreSQL) | Auth, realtime, generous free tier |
| AI | Claude 3.5 Sonnet API | Superior reasoning for travel context |
| Hotel Inventory | Duffel Stays API | Self-service, commission model, modern API |
| Payments | Duffel Pay (or Stripe) | PCI compliance handled |
| Analytics | Vercel Analytics + PostHog | Usage tracking, funnel analysis |

### 1.3 Project Structure

```
hotel-assistant/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing/chat page
│   ├── globals.css
│   │
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts           # Main conversation endpoint
│   │   ├── search/
│   │   │   └── route.ts           # Direct hotel search (bypass chat)
│   │   ├── book/
│   │   │   └── route.ts           # Create booking
│   │   ├── itinerary/
│   │   │   └── route.ts           # Generate itinerary
│   │   ├── booking/
│   │   │   └── [id]/
│   │   │       └── route.ts       # Get/cancel booking
│   │   └── webhooks/
│   │       └── duffel/
│   │           └── route.ts       # Duffel booking webhooks
│   │
│   └── booking/
│       └── [id]/
│           └── page.tsx           # Booking confirmation page
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx      # Main chat wrapper
│   │   ├── MessageList.tsx        # Message display
│   │   ├── MessageBubble.tsx      # Individual message
│   │   ├── InputBar.tsx           # User input
│   │   └── TypingIndicator.tsx
│   │
│   ├── hotels/
│   │   ├── HotelCard.tsx          # Hotel result display
│   │   ├── HotelList.tsx          # Results list
│   │   ├── HotelDetails.tsx       # Expanded view
│   │   └── PriceBreakdown.tsx
│   │
│   ├── booking/
│   │   ├── GuestForm.tsx          # Guest details input
│   │   ├── PaymentForm.tsx        # Payment collection
│   │   └── Confirmation.tsx
│   │
│   ├── map/
│   │   ├── index.tsx              # Dynamic import wrapper
│   │   └── HotelMap.tsx           # Leaflet map component
│   │
│   ├── itinerary/
│   │   ├── ItineraryView.tsx      # Main itinerary display
│   │   ├── DaySection.tsx         # Collapsible day view
│   │   ├── ItineraryItem.tsx      # Single activity card
│   │   └── ItineraryExport.tsx    # Export/print functions
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Loading.tsx
│
├── lib/
│   ├── duffel/
│   │   ├── client.ts              # Duffel SDK initialization
│   │   ├── search.ts              # Search functions
│   │   ├── book.ts                # Booking functions
│   │   └── types.ts               # TypeScript types
│   │
│   ├── claude/
│   │   ├── client.ts              # Anthropic SDK init
│   │   ├── prompts.ts             # System prompts
│   │   ├── intent.ts              # Intent extraction
│   │   └── response.ts            # Response generation
│   │
│   ├── supabase/
│   │   ├── client.ts              # Supabase client
│   │   ├── conversations.ts       # Conversation CRUD
│   │   └── bookings.ts            # Booking CRUD
│   │
│   ├── itinerary/
│   │   ├── generate.ts            # Itinerary generation
│   │   └── export.ts              # Export utilities
│   │
│   ├── places/
│   │   ├── foursquare.ts          # Foursquare API (optional)
│   │   └── geocode.ts             # Geocoding utilities
│   │
│   └── utils/
│       ├── dates.ts               # Date parsing/formatting
│       ├── currency.ts            # Currency handling
│       └── validation.ts
│
├── types/
│   ├── chat.ts                    # Chat message types
│   ├── hotel.ts                   # Hotel/room types
│   ├── booking.ts                 # Booking types
│   ├── intent.ts                  # Parsed intent types
│   └── itinerary.ts               # Itinerary types
│
├── hooks/
│   ├── useChat.ts                 # Chat state management
│   ├── useConversation.ts         # Conversation persistence
│   └── useBooking.ts              # Booking flow state
│
└── config/
    ├── constants.ts               # App constants
    └── prompts.ts                 # Prompt templates
```

---

## 2. Database Schema (Supabase)

### 2.1 Tables

```sql
-- Conversations table
-- Stores chat sessions and their state
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session identifier (anonymous or user-linked)
    session_id TEXT NOT NULL,
    
    -- Current state of the conversation
    state JSONB DEFAULT '{}',
    -- State includes:
    -- {
    --   "stage": "gathering_info" | "showing_results" | "booking" | "complete",
    --   "search_params": { ... },
    --   "selected_hotel_id": "...",
    --   "guest_details": { ... }
    -- }
    
    -- Extracted preferences (accumulated across messages)
    preferences JSONB DEFAULT '{}',
    -- {
    --   "destination": "Tokyo",
    --   "check_in": "2025-04-10",
    --   "check_out": "2025-04-14",
    --   "budget_min": 100,
    --   "budget_max": 200,
    --   "currency": "USD",
    --   "guests": 1,
    --   "rooms": 1,
    --   "vibe": ["modern", "boutique"],
    --   "requirements": ["wifi", "gym"],
    --   "location_preference": "Shibuya"
    -- }
    
    -- Last search results (cached)
    last_search_results JSONB DEFAULT '[]',
    
    -- Metadata
    user_agent TEXT,
    ip_country TEXT
);

-- Messages table
-- Individual messages in a conversation
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Structured data attached to message (hotel results, booking info, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Token counts for cost tracking
    input_tokens INTEGER,
    output_tokens INTEGER
);

-- Bookings table
-- Completed bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Duffel booking reference
    duffel_booking_id TEXT NOT NULL UNIQUE,
    duffel_order_id TEXT,
    
    -- Booking details (denormalized for quick access)
    hotel_name TEXT NOT NULL,
    hotel_id TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_type TEXT,
    
    -- Guest info
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    
    -- Pricing
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    commission_amount DECIMAL(10, 2),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Raw Duffel response
    duffel_response JSONB
);

-- Search logs table
-- For analytics and debugging
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search parameters sent to Duffel
    search_params JSONB NOT NULL,
    
    -- Results summary
    results_count INTEGER,
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    
    -- Performance
    response_time_ms INTEGER,
    
    -- Raw response (for debugging, can be pruned)
    raw_response JSONB
);

-- Indexes
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_bookings_duffel ON bookings(duffel_booking_id);
CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_search_logs_conversation ON search_logs(conversation_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### 2.2 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- For anonymous access via session_id (stored in cookie)
-- API routes will pass session_id, RLS ensures isolation

CREATE POLICY "Users can access own conversations"
ON conversations FOR ALL
USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can access own messages"
ON messages FOR ALL
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE session_id = current_setting('app.session_id', true)
    )
);

CREATE POLICY "Users can access own bookings"
ON bookings FOR ALL
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE session_id = current_setting('app.session_id', true)
    )
);
```

---

## 3. Duffel API Integration

### 3.1 Authentication & Setup

```typescript
// lib/duffel/client.ts

import { Duffel } from '@duffel/api';

if (!process.env.DUFFEL_ACCESS_TOKEN) {
    throw new Error('DUFFEL_ACCESS_TOKEN is required');
}

export const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN,
    // Use 'test' for sandbox, remove for production
    ...(process.env.NODE_ENV !== 'production' && { 
        basePath: 'https://api.duffel.com' 
    })
});

// Test vs Production
// Sandbox: Use test card numbers, no real charges
// Production: Real inventory, real charges
```

### 3.2 Search Implementation

```typescript
// lib/duffel/search.ts

import { duffel } from './client';
import { 
    DuffelSearchParams, 
    DuffelAccommodation,
    NormalizedHotel 
} from './types';

interface SearchParams {
    location: {
        city?: string;
        latitude?: number;
        longitude?: number;
        radius_km?: number;
    };
    check_in: string;      // YYYY-MM-DD
    check_out: string;     // YYYY-MM-DD
    guests: number;
    rooms: number;
    budget?: {
        min?: number;
        max?: number;
        currency: string;
    };
}

export async function searchHotels(params: SearchParams): Promise<NormalizedHotel[]> {
    // Step 1: Search for accommodation
    const searchResponse = await duffel.stays.search({
        check_in_date: params.check_in,
        check_out_date: params.check_out,
        rooms: params.rooms,
        guests: [{ type: 'adult' }].concat(
            Array(params.guests - 1).fill({ type: 'adult' })
        ),
        location: params.location.city 
            ? { 
                geographic_coordinates: await geocodeCity(params.location.city)
              }
            : {
                geographic_coordinates: {
                    latitude: params.location.latitude!,
                    longitude: params.location.longitude!
                }
              },
        radius: params.location.radius_km || 10,
    });

    // Step 2: Get rates for each property
    const accommodations = searchResponse.data;
    
    // Step 3: Filter by budget if specified
    let filtered = accommodations;
    if (params.budget) {
        filtered = accommodations.filter(acc => {
            const nightlyRate = parseFloat(acc.cheapest_rate_total_amount) / 
                getNights(params.check_in, params.check_out);
            
            const meetsMin = !params.budget!.min || nightlyRate >= params.budget!.min;
            const meetsMax = !params.budget!.max || nightlyRate <= params.budget!.max;
            
            return meetsMin && meetsMax;
        });
    }

    // Step 4: Normalize to our format
    return filtered.map(normalizeAccommodation);
}

function normalizeAccommodation(acc: DuffelAccommodation): NormalizedHotel {
    return {
        id: acc.id,
        duffel_id: acc.id,
        name: acc.name,
        description: acc.description,
        
        location: {
            address: acc.location.address.line_1,
            city: acc.location.address.city_name,
            country: acc.location.address.country_code,
            latitude: acc.location.geographic_coordinates.latitude,
            longitude: acc.location.geographic_coordinates.longitude,
        },
        
        rating: {
            stars: acc.rating,
            review_score: acc.review_score,
            review_count: acc.review_count,
        },
        
        photos: acc.photos.map(p => ({
            url: p.url,
            caption: p.caption,
        })),
        
        amenities: acc.amenities || [],
        
        pricing: {
            total_amount: parseFloat(acc.cheapest_rate_total_amount),
            currency: acc.cheapest_rate_currency,
            nightly_rate: parseFloat(acc.cheapest_rate_total_amount) / 
                getNights(acc.check_in_date, acc.check_out_date),
        },
        
        cheapest_rate_id: acc.cheapest_rate_id,
        
        rooms: acc.rooms?.map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            beds: room.beds,
            max_occupancy: room.max_occupancy,
            rates: room.rates.map(rate => ({
                id: rate.id,
                total_amount: parseFloat(rate.total_amount),
                currency: rate.total_currency,
                cancellation_policy: rate.cancellation_timeline,
                board_type: rate.board_type, // room_only, breakfast, etc.
            })),
        })) || [],
    };
}

// Geocoding helper (use a service or cache common cities)
async function geocodeCity(city: string): Promise<{latitude: number, longitude: number}> {
    // For MVP, use a static lookup of common cities
    // Later: integrate Google Places or Mapbox
    const cities: Record<string, {latitude: number, longitude: number}> = {
        'tokyo': { latitude: 35.6762, longitude: 139.6503 },
        'paris': { latitude: 48.8566, longitude: 2.3522 },
        'new york': { latitude: 40.7128, longitude: -74.0060 },
        'london': { latitude: 51.5074, longitude: -0.1278 },
        'barcelona': { latitude: 41.3851, longitude: 2.1734 },
        // Add more as needed
    };
    
    const normalized = city.toLowerCase().trim();
    
    if (cities[normalized]) {
        return cities[normalized];
    }
    
    // Fallback: Use a geocoding API
    // For MVP, throw error and ask user for more specific location
    throw new Error(`Unknown city: ${city}. Please specify a major city or provide coordinates.`);
}

function getNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
```

### 3.3 Booking Implementation

```typescript
// lib/duffel/book.ts

import { duffel } from './client';

interface GuestDetails {
    given_name: string;
    family_name: string;
    email: string;
    phone?: string;
}

interface BookingParams {
    rate_id: string;
    guests: GuestDetails[];
    payment?: {
        // If using Duffel Pay
        type: 'balance';
    } | {
        // If collecting card details
        type: 'card';
        card_token: string; // From Duffel.js tokenization
    };
    special_requests?: string;
}

export async function createBooking(params: BookingParams) {
    // Step 1: Create the order
    const order = await duffel.stays.bookings.create({
        rate_id: params.rate_id,
        guests: params.guests.map(g => ({
            given_name: g.given_name,
            family_name: g.family_name,
            email: g.email,
            phone_number: g.phone,
        })),
        payments: [
            params.payment?.type === 'balance'
                ? { type: 'balance', amount: undefined, currency: undefined }
                : { 
                    type: 'card',
                    token: params.payment?.card_token 
                  }
        ],
        metadata: {
            source: 'ai-hotel-assistant',
            timestamp: new Date().toISOString(),
        },
    });

    return {
        id: order.data.id,
        booking_reference: order.data.booking_reference,
        status: order.data.status,
        hotel: {
            name: order.data.accommodation.name,
            address: order.data.accommodation.location.address,
        },
        check_in: order.data.check_in_date,
        check_out: order.data.check_out_date,
        guests: order.data.guests,
        total_amount: order.data.total_amount,
        currency: order.data.total_currency,
        cancellation_policy: order.data.cancellation_timeline,
    };
}

export async function getBooking(bookingId: string) {
    const booking = await duffel.stays.bookings.get(bookingId);
    return booking.data;
}

export async function cancelBooking(bookingId: string) {
    const result = await duffel.stays.bookings.cancel(bookingId);
    return result.data;
}
```

### 3.4 Duffel Types

```typescript
// lib/duffel/types.ts

export interface NormalizedHotel {
    id: string;
    duffel_id: string;
    name: string;
    description: string;
    
    location: {
        address: string;
        city: string;
        country: string;
        latitude: number;
        longitude: number;
    };
    
    rating: {
        stars: number | null;
        review_score: number | null;
        review_count: number | null;
    };
    
    photos: Array<{
        url: string;
        caption: string | null;
    }>;
    
    amenities: string[];
    
    pricing: {
        total_amount: number;
        currency: string;
        nightly_rate: number;
    };
    
    cheapest_rate_id: string;
    
    rooms: Array<{
        id: string;
        name: string;
        description: string;
        beds: string;
        max_occupancy: number;
        rates: Array<{
            id: string;
            total_amount: number;
            currency: string;
            cancellation_policy: any;
            board_type: string;
        }>;
    }>;
}

export interface BookingResult {
    id: string;
    booking_reference: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    hotel: {
        name: string;
        address: string;
    };
    check_in: string;
    check_out: string;
    guests: any[];
    total_amount: string;
    currency: string;
    cancellation_policy: any;
}
```

---

## 4. Claude Integration & Prompt Engineering

### 4.1 System Prompt

```typescript
// lib/claude/prompts.ts

export const SYSTEM_PROMPT = `You are a helpful hotel booking assistant. Your job is to understand what kind of hotel accommodation the user is looking for and help them find and book the perfect stay.

## Your Capabilities

1. **Understand travel requests** - Parse natural language to extract:
   - Destination (city, neighborhood, or coordinates)
   - Dates (check-in and check-out)
   - Number of guests and rooms
   - Budget range
   - Preferences (vibe, amenities, location requirements)

2. **Present hotel options** - When showing results:
   - Explain WHY each hotel fits their criteria
   - Highlight relevant features for their specific needs
   - Be honest about tradeoffs (price vs location, etc.)
   - Present 3-5 options maximum to avoid overwhelming

3. **Complete bookings** - Guide users through:
   - Selecting a hotel
   - Providing guest details
   - Confirming the booking

## Response Format

You MUST respond with valid JSON in this exact structure:

{
    "intent": "search" | "clarify" | "select" | "book" | "info" | "other",
    "message": "Your natural language response to the user",
    "extracted_params": {
        // Only include fields that were mentioned or can be inferred
        "destination": "string or null",
        "check_in": "YYYY-MM-DD or null",
        "check_out": "YYYY-MM-DD or null", 
        "guests": "number or null",
        "rooms": "number or null",
        "budget_min": "number or null",
        "budget_max": "number or null",
        "currency": "USD/EUR/GBP/etc or null",
        "preferences": ["array", "of", "preferences"],
        "neighborhood": "string or null"
    },
    "missing_required": ["list", "of", "missing", "required", "fields"],
    "ready_to_search": true | false,
    "selected_hotel_id": "string or null",
    "action": "search" | "show_results" | "ask_clarification" | "collect_guest_info" | "confirm_booking" | null
}

## Required Fields for Search

Before searching, you MUST have:
- destination (city at minimum)
- check_in date
- check_out date

These can be assumed if not specified:
- guests: default to 1
- rooms: default to 1

## Handling Dates

- If user says "next weekend", calculate the actual dates
- If user says "April", ask for specific dates
- If user says "4 nights starting March 10", calculate check_out
- Always use YYYY-MM-DD format
- Current date for reference: ${new Date().toISOString().split('T')[0]}

## Handling Budget

- Convert all budgets to nightly rates
- If user says "under $200" without specifying per night/total, assume per night
- If user says "$800 for the trip" and you know the nights, calculate nightly
- Always capture the currency (default USD if not specified)

## Handling Preferences

Extract qualitative preferences into the preferences array:
- "boutique" → ["boutique"]
- "modern and clean" → ["modern", "clean"]  
- "close to restaurants" → ["walkable", "central"]
- "quiet area" → ["quiet", "residential"]
- "good for work" → ["business", "wifi", "desk"]

## Example Interactions

**User**: "I need a hotel in Tokyo"
**Response**: {
    "intent": "clarify",
    "message": "Tokyo sounds great! To find you the perfect spot, when are you planning to visit and how many nights will you be staying?",
    "extracted_params": {
        "destination": "Tokyo"
    },
    "missing_required": ["check_in", "check_out"],
    "ready_to_search": false,
    "action": "ask_clarification"
}

**User**: "I'm looking for a boutique hotel in Paris, March 15-18, under €150 per night"
**Response**: {
    "intent": "search",
    "message": "Perfect, I'll find boutique hotels in Paris for March 15-18 under €150/night. Give me just a moment...",
    "extracted_params": {
        "destination": "Paris",
        "check_in": "2025-03-15",
        "check_out": "2025-03-18",
        "guests": 1,
        "rooms": 1,
        "budget_max": 150,
        "currency": "EUR",
        "preferences": ["boutique"]
    },
    "missing_required": [],
    "ready_to_search": true,
    "action": "search"
}

## When Presenting Results

After a search, you'll receive hotel data. Present it conversationally:

**DO**:
- "Found 3 great options that fit your boutique vibe under €150..."
- Explain why each one matches their criteria
- Mention honest tradeoffs
- Ask which one interests them or if they want different options

**DON'T**:
- Just list hotels without context
- Overwhelm with every detail
- Make up information not in the data
- Be overly salesy

## When User Selects a Hotel

When user indicates they want to book (e.g., "book the first one", "I'll take Hotel X"):

{
    "intent": "select",
    "message": "Great choice! [Hotel name] is a solid pick because [reason]. To complete your booking, I'll need a few details...",
    "selected_hotel_id": "the_hotel_id",
    "action": "collect_guest_info"
}

## Handling Edge Cases

- If search returns no results: Suggest adjusting criteria
- If user asks about something you can't do: Be honest and redirect
- If user seems frustrated: Acknowledge and offer to start fresh
- If dates are in the past: Point this out gently

Remember: Be concise, helpful, and conversational. You're not a formal booking system — you're a knowledgeable friend helping them find a place to stay.`;
```

### 4.2 Intent Extraction

```typescript
// lib/claude/intent.ts

import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './prompts';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ParsedIntent {
    intent: 'search' | 'clarify' | 'select' | 'book' | 'info' | 'other';
    message: string;
    extracted_params: {
        destination?: string;
        check_in?: string;
        check_out?: string;
        guests?: number;
        rooms?: number;
        budget_min?: number;
        budget_max?: number;
        currency?: string;
        preferences?: string[];
        neighborhood?: string;
    };
    missing_required: string[];
    ready_to_search: boolean;
    selected_hotel_id?: string;
    action: 'search' | 'show_results' | 'ask_clarification' | 'collect_guest_info' | 'confirm_booking' | null;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function parseIntent(
    userMessage: string,
    conversationHistory: ConversationMessage[],
    currentState: any
): Promise<ParsedIntent> {
    
    // Build context with current state
    const stateContext = currentState ? `
Current conversation state:
- Stage: ${currentState.stage || 'initial'}
- Known preferences: ${JSON.stringify(currentState.preferences || {})}
- Last search results count: ${currentState.last_search_results?.length || 0}
` : '';

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT + '\n\n' + stateContext,
        messages: [
            ...conversationHistory.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            {
                role: 'user',
                content: userMessage,
            },
        ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
    }

    // Parse JSON response
    try {
        const parsed = JSON.parse(textContent.text);
        return parsed as ParsedIntent;
    } catch (e) {
        // If Claude didn't return valid JSON, wrap the response
        console.error('Failed to parse Claude response as JSON:', textContent.text);
        return {
            intent: 'other',
            message: textContent.text,
            extracted_params: {},
            missing_required: [],
            ready_to_search: false,
            action: null,
        };
    }
}
```

### 4.3 Response Generation (After Search)

```typescript
// lib/claude/response.ts

import Anthropic from '@anthropic-ai/sdk';
import { NormalizedHotel } from '../duffel/types';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateResultsResponse(
    hotels: NormalizedHotel[],
    userPreferences: any,
    originalQuery: string
): Promise<string> {
    
    const hotelSummaries = hotels.slice(0, 5).map((h, i) => `
Hotel ${i + 1}: ${h.name}
- Location: ${h.location.address}, ${h.location.city}
- Price: ${h.pricing.currency} ${h.pricing.nightly_rate.toFixed(0)}/night (${h.pricing.currency} ${h.pricing.total_amount.toFixed(0)} total)
- Rating: ${h.rating.stars ? `${h.rating.stars} stars` : 'Unrated'}${h.rating.review_score ? `, ${h.rating.review_score}/10 from ${h.rating.review_count} reviews` : ''}
- Amenities: ${h.amenities.slice(0, 5).join(', ')}
- ID: ${h.id}
`).join('\n');

    const prompt = `The user asked: "${originalQuery}"

Their preferences: ${JSON.stringify(userPreferences)}

Here are the search results:

${hotelSummaries}

Write a conversational response presenting these options. For each hotel:
1. Explain why it might fit their needs
2. Mention any relevant tradeoffs
3. Keep it concise but informative

End by asking which one interests them or if they'd like to see different options.

Important: Include the hotel IDs naturally so the system can track which one they select.
Format: Respond ONLY with the message text, no JSON wrapper.`;

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.type === 'text' ? textContent.text : 'I found some options but had trouble formatting them. Please try again.';
}

export async function generateBookingConfirmation(
    hotel: NormalizedHotel,
    bookingDetails: any
): Promise<string> {
    const prompt = `Generate a friendly booking confirmation message for:

Hotel: ${hotel.name}
Location: ${hotel.location.address}, ${hotel.location.city}
Check-in: ${bookingDetails.check_in}
Check-out: ${bookingDetails.check_out}
Total: ${bookingDetails.currency} ${bookingDetails.total_amount}
Confirmation #: ${bookingDetails.booking_reference}

Include:
1. Confirmation that booking is complete
2. Key details they need
3. What to expect (confirmation email, check-in time, etc.)
4. A warm send-off

Keep it concise and helpful. Format: Respond ONLY with the message text.`;

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.type === 'text' ? textContent.text : 'Your booking is confirmed!';
}
```

---

## 5. API Routes

### 5.1 Main Chat Endpoint

```typescript
// app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { parseIntent } from '@/lib/claude/intent';
import { generateResultsResponse } from '@/lib/claude/response';
import { searchHotels } from '@/lib/duffel/search';
import { createBooking } from '@/lib/duffel/book';
import { 
    getConversation, 
    createConversation, 
    updateConversation,
    addMessage 
} from '@/lib/supabase/conversations';
import { createBookingRecord } from '@/lib/supabase/bookings';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            message, 
            session_id, 
            conversation_id,
            guest_details,  // For booking step
            payment_token,  // For booking step
        } = body;

        if (!message || !session_id) {
            return NextResponse.json(
                { error: 'message and session_id are required' },
                { status: 400 }
            );
        }

        // Get or create conversation
        let conversation = conversation_id 
            ? await getConversation(conversation_id)
            : await createConversation(session_id);

        // Get conversation history
        const history = conversation.messages || [];

        // Parse user intent
        const intent = await parseIntent(
            message,
            history,
            conversation.state
        );

        // Store user message
        await addMessage(conversation.id, 'user', message);

        // Handle based on intent action
        let response: any = {
            message: intent.message,
            conversation_id: conversation.id,
        };

        // Merge extracted params into preferences
        const updatedPreferences = {
            ...conversation.preferences,
            ...intent.extracted_params,
        };

        switch (intent.action) {
            case 'search':
                // Execute hotel search
                const searchParams = buildSearchParams(updatedPreferences);
                const hotels = await searchHotels(searchParams);
                
                // Generate conversational response
                const resultsMessage = await generateResultsResponse(
                    hotels,
                    updatedPreferences,
                    message
                );

                // Update conversation state
                await updateConversation(conversation.id, {
                    state: {
                        ...conversation.state,
                        stage: 'showing_results',
                    },
                    preferences: updatedPreferences,
                    last_search_results: hotels,
                });

                response.message = resultsMessage;
                response.hotels = hotels.slice(0, 5);
                response.action = 'show_results';
                break;

            case 'collect_guest_info':
                // User selected a hotel, need guest details
                const selectedHotel = conversation.last_search_results?.find(
                    (h: any) => h.id === intent.selected_hotel_id
                );

                await updateConversation(conversation.id, {
                    state: {
                        ...conversation.state,
                        stage: 'collecting_info',
                        selected_hotel_id: intent.selected_hotel_id,
                    },
                    preferences: updatedPreferences,
                });

                response.action = 'collect_guest_info';
                response.selected_hotel = selectedHotel;
                response.required_fields = ['given_name', 'family_name', 'email', 'phone'];
                break;

            case 'confirm_booking':
                // Guest details provided, create booking
                if (!guest_details || !payment_token) {
                    response.message = "I need your guest details and payment information to complete the booking.";
                    response.action = 'collect_guest_info';
                    break;
                }

                const hotelToBook = conversation.last_search_results?.find(
                    (h: any) => h.id === conversation.state.selected_hotel_id
                );

                if (!hotelToBook) {
                    response.message = "I couldn't find the selected hotel. Let's start fresh - what are you looking for?";
                    response.action = 'ask_clarification';
                    break;
                }

                // Create the booking via Duffel
                const booking = await createBooking({
                    rate_id: hotelToBook.cheapest_rate_id,
                    guests: [guest_details],
                    payment: {
                        type: 'card',
                        card_token: payment_token,
                    },
                });

                // Store booking in our database
                await createBookingRecord({
                    conversation_id: conversation.id,
                    duffel_booking_id: booking.id,
                    hotel_name: hotelToBook.name,
                    hotel_id: hotelToBook.id,
                    check_in: updatedPreferences.check_in,
                    check_out: updatedPreferences.check_out,
                    guest_name: `${guest_details.given_name} ${guest_details.family_name}`,
                    guest_email: guest_details.email,
                    guest_phone: guest_details.phone,
                    total_amount: hotelToBook.pricing.total_amount,
                    currency: hotelToBook.pricing.currency,
                    duffel_response: booking,
                });

                await updateConversation(conversation.id, {
                    state: {
                        ...conversation.state,
                        stage: 'complete',
                    },
                });

                response.action = 'booking_complete';
                response.booking = booking;
                break;

            case 'ask_clarification':
            default:
                // Just update preferences and continue conversation
                await updateConversation(conversation.id, {
                    preferences: updatedPreferences,
                });
                response.action = 'continue';
                break;
        }

        // Store assistant response
        await addMessage(conversation.id, 'assistant', response.message);

        return NextResponse.json(response);

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

function buildSearchParams(preferences: any) {
    return {
        location: {
            city: preferences.destination,
            ...(preferences.neighborhood && { area: preferences.neighborhood }),
        },
        check_in: preferences.check_in,
        check_out: preferences.check_out,
        guests: preferences.guests || 1,
        rooms: preferences.rooms || 1,
        budget: (preferences.budget_min || preferences.budget_max) ? {
            min: preferences.budget_min,
            max: preferences.budget_max,
            currency: preferences.currency || 'USD',
        } : undefined,
    };
}
```

### 5.2 Webhook Handler

```typescript
// app/api/webhooks/duffel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/supabase/bookings';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('duffel-signature');
        
        // Verify webhook signature
        if (!verifySignature(body, signature)) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);

        switch (event.type) {
            case 'booking.confirmed':
                await updateBookingStatus(event.data.id, 'confirmed');
                break;
            
            case 'booking.cancelled':
                await updateBookingStatus(event.data.id, 'cancelled');
                break;
            
            case 'booking.amended':
                // Handle booking modifications
                break;
            
            default:
                console.log('Unhandled webhook event:', event.type);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

function verifySignature(payload: string, signature: string | null): boolean {
    if (!signature || !process.env.DUFFEL_WEBHOOK_SECRET) {
        return false;
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', process.env.DUFFEL_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
```

---

## 6. Frontend Components

### 6.1 Chat Container

```typescript
// components/chat/ChatContainer.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { HotelList } from '../hotels/HotelList';
import { GuestForm } from '../booking/GuestForm';
import { useChat } from '@/hooks/useChat';

export function ChatContainer() {
    const {
        messages,
        isLoading,
        hotels,
        currentAction,
        selectedHotel,
        sendMessage,
        selectHotel,
        submitGuestDetails,
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto">
            {/* Header */}
            <header className="p-4 border-b">
                <h1 className="text-xl font-semibold">Hotel Assistant</h1>
                <p className="text-sm text-gray-500">
                    Tell me what you're looking for
                </p>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <MessageList messages={messages} />
                
                {/* Show hotels when available */}
                {hotels && hotels.length > 0 && currentAction === 'show_results' && (
                    <HotelList 
                        hotels={hotels} 
                        onSelect={selectHotel}
                    />
                )}

                {/* Show guest form when collecting info */}
                {currentAction === 'collect_guest_info' && selectedHotel && (
                    <GuestForm
                        hotel={selectedHotel}
                        onSubmit={submitGuestDetails}
                    />
                )}

                {isLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-pulse">●</div>
                        <span>Thinking...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <InputBar 
                onSend={sendMessage} 
                disabled={isLoading || currentAction === 'collect_guest_info'}
            />
        </div>
    );
}
```

### 6.2 Chat Hook

```typescript
// hooks/useChat.ts

'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Hotel {
    id: string;
    name: string;
    // ... other hotel fields
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hotels, setHotels] = useState<Hotel[] | null>(null);
    const [currentAction, setCurrentAction] = useState<string | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [sessionId] = useState(() => {
        // Get or create session ID from localStorage
        if (typeof window !== 'undefined') {
            let id = localStorage.getItem('session_id');
            if (!id) {
                id = uuidv4();
                localStorage.setItem('session_id', id);
            }
            return id;
        }
        return uuidv4();
    });

    // Initial greeting
    useEffect(() => {
        setMessages([{
            id: uuidv4(),
            role: 'assistant',
            content: "Hi! I'm here to help you find the perfect hotel. Where are you thinking of traveling to?",
            timestamp: new Date(),
        }]);
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        // Add user message
        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    session_id: sessionId,
                    conversation_id: conversationId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Update conversation ID
            if (data.conversation_id) {
                setConversationId(data.conversation_id);
            }

            // Add assistant response
            const assistantMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Handle action-specific updates
            setCurrentAction(data.action);
            
            if (data.hotels) {
                setHotels(data.hotels);
            }

            if (data.selected_hotel) {
                setSelectedHotel(data.selected_hotel);
            }

            if (data.action === 'booking_complete' && data.booking) {
                // Could redirect to confirmation page or show inline
                setHotels(null);
                setSelectedHotel(null);
            }

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: "Sorry, I ran into an issue. Could you try again?",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, conversationId]);

    const selectHotel = useCallback(async (hotelId: string) => {
        // Send selection as a message
        const hotel = hotels?.find(h => h.id === hotelId);
        if (hotel) {
            await sendMessage(`I'd like to book ${hotel.name}`);
        }
    }, [hotels, sendMessage]);

    const submitGuestDetails = useCallback(async (details: any, paymentToken: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'Complete my booking',
                    session_id: sessionId,
                    conversation_id: conversationId,
                    guest_details: details,
                    payment_token: paymentToken,
                }),
            });

            const data = await response.json();

            const confirmationMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, confirmationMessage]);
            
            setCurrentAction(data.action);
            
            if (data.action === 'booking_complete') {
                setHotels(null);
                setSelectedHotel(null);
            }

        } catch (error) {
            console.error('Booking error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, conversationId]);

    return {
        messages,
        isLoading,
        hotels,
        currentAction,
        selectedHotel,
        sendMessage,
        selectHotel,
        submitGuestDetails,
    };
}
```

### 6.3 Hotel Card

```typescript
// components/hotels/HotelCard.tsx

'use client';

import Image from 'next/image';
import { NormalizedHotel } from '@/lib/duffel/types';

interface HotelCardProps {
    hotel: NormalizedHotel;
    index: number;
    onSelect: (id: string) => void;
}

export function HotelCard({ hotel, index, onSelect }: HotelCardProps) {
    return (
        <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative h-48 bg-gray-200">
                {hotel.photos[0] && (
                    <Image
                        src={hotel.photos[0].url}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    #{index + 1}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg">{hotel.name}</h3>
                        <p className="text-sm text-gray-600">
                            {hotel.location.address}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold">
                            {hotel.pricing.currency} {hotel.pricing.nightly_rate.toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">per night</p>
                    </div>
                </div>

                {/* Rating */}
                {hotel.rating.review_score && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-medium">
                            {hotel.rating.review_score.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600">
                            {hotel.rating.review_count} reviews
                        </span>
                    </div>
                )}

                {/* Amenities */}
                <div className="mt-3 flex flex-wrap gap-1">
                    {hotel.amenities.slice(0, 4).map((amenity, i) => (
                        <span 
                            key={i}
                            className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600"
                        >
                            {amenity}
                        </span>
                    ))}
                </div>

                {/* Total price */}
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                        Total: {hotel.pricing.currency} {hotel.pricing.total_amount.toFixed(0)}
                    </span>
                    <button
                        onClick={() => onSelect(hotel.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Book This
                    </button>
                </div>
            </div>
        </div>
    );
}
```

### 6.4 Guest Form

```typescript
// components/booking/GuestForm.tsx

'use client';

import { useState } from 'react';
import { NormalizedHotel } from '@/lib/duffel/types';

interface GuestFormProps {
    hotel: NormalizedHotel;
    onSubmit: (details: GuestDetails, paymentToken: string) => void;
}

interface GuestDetails {
    given_name: string;
    family_name: string;
    email: string;
    phone: string;
}

export function GuestForm({ hotel, onSubmit }: GuestFormProps) {
    const [details, setDetails] = useState<GuestDetails>({
        given_name: '',
        family_name: '',
        email: '',
        phone: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            // In production, you'd use Duffel's card tokenization here
            // For MVP, you might use Stripe Elements or Duffel Pay
            
            // Placeholder for payment tokenization
            const paymentToken = await tokenizePayment();
            
            onSubmit(details, paymentToken);
        } catch (err: any) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-4">Complete Your Booking</h3>
            
            {/* Booking Summary */}
            <div className="bg-white p-3 rounded border mb-4">
                <p className="font-medium">{hotel.name}</p>
                <p className="text-sm text-gray-600">{hotel.location.address}</p>
                <p className="mt-2 font-semibold">
                    Total: {hotel.pricing.currency} {hotel.pricing.total_amount.toFixed(2)}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            required
                            value={details.given_name}
                            onChange={e => setDetails(d => ({ ...d, given_name: e.target.value }))}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            required
                            value={details.family_name}
                            onChange={e => setDetails(d => ({ ...d, family_name: e.target.value }))}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        required
                        value={details.email}
                        onChange={e => setDetails(d => ({ ...d, email: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Phone
                    </label>
                    <input
                        type="tel"
                        value={details.phone}
                        onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>

                {/* Payment Section */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-1">
                        Card Details
                    </label>
                    {/* In production, embed Stripe Elements or Duffel Pay here */}
                    <div id="card-element" className="border rounded-lg p-3 bg-white">
                        {/* Stripe/Duffel card element mounts here */}
                        <p className="text-sm text-gray-500">
                            Card input will be embedded here
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : `Pay ${hotel.pricing.currency} ${hotel.pricing.total_amount.toFixed(2)}`}
                </button>

                <p className="text-xs text-gray-500 text-center">
                    By booking, you agree to the hotel's terms and cancellation policy.
                </p>
            </form>
        </div>
    );
}

// Placeholder - implement with actual payment provider
async function tokenizePayment(): Promise<string> {
    // This would use Stripe.js or Duffel's payment tokenization
    // Returns a token that represents the card without exposing details
    return 'tok_test_placeholder';
}
```

---

## 7. Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key

# Duffel
DUFFEL_ACCESS_TOKEN=duffel_test_your-token
DUFFEL_WEBHOOK_SECRET=whsec_your-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
```

---

## 8. Testing Strategy

### 8.1 Test Scenarios

```typescript
// __tests__/chat.test.ts

describe('Chat Intent Parsing', () => {
    test('extracts destination from simple query', async () => {
        const result = await parseIntent('I need a hotel in Tokyo', [], {});
        expect(result.extracted_params.destination).toBe('Tokyo');
        expect(result.ready_to_search).toBe(false);
        expect(result.missing_required).toContain('check_in');
    });

    test('parses complete search query', async () => {
        const result = await parseIntent(
            'Boutique hotel in Paris, March 15-18, under €150/night',
            [],
            {}
        );
        expect(result.extracted_params.destination).toBe('Paris');
        expect(result.extracted_params.check_in).toBe('2025-03-15');
        expect(result.extracted_params.check_out).toBe('2025-03-18');
        expect(result.extracted_params.budget_max).toBe(150);
        expect(result.extracted_params.currency).toBe('EUR');
        expect(result.ready_to_search).toBe(true);
    });

    test('handles relative dates', async () => {
        const result = await parseIntent(
            'Hotel in NYC next weekend',
            [],
            {}
        );
        expect(result.extracted_params.destination).toBe('New York');
        // Check that dates are calculated correctly
    });

    test('accumulates preferences across messages', async () => {
        const history = [
            { role: 'user', content: 'I need a hotel in London' },
            { role: 'assistant', content: 'When are you planning to visit?' },
            { role: 'user', content: 'April 10-14' },
        ];
        const result = await parseIntent(
            'Budget is around £200/night',
            history,
            { preferences: { destination: 'London', check_in: '2025-04-10', check_out: '2025-04-14' } }
        );
        expect(result.ready_to_search).toBe(true);
    });
});

describe('Hotel Search', () => {
    test('returns hotels for valid search', async () => {
        const hotels = await searchHotels({
            location: { city: 'Paris' },
            check_in: '2025-03-15',
            check_out: '2025-03-18',
            guests: 1,
            rooms: 1,
        });
        expect(hotels.length).toBeGreaterThan(0);
        expect(hotels[0]).toHaveProperty('name');
        expect(hotels[0]).toHaveProperty('pricing');
    });

    test('filters by budget', async () => {
        const hotels = await searchHotels({
            location: { city: 'Paris' },
            check_in: '2025-03-15',
            check_out: '2025-03-18',
            guests: 1,
            rooms: 1,
            budget: { max: 150, currency: 'EUR' },
        });
        hotels.forEach(hotel => {
            expect(hotel.pricing.nightly_rate).toBeLessThanOrEqual(150);
        });
    });
});

describe('Booking Flow', () => {
    test('creates booking with valid details', async () => {
        // Use Duffel test mode
        const booking = await createBooking({
            rate_id: 'test_rate_id',
            guests: [{
                given_name: 'John',
                family_name: 'Doe',
                email: 'john@test.com',
            }],
            payment: { type: 'balance' },
        });
        expect(booking.status).toBe('confirmed');
        expect(booking.booking_reference).toBeDefined();
    });
});
```

### 8.2 Manual Test Script

```markdown
## Manual Testing Checklist

### Basic Conversation Flow
- [ ] Fresh page load shows greeting
- [ ] User message appears in chat
- [ ] Loading indicator shows during processing
- [ ] Assistant response appears
- [ ] Conversation scrolls to bottom

### Search Flow
- [ ] "Hotel in Tokyo" → asks for dates
- [ ] Providing dates → triggers search
- [ ] Results display as cards
- [ ] Price shows correctly (per night + total)

### Booking Flow
- [ ] Click "Book This" on hotel card
- [ ] Guest form appears
- [ ] Form validation works
- [ ] Payment field accepts input (test mode)
- [ ] Booking confirmation shows

### Edge Cases
- [ ] Unknown city → helpful error
- [ ] Dates in past → correction prompt
- [ ] No results → suggestion to adjust criteria
- [ ] Network error → graceful failure message

### Mobile
- [ ] Chat interface usable on mobile
- [ ] Cards stack vertically
- [ ] Form fields accessible
- [ ] Keyboard doesn't obscure input
```

---

## 9. Deployment

### 9.1 Vercel Configuration

```json
// vercel.json
{
    "functions": {
        "app/api/**/*.ts": {
            "maxDuration": 30
        }
    },
    "env": {
        "ANTHROPIC_API_KEY": "@anthropic-api-key",
        "DUFFEL_ACCESS_TOKEN": "@duffel-access-token",
        "DUFFEL_WEBHOOK_SECRET": "@duffel-webhook-secret",
        "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
    }
}
```

### 9.2 Launch Checklist

```markdown
## Pre-Launch

### Infrastructure
- [ ] Supabase project created (production)
- [ ] Database migrations run
- [ ] RLS policies enabled
- [ ] Duffel production access requested
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Custom domain configured (optional)

### Testing
- [ ] All test scenarios pass
- [ ] Sandbox booking flow works end-to-end
- [ ] Mobile responsive confirmed
- [ ] Error handling verified

### Legal/Compliance
- [ ] Privacy policy page
- [ ] Terms of service
- [ ] Cookie consent (if needed)
- [ ] Duffel merchant agreement signed

### Analytics
- [ ] Vercel Analytics enabled
- [ ] PostHog (or similar) configured
- [ ] Error tracking (Sentry) set up

### Go-Live
- [ ] Switch Duffel to production mode
- [ ] Verify production API keys
- [ ] Test real booking (small amount, cancel)
- [ ] Monitor first 24 hours

## Post-Launch

- [ ] Monitor error rates
- [ ] Watch for stuck conversations
- [ ] Track conversion funnel
- [ ] Gather user feedback
```

---

## 10. Future Enhancements (Post-MVP)

### Phase 2
- User accounts and saved preferences
- Booking history
- Price alerts / drop notifications
- Email confirmations from your domain
- Multi-room bookings

### Phase 3
- Flight bundling
- Loyalty program integration
- Price comparison (check direct rates)
- Modification / cancellation handling
- Mobile app (React Native)

### Phase 4
- Fintech products (price freeze, flexibility)
- B2B API for other apps
- White-label solution
- Affiliate partnerships

---

## 11. Map Feature

### 11.1 Overview

Display hotel location and nearby attractions on an interactive map. Uses Leaflet + OpenStreetMap (completely free, no API key required).

### 11.2 Dependencies

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### 11.3 Map Component

```typescript
// components/map/HotelMap.tsx

'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const hotelIcon = new Icon({
    iconUrl: '/markers/hotel.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const attractionIcon = new Icon({
    iconUrl: '/markers/attraction.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
});

interface Location {
    lat: number;
    lng: number;
    name: string;
    type?: string;
}

interface HotelMapProps {
    hotel: Location;
    attractions?: Location[];
    className?: string;
}

export function HotelMap({ hotel, attractions = [], className = 'h-64' }: HotelMapProps) {
    return (
        <MapContainer 
            center={[hotel.lat, hotel.lng]} 
            zoom={14} 
            className={`rounded-lg ${className}`}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Hotel marker */}
            <Marker position={[hotel.lat, hotel.lng]} icon={hotelIcon}>
                <Popup>
                    <strong>{hotel.name}</strong>
                    <br />
                    Your hotel
                </Popup>
            </Marker>
            
            {/* Attraction markers */}
            {attractions.map((attraction, index) => (
                <Marker 
                    key={index} 
                    position={[attraction.lat, attraction.lng]} 
                    icon={attractionIcon}
                >
                    <Popup>
                        <strong>{attraction.name}</strong>
                        {attraction.type && <><br />{attraction.type}</>}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
```

### 11.4 Dynamic Import (Required for Next.js)

Leaflet doesn't work with SSR, so use dynamic import:

```typescript
// components/map/index.tsx

import dynamic from 'next/dynamic';

export const HotelMap = dynamic(
    () => import('./HotelMap').then(mod => mod.HotelMap),
    { 
        ssr: false,
        loading: () => (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-400">Loading map...</span>
            </div>
        )
    }
);
```

### 11.5 Integration with Hotel Results

```typescript
// In HotelCard.tsx or HotelDetails.tsx

import { HotelMap } from '@/components/map';

// Inside the component:
<HotelMap 
    hotel={{
        lat: hotel.location.latitude,
        lng: hotel.location.longitude,
        name: hotel.name
    }}
/>
```

### 11.6 Adding Attractions (Optional Enhancement)

Attractions can come from three sources:

**Option A: Claude's Knowledge (Free)**

When user mentions preferences, Claude can suggest nearby attractions from its knowledge:

```typescript
const ATTRACTIONS_PROMPT = `Based on the hotel location and user preferences, suggest 3-5 nearby attractions.

Hotel: {hotelName}
Location: {neighborhood}, {city}
User preferences: {preferences}

Return JSON:
{
    "attractions": [
        {
            "name": "Shibuya Crossing",
            "type": "Landmark",
            "lat": 35.6595,
            "lng": 139.7004,
            "walk_time": "5 min",
            "why": "Iconic Tokyo experience, right outside the hotel"
        }
    ]
}`;
```

**Option B: Foursquare Places API (50 free calls/day)**

```typescript
// lib/places/foursquare.ts

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

interface PlaceResult {
    name: string;
    lat: number;
    lng: number;
    category: string;
}

export async function getNearbyPlaces(
    lat: number, 
    lng: number, 
    categories: string[] = ['food', 'attractions']
): Promise<PlaceResult[]> {
    const response = await fetch(
        `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=1000&categories=${categories.join(',')}`,
        {
            headers: {
                'Authorization': FOURSQUARE_API_KEY!,
                'Accept': 'application/json'
            }
        }
    );
    
    const data = await response.json();
    
    return data.results.map((place: any) => ({
        name: place.name,
        lat: place.geocodes.main.latitude,
        lng: place.geocodes.main.longitude,
        category: place.categories[0]?.name || 'Place'
    }));
}
```

**Option C: Google Places API ($200/month free credit)**

```typescript
// lib/places/google.ts

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function getNearbyPlaces(
    lat: number,
    lng: number,
    type: string = 'tourist_attraction'
): Promise<PlaceResult[]> {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${type}&key=${GOOGLE_PLACES_API_KEY}`
    );
    
    const data = await response.json();
    
    return data.results.slice(0, 5).map((place: any) => ({
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        category: place.types[0]
    }));
}
```

### 11.7 Recommended Approach

For MVP, use Claude's knowledge only (free). Add places API later if users request more detailed nearby info.

```typescript
// Only fetch attractions when user explicitly asks
if (userMessage.includes('nearby') || userMessage.includes('around the hotel')) {
    const attractions = await getAttractionsFromClaude(hotel, preferences);
    response.attractions = attractions;
}
```

---

## 12. Trip Planner / Itinerary Generator

### 12.1 Overview

Generate professional day-by-day itineraries that make users feel like they have a personal travel agent. This is primarily prompt engineering — Claude already has excellent destination knowledge.

### 12.2 Database Schema Update

```sql
-- Add itinerary storage to bookings
ALTER TABLE bookings ADD COLUMN itinerary JSONB;

-- Or create separate table for more flexibility
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    booking_id UUID REFERENCES bookings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Trip details
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- The generated itinerary
    content JSONB NOT NULL,
    -- {
    --   "days": [...],
    --   "packing_tips": [...],
    --   "local_tips": [...],
    --   "emergency_info": {...}
    -- }
    
    -- User modifications
    user_edits JSONB DEFAULT '[]',
    
    -- Generation metadata
    preferences_used JSONB,
    generation_model TEXT
);

CREATE INDEX idx_itineraries_booking ON itineraries(booking_id);
CREATE INDEX idx_itineraries_conversation ON itineraries(conversation_id);
```

### 12.3 Itinerary Types

```typescript
// types/itinerary.ts

export interface ItineraryItem {
    id: string;
    time: string;              // "9:00 AM"
    activity: string;          // "Visit Senso-ji Temple"
    location: string;          // "Asakusa"
    duration: string;          // "2 hours"
    notes?: string;            // "Arrive early to avoid crowds"
    coordinates?: {
        lat: number;
        lng: number;
    };
    category: 'transport' | 'activity' | 'food' | 'rest' | 'checkin' | 'checkout';
    cost_estimate?: string;    // "Free" or "$20-30"
    booking_required?: boolean;
    booking_url?: string;
    completed?: boolean;       // For user tracking
}

export interface ItineraryDay {
    date: string;              // "2025-04-10"
    day_number: number;        // 1
    day_of_week: string;       // "Thursday"
    theme: string;             // "Arrive & Explore Shibuya"
    items: ItineraryItem[];
    weather_note?: string;     // "Expect cherry blossoms in full bloom"
}

export interface Itinerary {
    id: string;
    destination: string;
    hotel: {
        name: string;
        neighborhood: string;
        coordinates: { lat: number; lng: number };
    };
    dates: {
        start: string;
        end: string;
        nights: number;
    };
    days: ItineraryDay[];
    packing_tips: string[];
    local_tips: string[];
    emergency_info: {
        embassy?: string;
        emergency_number: string;
        hospital_nearby?: string;
    };
    generated_at: string;
}
```

### 12.4 Generation Prompt

```typescript
// lib/claude/prompts.ts

export const ITINERARY_PROMPT = `Generate a detailed day-by-day travel itinerary.

## Trip Details
- Destination: {destination}
- Hotel: {hotelName} in {neighborhood}
- Coordinates: {hotelLat}, {hotelLng}
- Dates: {checkIn} to {checkOut} ({nights} nights)
- Traveler: {travelerType} (e.g., solo, couple, family)
- Preferences: {preferences}
- Budget level: {budgetLevel}

## Requirements

Create a realistic, practical itinerary that:
1. Accounts for jet lag on day 1 (start slow if long-haul)
2. Groups activities by area to minimize transit
3. Includes specific restaurant recommendations for each meal
4. Balances must-see spots with local hidden gems
5. Includes realistic travel times between locations
6. Has one "flexible/rest" slot per day
7. Notes which activities need advance booking
8. Considers typical opening hours and best times to visit

## Response Format

Return valid JSON matching this structure:
{
    "days": [
        {
            "date": "2025-04-10",
            "day_number": 1,
            "day_of_week": "Thursday",
            "theme": "Arrive & Settle Into Shibuya",
            "items": [
                {
                    "id": "d1-1",
                    "time": "3:00 PM",
                    "activity": "Check in to hotel",
                    "location": "Sequence Miyashita Park",
                    "duration": "30 min",
                    "notes": "Rooms usually ready by 3pm. Store luggage if early.",
                    "category": "checkin",
                    "coordinates": { "lat": 35.6595, "lng": 139.6983 }
                },
                {
                    "id": "d1-2",
                    "time": "4:00 PM",
                    "activity": "Walk Miyashita Park rooftop",
                    "location": "Above your hotel",
                    "duration": "45 min",
                    "notes": "Great for getting bearings. Skate park, cafes, Shibuya views.",
                    "category": "activity",
                    "cost_estimate": "Free",
                    "coordinates": { "lat": 35.6598, "lng": 139.6988 }
                },
                {
                    "id": "d1-3",
                    "time": "6:00 PM",
                    "activity": "Shibuya Crossing at golden hour",
                    "location": "Shibuya Station",
                    "duration": "30 min",
                    "notes": "Best viewed from Starbucks above (get a drink for access) or Shibuya Sky if you want the splurge.",
                    "category": "activity",
                    "cost_estimate": "Free (or $20 for Shibuya Sky)",
                    "coordinates": { "lat": 35.6595, "lng": 139.7004 }
                },
                {
                    "id": "d1-4",
                    "time": "7:00 PM",
                    "activity": "Dinner at Uobei",
                    "location": "Shibuya, 5 min walk",
                    "duration": "1 hour",
                    "notes": "High-tech conveyor belt sushi. Order via tablet, plates zoom to you. Fun, cheap, good.",
                    "category": "food",
                    "cost_estimate": "$15-25",
                    "coordinates": { "lat": 35.6593, "lng": 139.6989 }
                },
                {
                    "id": "d1-5",
                    "time": "8:30 PM",
                    "activity": "Explore Nonbei Yokocho",
                    "location": "Behind Shibuya Station",
                    "duration": "1-2 hours",
                    "notes": "Tiny alley of 40+ bars. Most seat 5-8 people. Just pick one that looks interesting.",
                    "category": "activity",
                    "cost_estimate": "$10-30",
                    "coordinates": { "lat": 35.6587, "lng": 139.6984 }
                }
            ]
        }
    ],
    "packing_tips": [
        "Comfortable walking shoes — you'll average 15,000+ steps/day",
        "Portable WiFi or SIM card (rent at airport)",
        "Small day bag for temple visits (no large backpacks)",
        "Cash for small restaurants (many don't take cards)"
    ],
    "local_tips": [
        "Convenience stores (7-Eleven, Lawson) have great food — don't overlook them",
        "Download Suica/Pasmo app for transit payments",
        "Restaurants often have plastic food displays outside — point if language is a barrier",
        "Tipping is not customary and can cause confusion"
    ],
    "emergency_info": {
        "emergency_number": "110 (police), 119 (fire/ambulance)",
        "embassy": "US Embassy: 03-3224-5000",
        "hospital_nearby": "Tokyo Medical Center, Shibuya (10 min taxi)"
    }
}

Be specific with restaurant and activity names. Don't say "find a local restaurant" — name one.
Include coordinates for all locations so they can be shown on a map.`;
```

### 12.5 Generation Function

```typescript
// lib/itinerary/generate.ts

import Anthropic from '@anthropic-ai/sdk';
import { ITINERARY_PROMPT } from '../claude/prompts';
import { Itinerary, ItineraryDay } from '@/types/itinerary';
import { NormalizedHotel } from '../duffel/types';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateItineraryParams {
    hotel: NormalizedHotel;
    checkIn: string;
    checkOut: string;
    preferences: {
        travelerType?: string;      // "solo", "couple", "family"
        interests?: string[];       // ["food", "history", "nightlife"]
        pace?: string;              // "relaxed", "moderate", "packed"
        budgetLevel?: string;       // "budget", "moderate", "luxury"
    };
}

export async function generateItinerary(params: GenerateItineraryParams): Promise<Itinerary> {
    const { hotel, checkIn, checkOut, preferences } = params;
    
    const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const prompt = ITINERARY_PROMPT
        .replace('{destination}', hotel.location.city)
        .replace('{hotelName}', hotel.name)
        .replace('{neighborhood}', hotel.location.address)
        .replace('{hotelLat}', hotel.location.latitude.toString())
        .replace('{hotelLng}', hotel.location.longitude.toString())
        .replace('{checkIn}', checkIn)
        .replace('{checkOut}', checkOut)
        .replace('{nights}', nights.toString())
        .replace('{travelerType}', preferences.travelerType || 'solo traveler')
        .replace('{preferences}', preferences.interests?.join(', ') || 'general sightseeing')
        .replace('{budgetLevel}', preferences.budgetLevel || 'moderate');

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
        throw new Error('No response from Claude');
    }

    // Parse JSON response
    const itineraryData = JSON.parse(textContent.text);

    return {
        id: crypto.randomUUID(),
        destination: hotel.location.city,
        hotel: {
            name: hotel.name,
            neighborhood: hotel.location.address,
            coordinates: {
                lat: hotel.location.latitude,
                lng: hotel.location.longitude,
            },
        },
        dates: {
            start: checkIn,
            end: checkOut,
            nights,
        },
        ...itineraryData,
        generated_at: new Date().toISOString(),
    };
}
```

### 12.6 API Endpoint

```typescript
// app/api/itinerary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/itinerary/generate';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { 
            conversationId,
            bookingId,
            hotel,
            checkIn,
            checkOut,
            preferences
        } = await request.json();

        // Generate the itinerary
        const itinerary = await generateItinerary({
            hotel,
            checkIn,
            checkOut,
            preferences,
        });

        // Store in database
        const supabase = createClient();
        
        if (bookingId) {
            // Update booking with itinerary
            await supabase
                .from('bookings')
                .update({ itinerary })
                .eq('id', bookingId);
        } else {
            // Store as standalone itinerary
            await supabase
                .from('itineraries')
                .insert({
                    conversation_id: conversationId,
                    destination: itinerary.destination,
                    start_date: checkIn,
                    end_date: checkOut,
                    content: itinerary,
                    preferences_used: preferences,
                });
        }

        return NextResponse.json({ itinerary });

    } catch (error) {
        console.error('Itinerary generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate itinerary' },
            { status: 500 }
        );
    }
}
```

### 12.7 Itinerary Display Component

```typescript
// components/itinerary/ItineraryView.tsx

'use client';

import { useState } from 'react';
import { Itinerary, ItineraryDay, ItineraryItem } from '@/types/itinerary';
import { HotelMap } from '@/components/map';

interface ItineraryViewProps {
    itinerary: Itinerary;
    onItemToggle?: (dayIndex: number, itemId: string) => void;
}

export function ItineraryView({ itinerary, onItemToggle }: ItineraryViewProps) {
    const [expandedDay, setExpandedDay] = useState<number>(0);
    const [showMap, setShowMap] = useState(false);

    // Collect all locations for map
    const allLocations = itinerary.days.flatMap(day => 
        day.items
            .filter(item => item.coordinates)
            .map(item => ({
                lat: item.coordinates!.lat,
                lng: item.coordinates!.lng,
                name: item.activity,
                type: item.category
            }))
    );

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <h2 className="text-2xl font-bold">{itinerary.destination}</h2>
                <p className="opacity-90">
                    {itinerary.dates.start} — {itinerary.dates.end} · {itinerary.dates.nights} nights
                </p>
                <p className="text-sm opacity-75 mt-1">
                    📍 {itinerary.hotel.name}, {itinerary.hotel.neighborhood}
                </p>
            </div>

            {/* Map Toggle */}
            <div className="p-4 border-b">
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    {showMap ? '▼ Hide Map' : '▶ Show All Locations on Map'}
                </button>
                {showMap && (
                    <div className="mt-4">
                        <HotelMap
                            hotel={{
                                lat: itinerary.hotel.coordinates.lat,
                                lng: itinerary.hotel.coordinates.lng,
                                name: itinerary.hotel.name
                            }}
                            attractions={allLocations}
                            className="h-80"
                        />
                    </div>
                )}
            </div>

            {/* Days */}
            <div className="divide-y">
                {itinerary.days.map((day, dayIndex) => (
                    <DaySection
                        key={day.date}
                        day={day}
                        isExpanded={expandedDay === dayIndex}
                        onToggle={() => setExpandedDay(
                            expandedDay === dayIndex ? -1 : dayIndex
                        )}
                        onItemToggle={(itemId) => onItemToggle?.(dayIndex, itemId)}
                    />
                ))}
            </div>

            {/* Tips Section */}
            <div className="p-6 bg-gray-50">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-2">🎒 Packing Tips</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {itinerary.packing_tips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">💡 Local Tips</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {itinerary.local_tips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Emergency Info */}
            <div className="p-4 bg-red-50 text-sm">
                <h4 className="font-semibold text-red-800">Emergency Info</h4>
                <p className="text-red-700">
                    📞 {itinerary.emergency_info.emergency_number}
                    {itinerary.emergency_info.hospital_nearby && (
                        <> · 🏥 {itinerary.emergency_info.hospital_nearby}</>
                    )}
                </p>
            </div>
        </div>
    );
}

function DaySection({ 
    day, 
    isExpanded, 
    onToggle,
    onItemToggle 
}: { 
    day: ItineraryDay;
    isExpanded: boolean;
    onToggle: () => void;
    onItemToggle: (itemId: string) => void;
}) {
    return (
        <div>
            {/* Day Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {day.day_number}
                    </span>
                    <div className="text-left">
                        <div className="font-medium">{day.theme}</div>
                        <div className="text-sm text-gray-500">
                            {day.day_of_week}, {day.date}
                        </div>
                    </div>
                </div>
                <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                </span>
            </button>

            {/* Day Items */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {day.items.map((item) => (
                        <ItineraryItemCard 
                            key={item.id} 
                            item={item}
                            onToggle={() => onItemToggle(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ItineraryItemCard({ 
    item,
    onToggle 
}: { 
    item: ItineraryItem;
    onToggle: () => void;
}) {
    const categoryIcons: Record<string, string> = {
        transport: '🚃',
        activity: '📍',
        food: '🍽️',
        rest: '☕',
        checkin: '🏨',
        checkout: '👋',
    };

    return (
        <div className={`flex gap-3 p-3 rounded-lg border ${
            item.completed ? 'bg-gray-50 opacity-60' : 'bg-white'
        }`}>
            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 ${
                    item.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300'
                }`}
            >
                {item.completed && '✓'}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                        {item.time}
                    </span>
                    <span>{categoryIcons[item.category] || '📍'}</span>
                    <span className={`font-medium ${item.completed ? 'line-through' : ''}`}>
                        {item.activity}
                    </span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                    {item.location} · {item.duration}
                    {item.cost_estimate && ` · ${item.cost_estimate}`}
                </div>
                {item.notes && (
                    <p className="text-sm text-gray-600 mt-1 italic">
                        {item.notes}
                    </p>
                )}
                {item.booking_required && (
                    <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        ⚠️ Book in advance
                    </span>
                )}
            </div>
        </div>
    );
}
```

### 12.8 Export/Print Functionality

```typescript
// components/itinerary/ItineraryExport.tsx

'use client';

import { Itinerary } from '@/types/itinerary';

interface ExportProps {
    itinerary: Itinerary;
}

export function ItineraryExport({ itinerary }: ExportProps) {
    
    const exportAsText = () => {
        let text = `${itinerary.destination} Trip Itinerary\n`;
        text += `${itinerary.dates.start} - ${itinerary.dates.end}\n`;
        text += `Hotel: ${itinerary.hotel.name}\n\n`;
        
        itinerary.days.forEach(day => {
            text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            text += `DAY ${day.day_number} (${day.day_of_week}) — ${day.theme}\n`;
            text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            day.items.forEach(item => {
                text += `☐ ${item.time.padEnd(10)} ${item.activity}\n`;
                text += `              📍 ${item.location} · ${item.duration}\n`;
                if (item.notes) {
                    text += `              💡 ${item.notes}\n`;
                }
                text += '\n';
            });
        });
        
        // Download
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${itinerary.destination}-itinerary.txt`;
        a.click();
    };

    const printItinerary = () => {
        window.print();
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={exportAsText}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
                📄 Export as Text
            </button>
            <button
                onClick={printItinerary}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
                🖨️ Print
            </button>
        </div>
    );
}
```

### 12.9 Integration with Chat Flow

Add itinerary generation to the conversation flow:

```typescript
// In app/api/chat/route.ts

// After booking is complete, offer itinerary
if (intent.action === 'booking_complete') {
    // ... existing booking code ...
    
    response.message += '\n\nWant me to plan your days? I can create a detailed itinerary based on your interests.';
    response.offer_itinerary = true;
}

// Handle itinerary request
if (intent.intent === 'plan_trip' || message.toLowerCase().includes('plan my')) {
    const itinerary = await generateItinerary({
        hotel: selectedHotel,
        checkIn: preferences.check_in,
        checkOut: preferences.check_out,
        preferences: {
            travelerType: preferences.traveler_type,
            interests: preferences.preferences,
            budgetLevel: preferences.budget_level,
        },
    });
    
    response.itinerary = itinerary;
    response.message = `Here's your personalized ${itinerary.dates.nights}-day itinerary for ${itinerary.destination}! I've planned around your hotel in ${itinerary.hotel.neighborhood} and included the spots I think you'll love.`;
}
```

### 12.10 Phase-In Plan

**MVP (Week 1):**
- Generate basic itinerary on request after hotel selection
- Simple text display
- No map integration

**V2 (Week 2-3):**
- Collapsible day view
- Checkbox completion tracking
- Map showing all locations
- Export to text

**V3 (Later):**
- Editable items (drag/drop reorder)
- Add custom activities
- Real-time collaboration (share with travel companion)
- Calendar sync (.ics export)
- Integration with booking links (restaurants, tickets)

### 12.11 Cost Analysis

| Component | Cost |
|-----------|------|
| Itinerary generation | ~$0.02-0.05 per itinerary (Claude tokens) |
| Map display | Free (OpenStreetMap) |
| Storage | Negligible (Supabase free tier) |

**Break-even:** An itinerary costs about 2 cents. If it increases booking conversion by even 1%, it pays for itself thousands of times over.

---

## Appendix: Duffel API Reference

### Key Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /stays/search` | Search for hotels |
| `GET /stays/search_results/{id}` | Get search results |
| `GET /stays/rates/{id}` | Get rate details |
| `POST /stays/bookings` | Create booking |
| `GET /stays/bookings/{id}` | Get booking details |
| `POST /stays/bookings/{id}/cancel` | Cancel booking |

### Test Card Numbers (Sandbox)

| Card | Number | Expiry | CVC |
|------|--------|--------|-----|
| Success | 4242 4242 4242 4242 | Any future | Any |
| Decline | 4000 0000 0000 0002 | Any future | Any |
| Insufficient | 4000 0000 0000 9995 | Any future | Any |

### Rate Limits

- Search: 100 requests/minute
- Booking: 50 requests/minute
- General: 1000 requests/minute

---

*Document Version: 1.1*
*Last Updated: January 2025*
*Added: Map feature, Trip Planner / Itinerary Generator*
