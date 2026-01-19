/**
 * Mock Flight Enrichment
 *
 * Generates realistic fake flight data for development.
 * Will be replaced with real AeroDataBox API later.
 */

// Sample airlines with their IATA codes
const AIRLINES: Record<string, string> = {
  'BA': 'British Airways',
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'LH': 'Lufthansa',
  'AF': 'Air France',
  'KL': 'KLM Royal Dutch Airlines',
  'EK': 'Emirates',
  'QF': 'Qantas',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'JL': 'Japan Airlines',
  'NH': 'All Nippon Airways',
  'VS': 'Virgin Atlantic',
  'IB': 'Iberia',
  'AY': 'Finnair',
  'SK': 'SAS Scandinavian',
  'LX': 'Swiss International',
  'OS': 'Austrian Airlines',
  'EI': 'Aer Lingus',
};

// Sample airports with coordinates for distance calculation
const AIRPORTS: Record<string, { name: string; city: string; country: string; lat: number; lng: number }> = {
  'LHR': { name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  'JFK': { name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781 },
  'LAX': { name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', lat: 33.9425, lng: -118.4081 },
  'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  'DXB': { name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  'SIN': { name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  'HKG': { name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  'NRT': { name: 'Narita International', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929 },
  'SYD': { name: 'Sydney Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  'AMS': { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  'MAD': { name: 'Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lng: -3.5676 },
  'MUC': { name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.7750 },
  'ORD': { name: "O'Hare International", city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073 },
  'SFO': { name: 'San Francisco International', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.3790 },
};

// Sample aircraft types
const AIRCRAFT = [
  'Boeing 777-300ER',
  'Boeing 787-9 Dreamliner',
  'Boeing 747-400',
  'Airbus A380-800',
  'Airbus A350-900',
  'Airbus A320neo',
  'Boeing 737 MAX 8',
  'Airbus A330-300',
];

// Flight statuses
const STATUSES = ['scheduled', 'active', 'landed', 'cancelled', 'delayed'];

/**
 * Calculate distance between two airports using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Parse airline code from flight number (e.g., "BA123" -> "BA")
 */
function parseAirlineCode(flightNumber: string): string {
  const match = flightNumber.match(/^([A-Z]{2})/i);
  return match ? match[1].toUpperCase() : 'XX';
}

/**
 * Get a random item from an array
 */
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get random airport pair (departure and arrival)
 */
function getRandomAirportPair(): [string, string] {
  const codes = Object.keys(AIRPORTS);
  const departure = randomItem(codes);
  let arrival = randomItem(codes);
  // Ensure departure and arrival are different
  while (arrival === departure) {
    arrival = randomItem(codes);
  }
  return [departure, arrival];
}

export interface EnrichedFlightData {
  airline: string;
  departure_airport: string;
  departure_time: string; // ISO timestamp
  departure_terminal: string | null;
  arrival_airport: string;
  arrival_time: string; // ISO timestamp
  arrival_terminal: string | null;
  status: string;
  aircraft: string;
  distance_km: number;
}

/**
 * Mock enrichment function - generates fake flight data
 * In production, this would call AeroDataBox API
 */
export async function enrichFlight(
  flightNumber: string,
  date: string // YYYY-MM-DD format
): Promise<EnrichedFlightData> {
  // Simulate API delay (300-800ms)
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

  const airlineCode = parseAirlineCode(flightNumber);
  const airline = AIRLINES[airlineCode] || `${airlineCode} Airlines`;

  const [departureCode, arrivalCode] = getRandomAirportPair();
  const departureAirport = AIRPORTS[departureCode];
  const arrivalAirport = AIRPORTS[arrivalCode];

  // Generate departure time (random hour between 6am and 10pm)
  const departureHour = 6 + Math.floor(Math.random() * 16);
  const departureMinute = Math.floor(Math.random() * 12) * 5; // Round to 5 minutes
  const departureDate = new Date(`${date}T${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}:00Z`);

  // Calculate flight duration based on distance (rough estimate: 800 km/h average)
  const distance = calculateDistance(
    departureAirport.lat,
    departureAirport.lng,
    arrivalAirport.lat,
    arrivalAirport.lng
  );
  const flightDurationHours = distance / 800;
  const arrivalDate = new Date(departureDate.getTime() + flightDurationHours * 60 * 60 * 1000);

  // Determine status based on date
  const now = new Date();
  const flightDate = new Date(date);
  let status: string;

  if (flightDate > now) {
    status = 'scheduled';
  } else if (flightDate.toDateString() === now.toDateString()) {
    // Today - could be any status
    status = randomItem(['scheduled', 'active', 'landed', 'delayed']);
  } else {
    // Past flight
    status = Math.random() > 0.1 ? 'landed' : 'cancelled';
  }

  // Random terminal (or null ~30% of the time)
  const getTerminal = () => Math.random() > 0.3 ? String(Math.floor(Math.random() * 5) + 1) : null;

  return {
    airline,
    departure_airport: departureCode,
    departure_time: departureDate.toISOString(),
    departure_terminal: getTerminal(),
    arrival_airport: arrivalCode,
    arrival_time: arrivalDate.toISOString(),
    arrival_terminal: getTerminal(),
    status,
    aircraft: randomItem(AIRCRAFT),
    distance_km: distance,
  };
}
