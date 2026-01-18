# iFlight Project Todo

Track progress through each milestone. Check items as completed.

---

## M1: Foundation ✅

### Project Setup
- [x] Create Next.js 14 project with App Router
- [x] Configure Tailwind CSS
- [x] Set up project structure (`src/app`, `src/components`, `src/lib`)
- [x] Add JetBrains Mono font for flight data

### Environment Variables
- [x] Create `.env.local` file
- [x] Create `.env.example` with placeholder keys (for reference)
- [x] Add `.env.local` to `.gitignore`
- [x] Document required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Setup
- [x] Create Supabase project (manual step in dashboard)
- [x] Copy Supabase URL and anon key to `.env.local`
- [x] Create `flights` table with schema from spec
- [x] Create `airports` table with schema from spec
- [x] Set up Row Level Security policies
- [x] Add Supabase client library (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Create `src/lib/supabase.ts` (browser + server clients)

### Authentication
- [x] Enable Email auth in Supabase dashboard
- [x] Create sign-up page (`/auth/signup`)
- [x] Create sign-in page (`/auth/signin`)
- [x] Create auth callback handler (`/auth/callback`)
- [x] Add sign-out functionality
- [x] Create middleware for session refresh (replaces auth context)
- [x] Protect dashboard route (redirect if not logged in)

### Layout & Styling
- [x] Configure dark theme colors in Tailwind config
- [x] Create root layout with dark background
- [x] Create navigation header (logo, user menu)
- [x] Create empty dashboard page structure
- [x] Apply amber accent styling to buttons/links
- [x] Test responsive layout (mobile + desktop)

### Deployment
- [ ] Create Vercel project
- [ ] Connect to Git repository (create repo first if needed)
- [ ] Add environment variables to Vercel
- [ ] Deploy and verify auth flow works in production

### M1 Verification
- [x] Can sign up with email
- [x] Can sign in / sign out
- [x] Dashboard shows when logged in
- [x] Redirects to sign-in when logged out
- [ ] Deployed to Vercel and working

---

## M2: Core Flight Loop

### Add Flight Form
- [ ] Create "Add Flight" button on dashboard
- [ ] Create flight input form (modal or slide-out)
- [ ] Flight number input with validation (e.g., BA123)
- [ ] Date picker for flight date
- [ ] Form submission handling
- [ ] Loading state during submission

### Mock Enrichment
- [ ] Create `src/lib/mock-enrichment.ts`
- [ ] Generate realistic fake flight data
- [ ] Include: airline, airports, times, aircraft
- [ ] Calculate mock distance between airports
- [ ] Add random delay to simulate API call

### API Route
- [ ] Create `/api/flights` POST endpoint
- [ ] Validate incoming flight number + date
- [ ] Call mock enrichment function
- [ ] Save enriched flight to Supabase
- [ ] Return saved flight data
- [ ] Handle errors gracefully

### Dashboard Display
- [ ] Fetch user's flights from Supabase
- [ ] Create flight card component
- [ ] Display: flight number, airline, route, times, status
- [ ] Show departure/arrival airports with codes
- [ ] Format times in user-friendly way

### Upcoming vs Past
- [ ] Split flights into upcoming/past based on date
- [ ] Create section headers for each
- [ ] Show upcoming flights first
- [ ] Sort upcoming by soonest first
- [ ] Sort past by most recent first
- [ ] Handle empty states (no flights yet)

### Flight Details
- [ ] Click flight card to expand/show details
- [ ] Show all enriched data (terminal, aircraft, distance)
- [ ] Add delete flight option
- [ ] Confirm before deleting

### M2 Verification
- [ ] Can add flight "BA123" for a future date
- [ ] Flight appears in Upcoming section with mock data
- [ ] Can add flight for past date, appears in Past section
- [ ] Can view flight details
- [ ] Can delete a flight
- [ ] Empty state shows when no flights

---

## M3: Gmail Sync (Personal Use)

### Google OAuth Setup
- [ ] Create Google Cloud project
- [ ] Enable Gmail API
- [ ] Configure OAuth consent screen (test mode)
- [ ] Create OAuth credentials
- [ ] Add authorized redirect URIs
- [ ] Add credentials to environment variables

### OAuth Flow
- [ ] Add "Connect Gmail" button to dashboard
- [ ] Create `/api/auth/google` to initiate OAuth
- [ ] Create `/api/auth/google/callback` to handle return
- [ ] Store refresh token securely in Supabase
- [ ] Handle token refresh when expired
- [ ] Show connected/disconnected state in UI

### Email Fetching
- [ ] Create Gmail API client utility
- [ ] Fetch emails with booking-related queries
- [ ] Filter to last 90 days
- [ ] Extract email body/HTML content
- [ ] Handle pagination for many emails

### AI Parsing
- [ ] Set up OpenAI client
- [ ] Create prompt for extracting flight details
- [ ] Parse: flight number, date, airports (if available)
- [ ] Handle multiple flights in one email
- [ ] Handle parsing failures gracefully
- [ ] Log confidence/uncertainty

### Sync Flow
- [ ] Create "Sync Flights" button
- [ ] Show sync progress (X of Y emails)
- [ ] Check for duplicate flights before inserting
- [ ] Use `gmail_message_id` for deduplication
- [ ] Insert new flights with `source: 'gmail'`
- [ ] Show summary when complete (X new flights found)

### M3 Verification
- [ ] Can connect Gmail account
- [ ] Can disconnect Gmail account
- [ ] Sync button fetches recent booking emails
- [ ] AI extracts flight details correctly
- [ ] New flights appear on dashboard
- [ ] Duplicates are not created
- [ ] Handles emails with no flight info gracefully

---

## M4: Map & Stats

### Airports Data
- [ ] Seed `airports` table with major airports
- [ ] Include: IATA code, name, city, country, lat/lng
- [ ] Create lookup function by IATA code

### Mapbox Setup
- [ ] Create Mapbox account and get access token
- [ ] Add Mapbox GL JS library
- [ ] Add token to environment variables
- [ ] Create map container component

### World Map
- [ ] Initialize dark-themed map
- [ ] Center on user's flights (or world view if none)
- [ ] Add airport markers for visited airports
- [ ] Style markers with amber color

### Flight Paths
- [ ] Draw arcs between departure/arrival airports
- [ ] Use great circle calculation for realistic curves
- [ ] Style paths with amber/gradient
- [ ] Handle multiple flights on same route (line thickness?)

### Stats Calculations
- [ ] Total distance flown (sum of all distance_km)
- [ ] Number of flights
- [ ] Unique countries visited
- [ ] Unique airlines used
- [ ] Most frequent route
- [ ] CO2 estimate (distance × factor per aircraft type)

### Stats Display
- [ ] Create stats panel/cards
- [ ] Display all calculated stats
- [ ] Format numbers nicely (e.g., "12,450 km")
- [ ] Position relative to map

### M4 Verification
- [ ] Map displays with dark theme
- [ ] Visited airports shown as markers
- [ ] Flight paths drawn as arcs
- [ ] Stats calculate correctly
- [ ] Map updates when new flights added

---

## M5: Public Launch (Optional)

### Production Readiness
- [ ] Set up custom domain
- [ ] Configure DNS in Vercel
- [ ] Enable HTTPS (automatic with Vercel)

### Security & Limits
- [ ] Add rate limiting to API routes
- [ ] Review and tighten RLS policies
- [ ] Audit for any security issues
- [ ] Remove any debug/test code

### Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add to environment variables
- [ ] Test error reporting works

### Legal
- [ ] Write privacy policy
- [ ] Write terms of service
- [ ] Add links to footer
- [ ] Cookie consent if needed (probably not for this app)

### Gmail for Public
- [ ] Submit app for Google verification
- [ ] Prepare privacy policy URL for Google
- [ ] Prepare app homepage for Google
- [ ] Wait for approval (can take weeks)

### M5 Verification
- [ ] App accessible on custom domain
- [ ] New users can sign up and use app
- [ ] Errors logged to Sentry
- [ ] Rate limits prevent abuse

---

## Future Ideas (Backlog)

- [ ] Edit existing flight details
- [ ] Manual flight entry without enrichment (for old flights)
- [ ] Export flights to CSV
- [ ] Share flight history (public profile link)
- [ ] Flight notifications/reminders
- [ ] Integration with TripIt or other travel apps
- [ ] Aircraft type images
- [ ] Airline logos
- [ ] Real-time flight tracking for upcoming flights
- [ ] Swap mock enrichment for real AeroDataBox API
