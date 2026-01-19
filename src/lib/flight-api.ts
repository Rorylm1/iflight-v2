/**
 * AeroDataBox Flight API Client
 *
 * Fetches real flight data from AeroDataBox via RapidAPI.
 * Free tier: 100 requests/month
 *
 * API Docs: https://rapidapi.com/aedbx-aedbx/api/aerodatabox
 */

const RAPIDAPI_HOST = "aerodatabox.p.rapidapi.com";

export interface FlightApiResponse {
  airline: string;
  departure_airport: string;
  departure_time: string;
  departure_terminal: string | null;
  arrival_airport: string;
  arrival_time: string;
  arrival_terminal: string | null;
  status: string;
  aircraft: string | null;
}

interface AeroDataBoxFlight {
  airline?: {
    name?: string;
    iata?: string;
  };
  departure?: {
    airport?: {
      iata?: string;
      name?: string;
    };
    scheduledTime?: {
      utc?: string;
      local?: string;
    };
    terminal?: string;
  };
  arrival?: {
    airport?: {
      iata?: string;
      name?: string;
    };
    scheduledTime?: {
      utc?: string;
      local?: string;
    };
    terminal?: string;
  };
  status?: string;
  aircraft?: {
    model?: string;
    reg?: string;
  };
}

/**
 * Map AeroDataBox status to our simplified status
 */
function mapStatus(status?: string): string {
  if (!status) return "scheduled";

  const statusLower = status.toLowerCase();
  if (statusLower.includes("landed") || statusLower.includes("arrived")) {
    return "landed";
  }
  if (statusLower.includes("active") || statusLower.includes("en route") || statusLower.includes("airborne")) {
    return "active";
  }
  if (statusLower.includes("cancelled")) {
    return "cancelled";
  }
  if (statusLower.includes("delayed") || statusLower.includes("diverted")) {
    return "delayed";
  }
  return "scheduled";
}

/**
 * Fetch flight data from AeroDataBox API
 *
 * @param flightNumber - IATA flight number (e.g., "BA123")
 * @param date - Date in YYYY-MM-DD format
 * @returns Flight data or null if not found
 */
export async function getFlightFromApi(
  flightNumber: string,
  date: string
): Promise<FlightApiResponse | null> {
  const apiKey = process.env.AERODATABOX_API_KEY;

  if (!apiKey) {
    console.error("AERODATABOX_API_KEY not configured");
    throw new Error("Flight API not configured");
  }

  // AeroDataBox expects flight number without spaces
  const cleanFlightNumber = flightNumber.replace(/\s+/g, "").toUpperCase();

  const url = `https://${RAPIDAPI_HOST}/flights/number/${cleanFlightNumber}/${date}`;

  console.log(`[Flight API] Fetching: ${cleanFlightNumber} on ${date}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    });

    if (response.status === 404) {
      console.log(`[Flight API] Flight not found: ${cleanFlightNumber}`);
      return null;
    }

    if (response.status === 429) {
      console.error("[Flight API] Rate limit exceeded");
      throw new Error("API rate limit exceeded. Please try again later.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Flight API] Error ${response.status}: ${errorText}`);
      throw new Error(`Flight API error: ${response.status}`);
    }

    const data: AeroDataBoxFlight[] = await response.json();

    // API returns an array of flights (could be multiple legs or dates)
    // We take the first one that matches our date
    if (!data || data.length === 0) {
      console.log(`[Flight API] No flights returned for ${cleanFlightNumber}`);
      return null;
    }

    const flight = data[0];

    // Extract and map the data
    const result: FlightApiResponse = {
      airline: flight.airline?.name || flight.airline?.iata || "Unknown Airline",
      departure_airport: flight.departure?.airport?.iata || "???",
      departure_time: flight.departure?.scheduledTime?.utc || new Date().toISOString(),
      departure_terminal: flight.departure?.terminal || null,
      arrival_airport: flight.arrival?.airport?.iata || "???",
      arrival_time: flight.arrival?.scheduledTime?.utc || new Date().toISOString(),
      arrival_terminal: flight.arrival?.terminal || null,
      status: mapStatus(flight.status),
      aircraft: flight.aircraft?.model || null,
    };

    console.log(`[Flight API] Success: ${result.departure_airport} → ${result.arrival_airport}`);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes("API")) {
      throw error; // Re-throw API-specific errors
    }
    console.error("[Flight API] Network error:", error);
    throw new Error("Failed to connect to flight API");
  }
}
