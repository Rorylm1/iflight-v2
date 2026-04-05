# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Context
I'm a PM with limited coding experience. When coding, share tips explaining the tech architecture and changes you're making. Use explanatory output style by default.

## Project
Personal flight tracking app. See `spec.md` for full requirements.

## Commands
```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture
- **Framework**: Next.js 14 (App Router) — pages in `src/app/`
- **Database**: Supabase (Postgres + Auth) — client in `src/lib/supabase.ts`
- **Styling**: Tailwind CSS, dark theme with amber accents
- **API Routes**: `src/app/api/` — server-side logic for flight enrichment + Gmail sync
- **Gmail Sync**: Google OAuth + Gmail API + OpenAI parsing — `src/lib/gmail/`
- **Deployment**: Deployed on Vercel with git version control

## Key Patterns
- Flight enrichment: AeroDataBox API with mock fallback (`src/lib/mock-enrichment.ts`)
- Gmail sync: fetch emails → OpenAI parse → deduplicate → enrich → save (`src/lib/gmail/sync-service.ts`)
- No external SDKs for Google/OpenAI — all via fetch API for smaller bundle
- Supabase Row Level Security ensures users only see their own data (flights, gmail_connections, sync_logs)
- All timestamps stored as UTC (timestamptz)
- Airports table stores IATA codes with lat/lng for distance calculations
- Flight cache stores landed flights to minimize API calls

## Current Progress
- **M1-M3**: Complete (Foundation, Core Flight Loop, Real Flight Data)
- **M4**: Complete (Gmail Sync)
- **M5**: Complete (Map & Carbon Impact)
- **Next milestone**: M6 (optional) — Public Launch features

## M5 Components
- `/map` page with Mapbox globe visualization and carbon insights
- `FlightMap.tsx` — Great circle arc routes, airport markers with hover popups
- `CarbonInsights.tsx` — AI-generated equivalents, offset suggestions, tips
- `/api/carbon-equivalents` — OpenAI-powered dynamic comparisons


