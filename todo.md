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
- [x] Create Vercel project
- [x] Connect to Git repository (create repo first if needed)
- [x] Add environment variables to Vercel
- [x] Deploy and verify auth flow works in production

### M1 Verification
- [x] Can sign up with email
- [x] Can sign in / sign out
- [x] Dashboard shows when logged in
- [x] Redirects to sign-in when logged out
- [x] Deployed to Vercel and working

**Live URL:** https://iflight-v2.vercel.app
**GitHub:** https://github.com/Rorylm1/iflight-v2

---

## M2: Core Flight Loop ✅

### Add Flight Form
- [x] Create "Add Flight" button on dashboard
- [x] Create flight input form (modal or slide-out)
- [x] Flight number input with validation (e.g., BA123)
- [x] Date picker for flight date
- [x] Form submission handling
- [x] Loading state during submission

### Mock Enrichment
- [x] Create `src/lib/mock-enrichment.ts`
- [x] Generate realistic fake flight data
- [x] Include: airline, airports, times, aircraft
- [x] Calculate mock distance between airports
- [x] Add random delay to simulate API call

### API Route
- [x] Create `/api/flights` POST endpoint
- [x] Validate incoming flight number + date
- [x] Call mock enrichment function
- [x] Save enriched flight to Supabase
- [x] Return saved flight data
- [x] Handle errors gracefully

### Dashboard Display
- [x] Fetch user's flights from Supabase
- [x] Create flight card component
- [x] Display: flight number, airline, route, times, status
- [x] Show departure/arrival airports with codes
- [x] Format times in user-friendly way

### Upcoming vs Past
- [x] Split flights into upcoming/past based on date
- [x] Create section headers for each
- [x] Show upcoming flights first
- [x] Sort upcoming by soonest first
- [x] Sort past by most recent first
- [x] Handle empty states (no flights yet)

### Flight Details
- [x] Click flight card to expand/show details
- [x] Show all enriched data (terminal, aircraft, distance)
- [x] Add delete flight option
- [x] Confirm before deleting

### M2 Verification
- [x] Can add flight "BA123" for a future date
- [x] Flight appears in Upcoming section with mock data
- [x] Can add flight for past date, appears in Past section
- [x] Can view flight details
- [x] Can delete a flight
- [x] Empty state shows when no flights

---

## M3: Real Flight Data ✅

### API Selection & Setup
- [x] Research AeroDataBox API (free tier: 100 req/month)
- [x] Create RapidAPI account (AeroDataBox is hosted there)
- [x] Subscribe to AeroDataBox free tier
- [x] Add `AERODATABOX_API_KEY` to `.env.local`
- [x] Add API key to Vercel environment variables
- [x] Update `.env.example` with new variable

### Airports Data
- [x] In-memory airport database with ~150 major airports (src/lib/airports.ts)
- [x] Include: IATA code, name, city, country, lat/lng
- [x] Haversine distance calculation between airports
- [x] Create `src/lib/airports.ts` lookup utility

### Flight Enrichment API
- [x] Create `src/lib/flight-api.ts` for AeroDataBox calls
- [x] Implement `getFlightFromApi(flightNumber, date)` function
- [x] Map API response to our flight schema
- [x] Calculate distance using airport coordinates
- [x] Update `/api/flights` route to use real API

### Error Handling & Fallbacks
- [x] Handle API rate limits (429 errors)
- [x] Handle flight not found (falls back to mock)
- [x] Allow partial data (e.g., if terminals unavailable)
- [x] Fallback to mock data if API fails
- [x] Log API errors for debugging
- [x] Override "scheduled" status to "landed" for past flights

### Caching
- [x] Cache API responses in Supabase (avoid duplicate calls)
- [x] Cache by flight_number + date combo
- [x] Only cache "landed" flights (future flights always need live data)

### M3 Verification
- [x] Can add real flight (e.g., BA123 for tomorrow)
- [x] Flight shows correct airline, airports, times
- [x] Distance calculated from real airport coordinates
- [x] Handles non-existent flight gracefully
- [x] API errors don't crash the app
- [x] Deployed to Vercel and working

---

## M4: Gmail Sync (Personal Use)

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

### M4 Verification
- [ ] Can connect Gmail account
- [ ] Can disconnect Gmail account
- [ ] Sync button fetches recent booking emails
- [ ] AI extracts flight details correctly
- [ ] New flights appear on dashboard
- [ ] Duplicates are not created
- [ ] Handles emails with no flight info gracefully

---

## M5: Map & Stats

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

### M5 Verification
- [ ] Map displays with dark theme
- [ ] Visited airports shown as markers
- [ ] Flight paths drawn as arcs
- [ ] Stats calculate correctly
- [ ] Map updates when new flights added

---

## M6: Public Launch (Optional)

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

### M6 Verification
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
