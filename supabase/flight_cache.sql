-- Flight Cache Table
-- Caches API responses for landed flights to reduce API calls
-- Only landed flights are cached (future flights need live data)

create table if not exists flight_cache (
  id uuid primary key default gen_random_uuid(),

  -- Cache key: flight number + date combination
  flight_number text not null,
  date date not null,

  -- Cached API response data
  airline text,
  departure_airport text,
  departure_airport_name text,
  departure_country text,
  departure_time timestamptz,
  departure_time_actual timestamptz,
  departure_terminal text,
  arrival_airport text,
  arrival_airport_name text,
  arrival_country text,
  arrival_time timestamptz,
  arrival_time_actual timestamptz,
  arrival_terminal text,
  status text not null,
  aircraft text,
  distance_km integer,

  -- Metadata
  created_at timestamptz default now(),

  -- Unique constraint on flight_number + date
  unique(flight_number, date)
);

-- Index for fast lookups
create index if not exists flight_cache_lookup_idx
  on flight_cache(flight_number, date);

-- No RLS needed - cache is shared across all users
-- (flight data is public information)
