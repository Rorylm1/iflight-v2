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
- **API Routes**: `src/app/api/` — server-side logic for flight enrichment
- **Deployment**: We will deploy on vercel with git version control

## Key Patterns
- Flight enrichment: mock data (`src/lib/mock-enrichment.ts`) → AeroDataBox API (M3)
- Supabase Row Level Security ensures users only see their own flights
- All timestamps stored as UTC (timestamptz)
- Airports table stores IATA codes with lat/lng for distance calculations


