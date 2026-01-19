# iFlight Spec

Personal flight tracking app — log flights, view dashboard, visualise history on a map.

## Requirements

**MVP**
- Manual flight logging: enter flight number + date → system enriches with full details
- Flight dashboard: upcoming/past flights with times, airports, terminals, status

**Future**
- Gmail sync: button triggers AI parsing of booking emails → auto-logs flights
- Flight map: world map showing all routes + stats (miles, countries, CO2)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Flight API | Mock data → AeroDataBox (later) |
| Deployment | Vercel |
| Maps (later) | Mapbox GL JS |
| AI (later) | OpenAI GPT-4o-mini |

## Database Schema

```sql
create table flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,

  -- User input
  flight_number text not null,
  date date not null,

  -- Enriched data (nullable, from API)
  airline text,
  departure_airport text,
  departure_time timestamptz,
  departure_terminal text,    -- often unavailable
  arrival_airport text,
  arrival_time timestamptz,
  arrival_terminal text,      -- often unavailable
  status text,
  aircraft text,
  distance_km integer,        -- calculated from airport coords, not from API

  -- Metadata
  source text default 'manual',
  gmail_message_id text,
  created_at timestamptz default now()
);

create table airports (
  iata text primary key,
  name text,
  city text,
  country text,
  lat decimal,
  lng decimal
);

alter table flights enable row level security;
create policy "Users see own flights" on flights
  for all using (auth.uid() = user_id);
```

## Design: Dark Theme with Retro Accents

- **Base**: Dark background (#0D0D0D), neutral grays for UI
- **Accents**: Amber (#FFB000) for highlights, status indicators, CTAs
- **Font**: System sans-serif for UI, monospace (JetBrains Mono) for flight data only
- **Style**: Modern layout, sharp corners, subtle amber glow on cards
- **Restraint**: Retro touches are accents, not the whole aesthetic

## Milestones

**M1: Foundation** ✅
- Next.js + Tailwind + Supabase setup
- Auth flow (sign up/in/out)
- Basic layout with retro styling
- Deploy to Vercel

**M2: Core Flight Loop** ✅
- Add flight form (flight number + date)
- Mock enrichment API
- Save to Supabase, display on dashboard
- Upcoming/past sections

**M3: Real Flight Data**
- Replace mock enrichment with AeroDataBox API
- Seed airports table with real IATA codes, coordinates
- Calculate accurate flight distances
- Handle API errors gracefully (fallback to partial data)
- Cache responses to minimize API usage

**M4: Gmail Sync** (personal use only)
- Google OAuth in test mode (no app verification needed)
- Fetch booking emails from last 90 days
- OpenAI parsing → extract flight number + date
- Dedupe against existing flights, auto-log new ones
- Note: Public Gmail sync requires Google verification (weeks)

**M5: Map & Stats**
- Mapbox world map
- Flight path arcs (great circle)
- Stats: km, countries, airlines, CO2 estimate

**M6: Public Launch** (optional)
- Custom domain
- Rate limiting
- Error monitoring (Sentry)
- Privacy policy / terms
