# HonestNomad - Quick Action Checklist

> For detailed status and session logs, see `PROJECT-STATUS.md`

---

## Immediate Next Steps

### 1. Install & Run
```bash
cd C:\HonestNomad
npm install
npm run dev
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```

Then fill in:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
DUFFEL_ACCESS_TOKEN=
MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Database
1. Create project at supabase.com
2. Go to SQL Editor
3. Paste contents of `lib/supabase/migrations.sql`
4. Run

### 4. Supabase Auth (OAuth)
1. Authentication > Providers
2. Enable Google (need Google Cloud OAuth credentials)
3. Enable Facebook (need Facebook Developer App)

### 5. Add Assets
- `/public/logo.svg`
- `/public/favicon.ico`
- `/public/markers/hotel.png` (32x32)
- `/public/markers/attraction.png` (24x24)

---

## Build Status

### Complete
- [x] Project setup (Next.js 14, TypeScript, Tailwind)
- [x] Database schema & Supabase integration
- [x] Authentication (email + Google + Facebook OAuth)
- [x] Claude AI integration (conversation + itinerary)
- [x] Duffel API integration (search + booking)
- [x] Mapbox geocoding
- [x] Chat interface
- [x] Hotel search & display
- [x] Booking flow with payment form
- [x] Map components (Leaflet)
- [x] Itinerary generation & display
- [x] User pages (bookings, settings)
- [x] All API routes

### Not Yet Done
- [ ] npm install
- [ ] Supabase project setup
- [ ] API keys configured
- [ ] OAuth providers configured
- [ ] Asset files added
- [ ] End-to-end testing
- [ ] Production deployment

---

## API Keys Needed

| Service | Get From | Free Tier |
|---------|----------|-----------|
| Supabase | supabase.com | 500MB DB, 50k MAU |
| Anthropic | console.anthropic.com | Pay as you go |
| Duffel | dashboard.duffel.com | Commission model |
| Mapbox | account.mapbox.com | 100k geocodes/month |

---

## Test Flow

1. **Open app** → Chat loads
2. **Type** "I need a hotel in Paris March 15-18 under €150" → AI searches
3. **Click "Book This"** on a hotel → Guest form appears
4. **Fill form** with test data → Use card 4242 4242 4242 4242
5. **Submit** → Booking confirmed
6. **Request itinerary** → Day-by-day plan generated

---

## Deploy to Vercel

```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# Then import in Vercel dashboard
# Add all env vars
# Deploy
```

---

## File Quick Reference

| Need to... | Look in... |
|------------|------------|
| Change AI prompts | `lib/claude/prompts.ts` |
| Modify search logic | `lib/duffel/search.ts` |
| Edit chat UI | `components/chat/` |
| Update database schema | `lib/supabase/migrations.sql` |
| Add new API route | `app/api/` |
| Change styling | `app/globals.css` or component files |

---

*Last updated: January 2025*
