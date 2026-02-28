# HonestNomad

AI-powered travel planning app. Users discover destinations through photos/social links, then book hotels through a streamlined funnel.

**Stack:** Next.js 14 + Supabase + LiteAPI + Mapbox + Claude (via OpenRouter)

## Context Files

- **`MEMORY.md`** — Full project context: architecture decisions, what's built, API keys, data flow, sessionStorage contracts. **Read this first.**
- **`docs/TODO.md`** — Development roadmap with completed items, in-progress work, and known blockers.

## Critical Rules

1. **DO NOT run Google Places API scripts** — Previous $900 bill incident
2. **DO NOT store API keys in committed files** — Use `.env.local` only
3. **DO NOT store PII** — Passthrough architecture, guest data goes direct to LiteAPI
4. **Hotels only, no flights** — Chargeback risk decision
5. **Local build OOM** — `next build` crashes locally (7000+ line destinations.ts). Use `npx tsc --noEmit` for type checking. Vercel builds fine.

## Key Paths

| Flow | Entry | Key files |
|------|-------|-----------|
| Discover | `/discover` | `app/discover/page.tsx`, `lib/location/resolver.ts`, `components/discover/` |
| Flash swipe | `/flash` | `components/flash/FlashPlanInput.tsx`, `hooks/useFlashVacation.ts` |
| Explore | `/flash/explore` | `app/flash/explore/page.tsx` (large file ~3200 lines) |
| Hotel search | API | `app/api/hotels/search/route.ts`, `lib/liteapi/hotels.ts` |
| Confirm | `/flash/confirm` | `app/flash/confirm/page.tsx` |
| Destinations | Data | `lib/flash/destinations.ts` (500 destinations, 7000+ lines) |
