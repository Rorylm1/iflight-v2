/**
 * Flight Cache Utility
 *
 * Caches API responses for landed flights to reduce AeroDataBox API calls.
 * Only "landed" flights are cached - future flights always need live data.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { FlightApiResponse } from "./flight-api";

export interface CachedFlight extends FlightApiResponse {
  id: string;
  flight_number: string;
  date: string;
  created_at: string;
}

/**
 * Check if a flight is cached
 *
 * @returns Cached flight data if found, null otherwise
 */
export async function getCachedFlight(
  supabase: SupabaseClient,
  flightNumber: string,
  date: string
): Promise<FlightApiResponse | null> {
  const cleanFlightNumber = flightNumber.trim().toUpperCase();

  const { data, error } = await supabase
    .from("flight_cache")
    .select("*")
    .eq("flight_number", cleanFlightNumber)
    .eq("date", date)
    .single();

  if (error || !data) {
    return null;
  }

  // Return in FlightApiResponse format
  return {
    airline: data.airline,
    departure_airport: data.departure_airport,
    departure_airport_name: data.departure_airport_name,
    departure_country: data.departure_country,
    departure_time: data.departure_time,
    departure_time_actual: data.departure_time_actual,
    departure_terminal: data.departure_terminal,
    arrival_airport: data.arrival_airport,
    arrival_airport_name: data.arrival_airport_name,
    arrival_country: data.arrival_country,
    arrival_time: data.arrival_time,
    arrival_time_actual: data.arrival_time_actual,
    arrival_terminal: data.arrival_terminal,
    status: data.status,
    aircraft: data.aircraft,
    distance_km: data.distance_km,
  };
}

/**
 * Cache a flight response (only if status is "landed")
 *
 * @returns true if cached successfully, false otherwise
 */
export async function cacheFlight(
  supabase: SupabaseClient,
  flightNumber: string,
  date: string,
  flightData: FlightApiResponse
): Promise<boolean> {
  // Only cache landed flights
  if (flightData.status !== "landed") {
    console.log(`[Cache] Skipping cache for ${flightNumber} - status is ${flightData.status}`);
    return false;
  }

  const cleanFlightNumber = flightNumber.trim().toUpperCase();

  const { error } = await supabase.from("flight_cache").upsert(
    {
      flight_number: cleanFlightNumber,
      date: date,
      airline: flightData.airline,
      departure_airport: flightData.departure_airport,
      departure_airport_name: flightData.departure_airport_name,
      departure_country: flightData.departure_country,
      departure_time: flightData.departure_time,
      departure_time_actual: flightData.departure_time_actual,
      departure_terminal: flightData.departure_terminal,
      arrival_airport: flightData.arrival_airport,
      arrival_airport_name: flightData.arrival_airport_name,
      arrival_country: flightData.arrival_country,
      arrival_time: flightData.arrival_time,
      arrival_time_actual: flightData.arrival_time_actual,
      arrival_terminal: flightData.arrival_terminal,
      status: flightData.status,
      aircraft: flightData.aircraft,
      distance_km: flightData.distance_km,
    },
    {
      onConflict: "flight_number,date",
    }
  );

  if (error) {
    console.error("[Cache] Error caching flight:", error);
    return false;
  }

  console.log(`[Cache] Cached ${cleanFlightNumber} on ${date}`);
  return true;
}
