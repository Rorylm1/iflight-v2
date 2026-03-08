-- Gmail Sync Logs
-- Tracks processed emails to prevent re-processing and enable deduplication

create table if not exists gmail_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,

  -- Email identification
  gmail_message_id text not null,        -- Gmail's unique message ID
  gmail_thread_id text,                  -- Gmail thread ID

  -- Processing results
  processed_at timestamptz default now(),
  parse_status text not null,            -- 'success', 'no_flights', 'error', 'skipped'
  flights_found integer default 0,       -- Number of flights extracted
  raw_subject text,                      -- Email subject for debugging
  raw_from text,                         -- Sender for debugging

  -- AI parsing details
  parse_confidence float,                -- Overall confidence score (0-1)
  parse_model text,                      -- OpenAI model used

  -- Error tracking
  error_message text,

  -- Unique constraint: one log per email per user
  unique(user_id, gmail_message_id)
);

-- RLS: Users can only see their own sync logs
alter table gmail_sync_logs enable row level security;

create policy "Users see own sync logs" on gmail_sync_logs
  for all using (auth.uid() = user_id);

-- Indexes for efficient queries
create index if not exists gmail_sync_logs_user_idx on gmail_sync_logs(user_id);
create index if not exists gmail_sync_logs_message_idx on gmail_sync_logs(gmail_message_id);
