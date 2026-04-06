/**
 * Gmail Sync Service
 *
 * Orchestrates the full sync flow:
 * 1. Get valid access token (refresh if needed)
 * 2. Search for flight booking emails
 * 3. Parse emails with AI
 * 4. Deduplicate against existing flights
 * 5. Enrich with AeroDataBox API
 * 6. Save to database
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  refreshAccessToken,
  isTokenExpired,
} from "./google-oauth";
import { searchEmails, fetchEmailContents, EmailContent } from "./gmail-api";
import { buildSmartQuery, buildGmailQuery } from "./airline-senders";
import { parseFlightEmail, ParseResult, ParsedFlight } from "./email-parser";
import { getFlightFromApi } from "../flight-api";

export interface SyncOptions {
  lookbackDays?: number; // Default: 365 (12 months)
  maxEmails?: number; // Default: 100
  deepSync?: boolean; // Use broader search query (slower but finds more)
}

export interface SyncProgress {
  phase: "fetching" | "parsing" | "enriching" | "saving" | "complete";
  message: string;
  current: number;
  total: number;
}

export interface SyncResult {
  success: boolean;
  stats: {
    emailsFound: number;
    emailsProcessed: number;
    flightsFound: number;
    flightsNew: number;
    flightsDuplicate: number;
    errors: number;
  };
  newFlights: Array<{
    flightNumber: string;
    date: string;
    id?: string;
  }>;
  errors: string[];
}

/**
 * Get a valid access token, refreshing if expired
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Get current connection
  const { data: connection, error } = await supabase
    .from("gmail_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !connection) {
    throw new Error("Gmail not connected");
  }

  // Check if token is expired
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const expired = isTokenExpired(expiresAt);

  console.log("[Sync] Token check - expires_at from DB:", connection.token_expires_at);
  console.log("[Sync] Token check - parsed expiresAt:", expiresAt.toISOString());
  console.log("[Sync] Token check - current time:", now.toISOString());
  console.log("[Sync] Token check - isExpired:", expired);
  console.log("[Sync] Token check - time until expiry (ms):", expiresAt.getTime() - now.getTime());

  if (!expired) {
    console.log("[Sync] Token is still valid, using existing access_token");
    return connection.access_token;
  }

  // Refresh the token
  console.log("[Sync] Token expired, attempting refresh...");
  const newTokens = await refreshAccessToken(connection.refresh_token);

  // Update in database
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

  await supabase
    .from("gmail_connections")
    .update({
      access_token: newTokens.access_token,
      token_expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return newTokens.access_token;
}

/**
 * Check if an email has already been successfully processed
 * (Errors can be retried)
 */
async function isEmailProcessed(
  supabase: SupabaseClient,
  userId: string,
  messageId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("gmail_sync_logs")
    .select("id, parse_status")
    .eq("user_id", userId)
    .eq("gmail_message_id", messageId)
    .single();

  // Only skip if successfully processed (not errors)
  return data?.parse_status === "success" || data?.parse_status === "no_flights";
}

/**
 * Check if a flight already exists for this user
 */
async function flightExists(
  supabase: SupabaseClient,
  userId: string,
  flightNumber: string,
  date: string
): Promise<boolean> {
  const { data } = await supabase
    .from("flights")
    .select("id")
    .eq("user_id", userId)
    .eq("flight_number", flightNumber.toUpperCase())
    .eq("date", date)
    .single();

  return !!data;
}

/**
 * Log email processing result
 */
async function logEmailProcessing(
  supabase: SupabaseClient,
  userId: string,
  email: EmailContent,
  result: ParseResult
): Promise<void> {
  await supabase.from("gmail_sync_logs").upsert(
    {
      user_id: userId,
      gmail_message_id: email.id,
      gmail_thread_id: email.threadId,
      raw_subject: email.subject.substring(0, 500),
      raw_from: email.from.substring(0, 200),
      parse_status: result.error
        ? "error"
        : result.flights.length > 0
        ? "success"
        : "no_flights",
      flights_found: result.flights.length,
      parse_confidence: result.confidence,
      parse_model: result.model,
      error_message: result.error,
    },
    { onConflict: "user_id,gmail_message_id" }
  );
}

