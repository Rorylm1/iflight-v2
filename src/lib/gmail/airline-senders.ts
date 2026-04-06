/**
 * Airline Email Senders and Gmail Query Builder
 *
 * Used for finding flight booking emails in Gmail.
 * Hybrid approach: known airline senders + keyword search.
 */

// Known airline and booking site email domains
export const AIRLINE_SENDERS = [
  // Major Airlines
  "britishairways.com",
  "ba.com",
  "easyjet.com",
  "ryanair.com",
  "jet2.com",
  "flybe.com",
  "virginatlantic.com",
  "united.com",
  "aa.com",
  "delta.com",
  "southwest.com",
  "jetblue.com",
  "alaskaair.com",
  "spirit.com",
  "frontier.com",
  "airfrance.fr",
  "klm.com",
  "lufthansa.com",
  "swiss.com",
  "emirates.com",
  "qatarairways.com",
  "etihad.com",
  "singaporeair.com",
  "cathaypacific.com",
  "qantas.com",
  "airnewzealand.com",
  "aerlingus.com",
  "norwegian.com",
  "vueling.com",
  "iberia.com",
  "tap.pt",
  "aegeanair.com",
  "finnair.com",
  "icelandair.com",
  "wizzair.com",
  "eurowings.com",
  "aircanada.com",
  "westjet.com",
  "avianca.com",
  "latam.com",
  "azul.com.br",
  "ana.co.jp",
  "jal.co.jp",
  "koreanair.com",
  "asiana.com",
  "thaiairways.com",
  "vietnamairlines.com",
  "airchina.com",
  "csair.com",
  "hainanairlines.com",
  "turkishairlines.com",
  "saudia.com",
  "royalairmaroc.com",
  "ethiopianairlines.com",
  "kenya-airways.com",
  "southafrican.com",

  // Booking Sites
  "booking.com",
  "expedia.com",
  "kayak.com",
  "skyscanner.com",
  "google.com", // Google Flights confirmations
  "tripadvisor.com",
  "priceline.com",
  "orbitz.com",
  "travelocity.com",
  "cheapflights.com",
  "momondo.com",
  "kiwi.com",
  "lastminute.com",
  "opodo.com",
  "edreams.com",
  "gotogate.com",
  "trip.com",
  "ctrip.com",
  "makemytrip.com",
  "cleartrip.com",
  "yatra.com",
  "webjet.com.au",
  "flightcentre.com",
  "studentuniverse.com",
  "scottscheapflights.com",

  // Corporate Travel
  "concur.com",
  "egencia.com",
  "amexgbt.com",
  "cwt.com",
  "travelperk.com",
];

// Keywords that indicate flight booking emails
export const FLIGHT_KEYWORDS = [
  "flight confirmation",
  "booking confirmation",
  "e-ticket",
  "itinerary",
  "your trip",
  "your flight",
  "travel confirmation",
  "reservation confirmed",
  "booking reference",
  "confirmation number",
  "check-in",
  "boarding pass",
];

// High-confidence subject line patterns (most booking emails have these in subject)
export const SUBJECT_PATTERNS = [
  "flight confirmation",
  "booking confirmed",
  "booking confirmation",
  "your flight",
  "e-ticket",
  "itinerary",
  "boarding pass",
  "check-in reminder",
  "trip confirmation",
  "confirmation", // Broader - catches "Your confirmation", "Booking confirmation", etc.
  "your booking",
  "travel itinerary",
  "flight details",
  "ready to fly",
];

/**
 * Build Gmail search query for flight booking emails (DEEP SYNC)
 *
 * This is the broadest search - finds any email that might contain flight info:
 * 1. Any email from known airline domains
 * 2. Any email with flight-related keywords in subject OR body
 *
 * @param lookbackDays - Number of days to look back
 * @returns Gmail search query string
 */
export function buildGmailQuery(lookbackDays: number = 365): string {
  // Calculate the after date
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - lookbackDays);
  const afterStr = afterDate.toISOString().split("T")[0].replace(/-/g, "/");

  // Top airline senders (most common - keeps query shorter)
  const topAirlines = [
    "easyjet.com",
    "ryanair.com",
    "britishairways.com",
    "jet2.com",
    "vueling.com",
    "wizzair.com",
    "emirates.com",
    "united.com",
    "delta.com",
    "aa.com",
    "southwest.com",
    "lufthansa.com",
    "airfrance.fr",
    "klm.com",
  ];
  const senderQuery = topAirlines.map((s) => `from:${s}`).join(" OR ");

  // Broad keyword search (searches body AND subject)
  // These words appear in almost every flight booking email
  const bodyKeywords = [
    "flight",
    "booking reference",
    "confirmation code",
    "e-ticket",
    "departure",
    "boarding",
  ];
  const keywordQuery = bodyKeywords.map((k) => `"${k}"`).join(" OR ");

  // Subject-specific patterns
  const subjectQuery = [
    'subject:"confirmation"',
    'subject:"booking"',
    'subject:"itinerary"',
    'subject:"flight"',
    'subject:"e-ticket"',
  ].join(" OR ");

  // Combine: (from airlines) OR (keywords in body) OR (keywords in subject)
  const query = `((${senderQuery}) OR (${keywordQuery}) OR (${subjectQuery})) after:${afterStr} -category:promotions -category:social -category:updates`;

  return query;
}

/**
 * Build an optimized query that requires "flight" keyword
 *
 * Strategy: Email must contain "flight" AND one of our booking indicators
 * This dramatically reduces false positives and speeds up sync
 */
export function buildSimpleQuery(lookbackDays: number = 365): string {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - lookbackDays);
  const afterStr = afterDate.toISOString().split("T")[0].replace(/-/g, "/");

  // Booking indicators (must have "flight" + one of these)
  const bookingIndicators = [
    "confirmation",
    "booking",
    "e-ticket",
    "itinerary",
    "reservation",
    "check-in",
    "boarding",
  ];

  // Build query: must contain "flight" AND one booking indicator
  // Gmail query: flight AND (confirmation OR booking OR e-ticket...)
  const indicatorQuery = bookingIndicators.map((k) => `"${k}"`).join(" OR ");

  return `flight (${indicatorQuery}) after:${afterStr} -category:promotions -category:social -category:updates`;
}

/**
 * Build the smartest possible query - subject-line focused (QUICK SYNC)
 *
 * Balanced approach:
 * - Searches subject lines for booking-related terms
 * - Includes "confirmation" which catches most booking emails
 * - Fast but comprehensive
 */
export function buildSmartQuery(lookbackDays: number = 365): string {
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - lookbackDays);
  const afterStr = afterDate.toISOString().split("T")[0].replace(/-/g, "/");

  // Subject patterns - "confirmation" alone catches a lot
  const subjectPatterns = [
    'subject:"flight"',
    'subject:"booking confirmation"',
    'subject:"your booking"',
    'subject:"e-ticket"',
    'subject:"itinerary"',
    'subject:"boarding pass"',
    'subject:"check-in"',
  ].join(" OR ");

  return `(${subjectPatterns}) after:${afterStr} -category:promotions -category:social`;
}
