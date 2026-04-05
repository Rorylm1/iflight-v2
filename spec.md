# iFlight Spec

Personal flight tracking app — log flights, view dashboard, visualise history on a map.

## Requirements

**MVP**
- Manual flight logging: enter flight number + date → system enriches with full details
- Flight dashboard: upcoming/past flights with times, airports, terminals, status
- Gmail sync: button triggers AI parsing of booking emails → auto-logs flights

**Future**
- Flight map: world map showing all routes + stats (miles, countries, CO2)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS |
| Flight API | AeroDataBox (via RapidAPI) |
| Deployment | Vercel |
| Gmail API | Google OAuth + Gmail API |
| AI Parsing | OpenAI GPT-4o-mini |
| Maps (later) | Mapbox GL JS |

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

create table gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users not null,
  google_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table gmail_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  gmail_message_id text,
  gmail_thread_id text,
  processed_at timestamptz default now(),
  parse_status text,
  flights_found integer default 0,
  raw_subject text,
  raw_from text,
  parse_confidence float,
  parse_model text,
  error_message text,
  unique(user_id, gmail_message_id)
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

**M3: Real Flight Data** ✅
- Replace mock enrichment with AeroDataBox API
- Seed airports table with real IATA codes, coordinates
- Calculate accurate flight distances
- Handle API errors gracefully (fallback to partial data)
- Cache responses to minimize API usage (optional)

**M4: Gmail Sync** ✅ (personal use, test mode)
- Google OAuth with CSRF-protected state parameter
- Gmail API with `gmail.readonly` scope, hybrid search (airline senders + keywords)
- OpenAI gpt-4o-mini parsing → extract flight numbers + dates from emails
- Multi-phase sync: fetch → parse → deduplicate → enrich → save
- 365-day lookback (configurable), deduplication via `gmail_sync_logs` table
- No external SDKs — all via fetch API (lower bundle size)
- Note: Public Gmail sync requires Google verification (weeks)

**M5: Map & Carbon Impact** (expanded scope)

New `/map` page — dedicated route visualization and carbon impact dashboard.

*Navigation*
- Add "Map & Stats" link to header
- Accessible from dashboard via prominent CTA

*Flight Map (Mapbox GL JS)*
- World map with dark style matching app theme
- Great circle arc paths between airports (curved lines showing actual flight paths)
- Airport markers showing visit frequency
- Route colors: amber gradient by recency or frequency
- Interactive: hover for route details, click for flight info

*Carbon Impact Dashboard — "Eco Insights"*
- **AI-Generated Equivalents**: Use OpenAI to generate fresh, varied comparisons each view
  - Prompt framework with guardrails (factual, relatable, mix of everyday/surprising)
  - Examples: kettles boiled, Netflix hours, cheeseburgers, smartphone charges, train trips
  - Rotate different equivalents to keep it engaging
  - Fallback to static equivalents if API unavailable
- **Infographic Visual Style**:
  - Large icons/emojis with bold numbers
  - Dark cards with amber accents, subtle glow effects
  - Short punchy descriptions
  - Responsive grid layout
- **Offset Suggestions**:
  - Trees needed to absorb (with visual tree grid)
  - Estimated offset cost (e.g., "~£15 via certified programs")
  - Brief explanation of offset types (reforestation, renewables, etc.)
  - Optional: links to Gold Standard / Atmosfair / verified programs
- **Breakdown Charts**:
  - CO2 by haul type (short/medium/long)
  - Emissions trend over time (if enough data)
  - Per-flight average

*Technical Notes*
- Cache AI-generated equivalents briefly (avoid API spam on refresh)
- Reuse existing OpenAI setup from Gmail sync
- Mapbox token stored in env vars (NEXT_PUBLIC_MAPBOX_TOKEN)

**M6: Public Launch** (optional)
- Custom domain
- Rate limiting
- Error monitoring (Sentry)
- Privacy policy / terms