/**
 * Add a flight to the database with enrichment
 */
async function addFlightFromEmail(
  supabase: SupabaseClient,
  userId: string,
  flight: ParsedFlight,
  gmailMessageId: string
): Promise<{ id: string } | null> {
  try {
    // Try to enrich with AeroDataBox API
    let enrichedData = null;
    try {
      enrichedData = await getFlightFromApi(flight.flightNumber, flight.date);
    } catch (apiError) {
      console.warn(
        `[Sync] Could not enrich flight ${flight.flightNumber}:`,
        apiError
      );
    }

    // Build flight record
    const flightRecord: Record<string, unknown> = {
      user_id: userId,
      flight_number: flight.flightNumber.toUpperCase(),
      date: flight.date,
      source: "gmail",
      gmail_message_id: gmailMessageId,
    };

    // Add enriched data if available
    if (enrichedData) {
      Object.assign(flightRecord, {
        airline: enrichedData.airline,
        departure_airport: enrichedData.departure_airport,
        departure_airport_name: enrichedData.departure_airport_name,
        departure_country: enrichedData.departure_country,
        departure_time: enrichedData.departure_time,
        departure_time_actual: enrichedData.departure_time_actual,
        departure_terminal: enrichedData.departure_terminal,
        arrival_airport: enrichedData.arrival_airport,
        arrival_airport_name: enrichedData.arrival_airport_name,
        arrival_country: enrichedData.arrival_country,
        arrival_time: enrichedData.arrival_time,
        arrival_time_actual: enrichedData.arrival_time_actual,
        arrival_terminal: enrichedData.arrival_terminal,
        status: enrichedData.status,
        aircraft: enrichedData.aircraft,
        distance_km: enrichedData.distance_km,
      });
    } else {
      // Use parsed data as fallback
      Object.assign(flightRecord, {
        departure_airport: flight.departureAirport || null,
        arrival_airport: flight.arrivalAirport || null,
        status: new Date(flight.date) < new Date() ? "landed" : "scheduled",
      });
    }

    const { data, error } = await supabase
      .from("flights")
      .insert(flightRecord)
      .select("id")
      .single();

    if (error) {
      console.error("[Sync] Error inserting flight:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Sync] Error adding flight:", error);
    return null;
  }
}

/**
 * Run the full Gmail sync process
 */
export async function runGmailSync(
  supabase: SupabaseClient,
  userId: string,
  options: SyncOptions = {},
  onProgress?: (progress: SyncProgress) => void
): Promise<SyncResult> {
  // Cap emails to avoid Vercel timeout (hobby tier = 10s)
  // Each email takes ~3-5s to process (fetch + AI parse + enrich)
  const MAX_EMAILS_PER_SYNC = 5;
  const { lookbackDays = 365, maxEmails = 20 } = options;
  const effectiveMaxEmails = Math.min(maxEmails, MAX_EMAILS_PER_SYNC);

  const syncStartTime = Date.now();

  const result: SyncResult = {
    success: false,
    stats: {
      emailsFound: 0,
      emailsProcessed: 0,
      flightsFound: 0,
      flightsNew: 0,
      flightsDuplicate: 0,
      errors: 0,
    },
    newFlights: [],
    errors: [],
  };

  try {
    // Phase 1: Get access token
    onProgress?.({
      phase: "fetching",
      message: "Connecting to Gmail...",
      current: 0,
      total: 0,
    });

    const accessToken = await getValidAccessToken(supabase, userId);

    // Phase 2: Search for emails
    onProgress?.({
      phase: "fetching",
      message: "Searching for flight emails...",
      current: 0,
      total: 0,
    });

    // Use broader query for deep sync, smart query for quick sync
    const query = options.deepSync
      ? buildGmailQuery(lookbackDays)
      : buildSmartQuery(lookbackDays);
    console.log("[Sync] Gmail query:", query);
    console.log("[Sync] Deep sync:", !!options.deepSync);
    console.log("[Sync] Max emails to process:", effectiveMaxEmails);

    const searchResult = await searchEmails(accessToken, query, effectiveMaxEmails);
    const messageIds = searchResult.messages.map((m) => m.id);
    result.stats.emailsFound = messageIds.length;

    if (messageIds.length === 0) {
      result.success = true;
      onProgress?.({
        phase: "complete",
        message: "No flight emails found",
        current: 0,
        total: 0,
      });
      return result;
    }

    // Filter out already-processed emails
    const unprocessedIds: string[] = [];
    for (const id of messageIds) {
      if (!(await isEmailProcessed(supabase, userId, id))) {
        unprocessedIds.push(id);
      }
    }

    console.log(
      `[Sync] Found ${messageIds.length} emails, ${unprocessedIds.length} unprocessed`
    );

    if (unprocessedIds.length === 0) {
      result.success = true;
      result.stats.emailsProcessed = messageIds.length;
      onProgress?.({
        phase: "complete",
        message: "All emails already processed",
        current: 0,
        total: 0,
      });
      return result;
    }

    // Phase 3: Fetch email contents
    onProgress?.({
      phase: "fetching",
      message: `Fetching ${unprocessedIds.length} emails...`,
      current: 0,
      total: unprocessedIds.length,
    });

    const emails = await fetchEmailContents(
      accessToken,
      unprocessedIds,
      (current, total) => {
        onProgress?.({
          phase: "fetching",
          message: `Fetching emails (${current}/${total})...`,
          current,
          total,
        });
      }
    );

    // Phase 4: Parse emails with AI
    onProgress?.({
      phase: "parsing",
      message: "Analyzing emails for flight information...",
      current: 0,
      total: emails.length,
    });

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      // Check if we're running out of time (stop at 8 seconds to allow cleanup)
      const elapsedMs = Date.now() - syncStartTime;
      if (elapsedMs > 8000) {
        console.log(`[Sync] Stopping early - ${elapsedMs}ms elapsed, processed ${i} emails`);
        result.errors.push(`Processed ${i} of ${emails.length} emails before timeout`);
        break;
      }

      onProgress?.({
        phase: "parsing",
        message: `Parsing email ${i + 1}/${emails.length}...`,
        current: i + 1,
        total: emails.length,
      });

      // Parse the email
      const parseResult = await parseFlightEmail(email);

      // Log the processing
      await logEmailProcessing(supabase, userId, email, parseResult);
      result.stats.emailsProcessed++;

      if (parseResult.error) {
        result.stats.errors++;
        result.errors.push(`Email "${email.subject}": ${parseResult.error}`);
        continue;
      }

      // Process found flights
      for (const flight of parseResult.flights) {
        result.stats.flightsFound++;

        // Check for duplicates
        if (await flightExists(supabase, userId, flight.flightNumber, flight.date)) {
          result.stats.flightsDuplicate++;
          continue;
        }

        // Add the flight
        onProgress?.({
          phase: "enriching",
          message: `Adding flight ${flight.flightNumber}...`,
          current: i + 1,
          total: emails.length,
        });

        const added = await addFlightFromEmail(
          supabase,
          userId,
          flight,
          email.id
        );

        if (added) {
          result.stats.flightsNew++;
          result.newFlights.push({
            flightNumber: flight.flightNumber,
            date: flight.date,
            id: added.id,
          });
        } else {
          result.stats.errors++;
        }
      }
    }

    // Update sync status
    await supabase
      .from("gmail_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: result.stats.errors > 0 ? "partial" : "success",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    result.success = true;

    onProgress?.({
      phase: "complete",
      message: `Found ${result.stats.flightsNew} new flights`,
      current: result.stats.flightsNew,
      total: result.stats.flightsFound,
    });

    return result;
  } catch (error) {
    console.error("[Sync] Error:", error);
    result.errors.push(error instanceof Error ? error.message : "Unknown error");

    // Update sync status with error
    await supabase
      .from("gmail_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_sync_error: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return result;
  }
}
