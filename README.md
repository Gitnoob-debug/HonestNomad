# HonestNomad

AI-powered hotel booking assistant with natural language search, personalized recommendations, and trip itinerary generation.

## Features

- **Conversational Search**: Describe what you want in plain English
- **Smart Intent Parsing**: AI understands dates, budgets, preferences
- **Hotel Booking**: Complete booking flow with payment processing
- **Itinerary Generation**: AI-generated day-by-day trip plans
- **Interactive Maps**: View hotels and attractions on a map
- **User Accounts**: Save preferences and booking history

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Hotels**: Duffel Stays API
- **Payments**: Duffel Pay
- **Geocoding**: Mapbox
- **Maps**: Leaflet + OpenStreetMap

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key
- Duffel account
- Mapbox account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd honest-nomad
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your API keys in `.env.local`

5. Set up the database:
   - Go to your Supabase project
   - Run the SQL from `lib/supabase/migrations.sql` in the SQL editor

6. Configure OAuth providers in Supabase:
   - Enable Google and Facebook authentication
   - Add callback URLs

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.local.example` for all required environment variables.

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   ├── booking/           # Booking pages
│   └── ...
├── components/            # React components
│   ├── chat/              # Chat interface
│   ├── hotels/            # Hotel display
│   ├── booking/           # Booking flow
│   ├── map/               # Map components
│   ├── itinerary/         # Itinerary display
│   └── ui/                # Base UI components
├── lib/                   # Utility libraries
│   ├── supabase/          # Database client and functions
│   ├── claude/            # AI integration
│   ├── duffel/            # Hotel API integration
│   └── geocoding/         # Mapbox geocoding
├── hooks/                 # React hooks
├── types/                 # TypeScript types
└── public/                # Static assets
```

## Asset Requirements

Add these files to complete the setup:

- `/public/logo.svg` - App logo (512x512)
- `/public/favicon.ico` - Browser favicon
- `/public/og-image.png` - Social share image (1200x630)
- `/public/markers/hotel.png` - Map marker for hotels (32x32)
- `/public/markers/attraction.png` - Map marker for attractions (24x24)
- `/public/images/hotel-placeholder.jpg` - Default hotel image

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Configuration

See `vercel.json` for deployment settings.

## API Documentation

### Chat Endpoint
`POST /api/chat`
- Main conversation handler
- Accepts natural language queries
- Returns search results, booking confirmations, etc.

### Search Endpoint
`POST /api/search`
- Direct hotel search (bypass chat)
- Returns array of normalized hotel objects

### Booking Endpoint
`POST /api/book`
- Create a new booking
- Requires guest details and payment token

### Itinerary Endpoint
`POST /api/itinerary`
- Generate trip itinerary
- Returns day-by-day plan with activities

## License

MIT
