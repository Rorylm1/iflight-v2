/**
 * Email Parser with OpenAI
 *
 * Uses OpenAI to extract flight details from booking emails.
 * Model-agnostic design - can easily switch between models.
 */

import { EmailContent } from "./gmail-api";

// Default model - can be changed if needed
const DEFAULT_MODEL = "gpt-4o-mini";

export interface ParsedFlight {
  flightNumber: string;
  date: string; // YYYY-MM-DD
  departureAirport?: string; // IATA code
  arrivalAirport?: string; // IATA code
  confidence: number; // 0-1
}

export interface ParseResult {
  flights: ParsedFlight[];
  confidence: number; // Overall confidence
  model: string; // Model used
  error?: string;
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are a flight booking email parser. Extract flight information from booking confirmation emails.

For each flight found, extract:
- flight_number: The airline code + flight number (e.g., "BA123", "EZY456", "UA789")
- date: Flight departure date in YYYY-MM-DD format
- departure_airport: 3-letter IATA code if mentioned (e.g., "LHR", "JFK")
- arrival_airport: 3-letter IATA code if mentioned (e.g., "LAX", "CDG")
- confidence: Your confidence in this extraction (0.0 to 1.0)

Rules:
- Multiple flights in one itinerary = multiple objects in the array
- Return legs (round trips) are separate flights
- Connection flights are separate flights
- If date format is ambiguous (e.g., "01/02/2024"), prefer DD/MM/YYYY for European airlines, MM/DD/YYYY for US airlines
- If unsure about any field, omit it rather than guess
- confidence should be lower if information is partial or unclear
- Flight numbers typically have 2-3 letter airline code followed by 1-4 digits

Return ONLY valid JSON, no explanation or markdown:
{
  "flights": [
    {
      "flight_number": "BA123",
      "date": "2024-03-15",
      "departure_airport": "LHR",
      "arrival_airport": "JFK",
      "confidence": 0.95
    }
  ],
  "overall_confidence": 0.9
}

If no flights found in the email, return: { "flights": [], "overall_confidence": 1.0 }`;

/**
 * Parse an email to extract flight information
 *
 * @param email - Email content to parse
 * @param model - OpenAI model to use (default: gpt-4o-mini)
 */
export async function parseFlightEmail(
  email: EmailContent,
  model: string = DEFAULT_MODEL
): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      flights: [],
      confidence: 0,
      model,
      error: "OpenAI API key not configured",
    };
  }

  // Build the user message with email content
  const userMessage = `Parse this email for flight information:

Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}

Body:
${email.body}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1000,
      }),
    });

    // Get response text first to handle non-JSON errors
    const responseText = await response.text();

    if (!response.ok) {
      console.error("[Email Parser] OpenAI API error:", response.status, responseText);
      return {
        flights: [],
        confidence: 0,
        model,
        error: `OpenAI API error: ${response.status}`,
      };
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[Email Parser] Failed to parse OpenAI response:", responseText.substring(0, 200));
      return {
        flights: [],
        confidence: 0,
        model,
        error: "Invalid response from OpenAI",
      };
    }
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        flights: [],
        confidence: 0,
        model,
        error: "No response from OpenAI",
      };
    }

    // Parse the JSON response
    const parsed = parseJsonResponse(content);

    return {
      flights: parsed.flights || [],
      confidence: parsed.overall_confidence || 0,
      model,
    };
  } catch (error) {
    console.error("[Email Parser] Error:", error);
    return {
      flights: [],
      confidence: 0,
      model,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Parse JSON response from OpenAI, handling potential issues
 */
function parseJsonResponse(content: string): {
  flights: ParsedFlight[];
  overall_confidence: number;
} {
  try {
    // Try to extract JSON from the response (in case of markdown formatting)
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    const flights: ParsedFlight[] = [];

    if (Array.isArray(parsed.flights)) {
      for (const f of parsed.flights) {
        if (f.flight_number && f.date) {
          flights.push({
            flightNumber: normalizeFlightNumber(f.flight_number),
            date: f.date,
            departureAirport: f.departure_airport?.toUpperCase(),
            arrivalAirport: f.arrival_airport?.toUpperCase(),
            confidence: typeof f.confidence === "number" ? f.confidence : 0.5,
          });
        }
      }
    }

    return {
      flights,
      overall_confidence:
        typeof parsed.overall_confidence === "number"
          ? parsed.overall_confidence
          : flights.length > 0
          ? 0.5
          : 1.0,
    };
  } catch (error) {
    console.error("[Email Parser] JSON parse error:", error, "Content:", content);
    return { flights: [], overall_confidence: 0 };
  }
}

/**
 * Normalize flight number format
 */
function normalizeFlightNumber(flightNumber: string): string {
  // Remove spaces and convert to uppercase
  let normalized = flightNumber.replace(/\s+/g, "").toUpperCase();

  // Ensure proper format: 2-3 letter code + 1-4 digits
  const match = normalized.match(/^([A-Z]{2,3})(\d{1,4})$/);
  if (match) {
    return `${match[1]}${match[2]}`;
  }

  return normalized;
}

/**
 * Parse multiple emails (with rate limiting)
 *
 * @param emails - Array of emails to parse
 * @param model - OpenAI model to use
 * @param onProgress - Progress callback
 */
export async function parseMultipleEmails(
  emails: EmailContent[],
  model: string = DEFAULT_MODEL,
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, ParseResult>> {
  const results = new Map<string, ParseResult>();

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const result = await parseFlightEmail(email, model);
    results.set(email.id, result);

    if (onProgress) {
      onProgress(i + 1, emails.length);
    }

    // Rate limit: ~20 requests per minute for safety
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
