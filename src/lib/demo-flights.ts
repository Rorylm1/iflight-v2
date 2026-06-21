/**
 * Demo Flight Data (Guest Mode)
 *
 * When a visitor chooses "Continue without an account", we sign them in as an
 * anonymous Supabase user and seed their private sandbox with this curated set
 * of flights. The goal is that the dashboard, map, and carbon stats look
 * populated and impressive the moment they land — no setup required.
 *
 * Design notes:
 * - Dates are RELATIVE to "today" (computed at request time), so the demo never
 *   goes stale: most flights are in the past (landed), and a couple are upcoming.
 * - `departure_country` / `arrival_country` are ISO-2 codes (e.g. "GB", "US"),
 *   matching what the real AeroDataBox enrichment stores. FlightCard turns these
 *   into flag emoji, so the codes (not full country names) are required.
 * - `distance_km` is computed with the same Haversine helper the real app uses,
 *   so the stats and CO2 totals are accurate.
 * - `source: "demo"` marks these rows so we can identify guest data later and
 *   so the "estimated" badge (which keys off "estimated") does NOT appear.
 */

import { calculateDistance } from "@/lib/airports";

/**
 * A template route. We store times as plain "HH:MM" strings and a day offset
 * relative to today; the generator below converts them into the concrete
 * date + ISO timestamps the database expects.
 */
interface DemoRoute {
  flightNumber: string;
  airline: string;
  departure: string; // IATA code (must exist in airports.ts)
  departureCountry: string; // ISO-2 country code for the flag
  departureTerminal: string | null;
  departureTime: string; // local-ish "HH:MM"
  arrival: string; // IATA code (must exist in airports.ts)
  arrivalCountry: string; // ISO-2 country code for the flag
  arrivalTerminal: string | null;
  arrivalTime: string; // local-ish "HH:MM"
  aircraft: string;
  daysFromToday: number; // negative = past (landed), positive = upcoming
}

/**
 * A globetrotter's recent year of travel: long-haul hops across five
 * continents plus a few short European legs, with two trips still to come.
 */
const DEMO_ROUTES: DemoRoute[] = [
  // ── Past trips (landed) ───────────────────────────────────────────────
  {
    flightNumber: "EK30",
    airline: "Emirates",
    departure: "LHR", departureCountry: "GB", departureTerminal: "3", departureTime: "14:30",
    arrival: "DXB", arrivalCountry: "AE", arrivalTerminal: "3", arrivalTime: "00:55",
    aircraft: "Airbus A380-800",
    daysFromToday: -138,
  },
  {
    flightNumber: "SQ495",
    airline: "Singapore Airlines",
    departure: "DXB", departureCountry: "AE", departureTerminal: "1", departureTime: "03:30",
    arrival: "SIN", arrivalCountry: "SG", arrivalTerminal: "3", arrivalTime: "15:05",
    aircraft: "Airbus A350-900",
    daysFromToday: -136,
  },
  {
    flightNumber: "QF1",
    airline: "Qantas",
    departure: "SIN", departureCountry: "SG", departureTerminal: "1", departureTime: "20:30",
    arrival: "SYD", arrivalCountry: "AU", arrivalTerminal: "1", arrivalTime: "07:30",
    aircraft: "Airbus A380-800",
    daysFromToday: -134,
  },
  {
    flightNumber: "BA16",
    airline: "British Airways",
    departure: "SYD", departureCountry: "AU", departureTerminal: "1", departureTime: "16:25",
    arrival: "SIN", arrivalCountry: "SG", arrivalTerminal: "1", arrivalTime: "22:15",
    aircraft: "Boeing 777-300ER",
    daysFromToday: -120,
  },
  {
    flightNumber: "BA117",
    airline: "British Airways",
    departure: "LHR", departureCountry: "GB", departureTerminal: "5", departureTime: "08:40",
    arrival: "JFK", arrivalCountry: "US", arrivalTerminal: "7", arrivalTime: "11:30",
    aircraft: "Boeing 777-300ER",
    daysFromToday: -64,
  },
  {
    flightNumber: "AA2",
    airline: "American Airlines",
    departure: "JFK", departureCountry: "US", departureTerminal: "8", departureTime: "17:00",
    arrival: "LAX", arrivalCountry: "US", arrivalTerminal: "4", arrivalTime: "20:25",
    aircraft: "Airbus A321T",
    daysFromToday: -62,
  },
  {
    flightNumber: "BA478",
    airline: "British Airways",
    departure: "LHR", departureCountry: "GB", departureTerminal: "5", departureTime: "07:15",
    arrival: "BCN", arrivalCountry: "ES", arrivalTerminal: "1", arrivalTime: "10:40",
    aircraft: "Airbus A320neo",
    daysFromToday: -28,
  },
  // ── Upcoming trips (scheduled) ────────────────────────────────────────
  {
    flightNumber: "BA306",
    airline: "British Airways",
    departure: "LHR", departureCountry: "GB", departureTerminal: "5", departureTime: "09:00",
    arrival: "CDG", arrivalCountry: "FR", arrivalTerminal: "2A", arrivalTime: "11:20",
    aircraft: "Airbus A320",
    daysFromToday: 16,
  },
  {
    flightNumber: "BA117",
    airline: "British Airways",
    departure: "LHR", departureCountry: "GB", departureTerminal: "5", departureTime: "08:40",
    arrival: "JFK", arrivalCountry: "US", arrivalTerminal: "7", arrivalTime: "11:30",
    aircraft: "Boeing 777-300ER",
    daysFromToday: 34,
  },
];

/**
 * Format a Date as a local YYYY-MM-DD string (matches how the app stores
 * `flights.date` and how FlightList splits upcoming vs past).
 */
function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build the demo flight rows for a given (anonymous) user, ready to insert
 * into the `flights` table. Dates are computed relative to today so the demo
 * always shows a believable recent travel history plus upcoming trips.
 */
export function getDemoFlightRows(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return DEMO_ROUTES.map((route) => {
    // Concrete calendar date for this flight
    const flightDate = new Date(today);
    flightDate.setDate(flightDate.getDate() + route.daysFromToday);
    const date = toDateString(flightDate);

    // Build full ISO timestamps (UTC) from the date + "HH:MM" template
    const departureTime = `${date}T${route.departureTime}:00Z`;
    const arrivalTime = `${date}T${route.arrivalTime}:00Z`;

    const isPast = route.daysFromToday < 0;

    return {
      user_id: userId,
      flight_number: route.flightNumber,
      date,
      airline: route.airline,
      departure_airport: route.departure,
      departure_airport_name: null, // FlightCard falls back to the IATA code
      departure_country: route.departureCountry,
      departure_time: departureTime,
      departure_time_actual: isPast ? departureTime : null,
      departure_terminal: route.departureTerminal,
      arrival_airport: route.arrival,
      arrival_airport_name: null,
      arrival_country: route.arrivalCountry,
      arrival_time: arrivalTime,
      arrival_time_actual: isPast ? arrivalTime : null,
      arrival_terminal: route.arrivalTerminal,
      status: isPast ? "landed" : "scheduled",
      aircraft: route.aircraft,
      distance_km: calculateDistance(route.departure, route.arrival),
      source: "demo",
    };
  });
}
