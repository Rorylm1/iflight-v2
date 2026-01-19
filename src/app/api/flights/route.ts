import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getFlightFromApi } from "@/lib/flight-api";
import { enrichFlight } from "@/lib/mock-enrichment";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/flights - Add a new flight
 *
 * Body: { flightNumber: string, date: string (YYYY-MM-DD) }
 *
 * 1. Validates input
 * 2. Enriches flight with AeroDataBox API (falls back to mock if API fails)
 * 3. Calculates distance using airport coordinates
 * 4. Saves to Supabase
 * 5. Returns the saved flight
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { flightNumber, date } = body;

    if (!flightNumber || typeof flightNumber !== "string") {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      );
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Validate flight number format (e.g., BA123, EZY456, U2986)
    // Airline codes can be 2-3 alphanumeric chars, followed by 1-4 digits
    const flightNumberRegex = /^[A-Z0-9]{2,3}\d{1,4}$/i;
    if (!flightNumberRegex.test(flightNumber.trim())) {
      return NextResponse.json(
        { error: "Invalid flight number format. Use format like BA123, EZY456, or U2986" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const cleanFlightNumber = flightNumber.trim().toUpperCase();
    let enrichedData;
    let dataSource = "api"; // Track where data came from

    // Try real API first, fall back to mock if it fails
    try {
      const apiData = await getFlightFromApi(cleanFlightNumber, date);

      if (apiData) {
        // Use distance directly from API response (works for any airport)
        enrichedData = {
          airline: apiData.airline,
          departure_airport: apiData.departure_airport,
          departure_time: apiData.departure_time,
          departure_terminal: apiData.departure_terminal,
          arrival_airport: apiData.arrival_airport,
          arrival_time: apiData.arrival_time,
          arrival_terminal: apiData.arrival_terminal,
          status: apiData.status,
          aircraft: apiData.aircraft,
          distance_km: apiData.distance_km,
        };
        console.log(`[Flight] Using real API data for ${cleanFlightNumber}`);
      } else {
        // Flight not found in API - fall back to mock
        console.log(`[Flight] Flight not found in API, using mock for ${cleanFlightNumber}`);
        enrichedData = await enrichFlight(cleanFlightNumber, date);
        dataSource = "mock";
      }
    } catch (apiError) {
      // API error (rate limit, network, etc.) - fall back to mock
      console.warn(`[Flight] API error, falling back to mock:`, apiError);
      enrichedData = await enrichFlight(cleanFlightNumber, date);
      dataSource = "mock";
    }

    // Save to Supabase
    // Source format: "manual:api" or "manual:mock" to track data origin
    const { data: flight, error: insertError } = await supabase
      .from("flights")
      .insert({
        user_id: user.id,
        flight_number: cleanFlightNumber,
        date: date,
        airline: enrichedData.airline,
        departure_airport: enrichedData.departure_airport,
        departure_time: enrichedData.departure_time,
        departure_terminal: enrichedData.departure_terminal,
        arrival_airport: enrichedData.arrival_airport,
        arrival_time: enrichedData.arrival_time,
        arrival_terminal: enrichedData.arrival_terminal,
        status: enrichedData.status,
        aircraft: enrichedData.aircraft,
        distance_km: enrichedData.distance_km,
        source: dataSource === "api" ? "manual" : "manual:estimated",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting flight:", insertError);
      return NextResponse.json(
        { error: "Failed to save flight" },
        { status: 500 }
      );
    }

    // Include data source in response (helpful for debugging)
    return NextResponse.json({ flight, dataSource }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/flights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/flights - Get all flights for the current user
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user's flights, ordered by date
    const { data: flights, error: fetchError } = await supabase
      .from("flights")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (fetchError) {
      console.error("Error fetching flights:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch flights" },
        { status: 500 }
      );
    }

    return NextResponse.json({ flights });
  } catch (error) {
    console.error("Error in GET /api/flights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flights - Delete a flight
 *
 * Query param: ?id=<flight_id>
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get flight ID from URL
    const { searchParams } = new URL(request.url);
    const flightId = searchParams.get("id");

    if (!flightId) {
      return NextResponse.json(
        { error: "Flight ID is required" },
        { status: 400 }
      );
    }

    // Delete the flight (RLS ensures user can only delete their own)
    const { error: deleteError } = await supabase
      .from("flights")
      .delete()
      .eq("id", flightId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting flight:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete flight" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/flights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
