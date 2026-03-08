-- Gmail OAuth Connections
-- Stores Google OAuth tokens for Gmail API access (separate from user login)
-- Each user can have one Gmail account connected

create table if not exists gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique, -- One Gmail connection per user

  -- Google OAuth tokens
  google_email text not null,            -- Gmail address connected
  access_token text not null,            -- Short-lived access token (1 hour)
  refresh_token text not null,           -- Long-lived refresh token
  token_expires_at timestamptz not null, -- When access_token expires
  scopes text not null,                  -- OAuth scopes granted (comma-separated)

  -- Sync state
  last_sync_at timestamptz,              -- When last sync completed
  last_sync_status text,                 -- 'success', 'partial', 'error'
  last_sync_error text,                  -- Error message if failed

  -- Metadata
  connected_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Users can only access their own connection
alter table gmail_connections enable row level security;

create policy "Users manage own gmail connection" on gmail_connections
  for all using (auth.uid() = user_id);

-- Index for user lookup
create index if not exists gmail_connections_user_idx on gmail_connections(user_id);
