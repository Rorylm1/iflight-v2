/**
 * Airport Database & Utilities
 *
 * Contains major world airports with coordinates for distance calculation.
 * Data is stored in-memory for fast lookups (no DB query needed).
 */

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Major world airports (~150 airports covering most commercial routes)
 */
export const AIRPORTS: Record<string, Airport> = {
  // United Kingdom
  LHR: { iata: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", lat: 51.4700, lng: -0.4543 },
  LGW: { iata: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom", lat: 51.1537, lng: -0.1821 },
  STN: { iata: "STN", name: "Stansted Airport", city: "London", country: "United Kingdom", lat: 51.8860, lng: 0.2389 },
  LTN: { iata: "LTN", name: "Luton Airport", city: "London", country: "United Kingdom", lat: 51.8747, lng: -0.3683 },
  MAN: { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", lat: 53.3537, lng: -2.2750 },
  EDI: { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", lat: 55.9500, lng: -3.3725 },
  BHX: { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", lat: 52.4539, lng: -1.7480 },
  INV: { iata: "INV", name: "Inverness Airport", city: "Inverness", country: "United Kingdom", lat: 57.5425, lng: -4.0475 },
  GLA: { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", lat: 55.8719, lng: -4.4331 },
  BRS: { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", lat: 51.3827, lng: -2.7190 },
  NCL: { iata: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", lat: 55.0375, lng: -1.6917 },
  BFS: { iata: "BFS", name: "Belfast International", city: "Belfast", country: "United Kingdom", lat: 54.6575, lng: -6.2158 },
  LBA: { iata: "LBA", name: "Leeds Bradford Airport", city: "Leeds", country: "United Kingdom", lat: 53.8659, lng: -1.6606 },

  // United States
  JFK: { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", lat: 40.6413, lng: -73.7781 },
  LAX: { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", lat: 33.9425, lng: -118.4081 },
  ORD: { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "United States", lat: 41.9742, lng: -87.9073 },
  SFO: { iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States", lat: 37.6213, lng: -122.3790 },
  MIA: { iata: "MIA", name: "Miami International", city: "Miami", country: "United States", lat: 25.7959, lng: -80.2870 },
  DFW: { iata: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "United States", lat: 32.8998, lng: -97.0403 },
  ATL: { iata: "ATL", name: "Hartsfield-Jackson Atlanta", city: "Atlanta", country: "United States", lat: 33.6407, lng: -84.4277 },
  DEN: { iata: "DEN", name: "Denver International", city: "Denver", country: "United States", lat: 39.8561, lng: -104.6737 },
  SEA: { iata: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "United States", lat: 47.4502, lng: -122.3088 },
  BOS: { iata: "BOS", name: "Logan International", city: "Boston", country: "United States", lat: 42.3656, lng: -71.0096 },
  EWR: { iata: "EWR", name: "Newark Liberty International", city: "Newark", country: "United States", lat: 40.6895, lng: -74.1745 },
  IAD: { iata: "IAD", name: "Washington Dulles International", city: "Washington D.C.", country: "United States", lat: 38.9531, lng: -77.4565 },
  LAS: { iata: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "United States", lat: 36.0840, lng: -115.1537 },
  PHX: { iata: "PHX", name: "Phoenix Sky Harbor", city: "Phoenix", country: "United States", lat: 33.4373, lng: -112.0078 },
  IAH: { iata: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "United States", lat: 29.9902, lng: -95.3368 },
  MSP: { iata: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis", country: "United States", lat: 44.8848, lng: -93.2223 },
  DTW: { iata: "DTW", name: "Detroit Metropolitan", city: "Detroit", country: "United States", lat: 42.2124, lng: -83.3534 },
  PHL: { iata: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "United States", lat: 39.8729, lng: -75.2437 },
  CLT: { iata: "CLT", name: "Charlotte Douglas International", city: "Charlotte", country: "United States", lat: 35.2140, lng: -80.9431 },
  HNL: { iata: "HNL", name: "Daniel K. Inouye International", city: "Honolulu", country: "United States", lat: 21.3245, lng: -157.9251 },

  // Europe
  CDG: { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479 },
  ORY: { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", lat: 48.7262, lng: 2.3652 },
  FRA: { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622 },
  MUC: { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", lat: 48.3537, lng: 11.7750 },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lng: 4.7683 },
  MAD: { iata: "MAD", name: "Madrid-Barajas", city: "Madrid", country: "Spain", lat: 40.4983, lng: -3.5676 },
  BCN: { iata: "BCN", name: "Barcelona-El Prat", city: "Barcelona", country: "Spain", lat: 41.2974, lng: 2.0833 },
  FCO: { iata: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389 },
  MXP: { iata: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", lat: 45.6306, lng: 8.7281 },
  ZRH: { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", lat: 47.4647, lng: 8.5492 },
  VIE: { iata: "VIE", name: "Vienna International", city: "Vienna", country: "Austria", lat: 48.1103, lng: 16.5697 },
  BRU: { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", lat: 50.9014, lng: 4.4844 },
  CPH: { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", lat: 55.6180, lng: 12.6508 },
  OSL: { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", lat: 60.1939, lng: 11.1004 },
  ARN: { iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", lat: 59.6519, lng: 17.9186 },
  HEL: { iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland", lat: 60.3172, lng: 24.9633 },
  DUB: { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", lat: 53.4264, lng: -6.2499 },
  LIS: { iata: "LIS", name: "Lisbon Portela", city: "Lisbon", country: "Portugal", lat: 38.7756, lng: -9.1354 },
  ATH: { iata: "ATH", name: "Athens International", city: "Athens", country: "Greece", lat: 37.9364, lng: 23.9445 },
  IST: { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519 },
  WAW: { iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", lat: 52.1657, lng: 20.9671 },
  PRG: { iata: "PRG", name: "Václav Havel Airport", city: "Prague", country: "Czech Republic", lat: 50.1008, lng: 14.2600 },
  BUD: { iata: "BUD", name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hungary", lat: 47.4298, lng: 19.2611 },

  // Middle East
  DXB: { iata: "DXB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lng: 55.3657 },
  AUH: { iata: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4330, lng: 54.6511 },
  DOH: { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", lat: 25.2731, lng: 51.6081 },
  TLV: { iata: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", lat: 32.0055, lng: 34.8854 },
  AMM: { iata: "AMM", name: "Queen Alia International", city: "Amman", country: "Jordan", lat: 31.7226, lng: 35.9932 },
  RUH: { iata: "RUH", name: "King Khalid International", city: "Riyadh", country: "Saudi Arabia", lat: 24.9576, lng: 46.6988 },
  JED: { iata: "JED", name: "King Abdulaziz International", city: "Jeddah", country: "Saudi Arabia", lat: 21.6796, lng: 39.1565 },
  BAH: { iata: "BAH", name: "Bahrain International", city: "Manama", country: "Bahrain", lat: 26.2708, lng: 50.6336 },
  KWI: { iata: "KWI", name: "Kuwait International", city: "Kuwait City", country: "Kuwait", lat: 29.2266, lng: 47.9689 },
  MCT: { iata: "MCT", name: "Muscat International", city: "Muscat", country: "Oman", lat: 23.5933, lng: 58.2844 },

  // Asia
  SIN: { iata: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915 },
  HKG: { iata: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "Hong Kong", lat: 22.3080, lng: 113.9185 },
  NRT: { iata: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", lat: 35.7720, lng: 140.3929 },
  HND: { iata: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798 },
  KIX: { iata: "KIX", name: "Kansai International", city: "Osaka", country: "Japan", lat: 34.4347, lng: 135.2441 },
  ICN: { iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", lat: 37.4602, lng: 126.4407 },
  PEK: { iata: "PEK", name: "Beijing Capital International", city: "Beijing", country: "China", lat: 40.0799, lng: 116.6031 },
  PVG: { iata: "PVG", name: "Shanghai Pudong International", city: "Shanghai", country: "China", lat: 31.1443, lng: 121.8083 },
  CAN: { iata: "CAN", name: "Guangzhou Baiyun International", city: "Guangzhou", country: "China", lat: 23.3924, lng: 113.2988 },
  TPE: { iata: "TPE", name: "Taiwan Taoyuan International", city: "Taipei", country: "Taiwan", lat: 25.0797, lng: 121.2342 },
  BKK: { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501 },
  KUL: { iata: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaysia", lat: 2.7456, lng: 101.7099 },
  CGK: { iata: "CGK", name: "Soekarno-Hatta International", city: "Jakarta", country: "Indonesia", lat: -6.1256, lng: 106.6559 },
  MNL: { iata: "MNL", name: "Ninoy Aquino International", city: "Manila", country: "Philippines", lat: 14.5086, lng: 121.0197 },
  DEL: { iata: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", lat: 28.5562, lng: 77.1000 },
  BOM: { iata: "BOM", name: "Chhatrapati Shivaji International", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656 },
  BLR: { iata: "BLR", name: "Kempegowda International", city: "Bangalore", country: "India", lat: 13.1986, lng: 77.7066 },
  HAN: { iata: "HAN", name: "Noi Bai International", city: "Hanoi", country: "Vietnam", lat: 21.2212, lng: 105.8072 },
  SGN: { iata: "SGN", name: "Tan Son Nhat International", city: "Ho Chi Minh City", country: "Vietnam", lat: 10.8188, lng: 106.6520 },

  // Oceania
  SYD: { iata: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753 },
  MEL: { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", lat: -37.6690, lng: 144.8410 },
  BNE: { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", lat: -27.3842, lng: 153.1175 },
  PER: { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia", lat: -31.9403, lng: 115.9672 },
  AKL: { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", lat: -37.0082, lng: 174.7850 },
  WLG: { iata: "WLG", name: "Wellington International", city: "Wellington", country: "New Zealand", lat: -41.3272, lng: 174.8053 },

  // Africa
  JNB: { iata: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "South Africa", lat: -26.1367, lng: 28.2411 },
  CPT: { iata: "CPT", name: "Cape Town International", city: "Cape Town", country: "South Africa", lat: -33.9715, lng: 18.6021 },
  CAI: { iata: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt", lat: 30.1219, lng: 31.4056 },
  ADD: { iata: "ADD", name: "Addis Ababa Bole International", city: "Addis Ababa", country: "Ethiopia", lat: 8.9779, lng: 38.7993 },
  NBO: { iata: "NBO", name: "Jomo Kenyatta International", city: "Nairobi", country: "Kenya", lat: -1.3192, lng: 36.9278 },
  CMN: { iata: "CMN", name: "Mohammed V International", city: "Casablanca", country: "Morocco", lat: 33.3675, lng: -7.5898 },
  LOS: { iata: "LOS", name: "Murtala Muhammed International", city: "Lagos", country: "Nigeria", lat: 6.5774, lng: 3.3212 },

  // South America
  GRU: { iata: "GRU", name: "São Paulo-Guarulhos International", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731 },
  GIG: { iata: "GIG", name: "Rio de Janeiro-Galeão International", city: "Rio de Janeiro", country: "Brazil", lat: -22.8090, lng: -43.2506 },
  EZE: { iata: "EZE", name: "Ministro Pistarini International", city: "Buenos Aires", country: "Argentina", lat: -34.8222, lng: -58.5358 },
  SCL: { iata: "SCL", name: "Arturo Merino Benítez International", city: "Santiago", country: "Chile", lat: -33.3930, lng: -70.7858 },
  BOG: { iata: "BOG", name: "El Dorado International", city: "Bogotá", country: "Colombia", lat: 4.7016, lng: -74.1469 },
  LIM: { iata: "LIM", name: "Jorge Chávez International", city: "Lima", country: "Peru", lat: -12.0219, lng: -77.1143 },

  // Central America & Caribbean
  MEX: { iata: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico", lat: 19.4363, lng: -99.0721 },
  CUN: { iata: "CUN", name: "Cancún International", city: "Cancún", country: "Mexico", lat: 21.0365, lng: -86.8771 },
  PTY: { iata: "PTY", name: "Tocumen International", city: "Panama City", country: "Panama", lat: 9.0714, lng: -79.3835 },
  SJO: { iata: "SJO", name: "Juan Santamaría International", city: "San José", country: "Costa Rica", lat: 9.9939, lng: -84.2088 },
  MBJ: { iata: "MBJ", name: "Sangster International", city: "Montego Bay", country: "Jamaica", lat: 18.5037, lng: -77.9134 },
  NAS: { iata: "NAS", name: "Lynden Pindling International", city: "Nassau", country: "Bahamas", lat: 25.0390, lng: -77.4662 },

  // Canada
  YYZ: { iata: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248 },
  YVR: { iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada", lat: 49.1947, lng: -123.1792 },
  YUL: { iata: "YUL", name: "Montréal-Trudeau International", city: "Montreal", country: "Canada", lat: 45.4706, lng: -73.7408 },
  YYC: { iata: "YYC", name: "Calgary International", city: "Calgary", country: "Canada", lat: 51.1215, lng: -114.0076 },
};

/**
 * Look up an airport by IATA code
 */
export function getAirport(iata: string): Airport | null {
  return AIRPORTS[iata.toUpperCase()] || null;
}

/**
 * Calculate distance between two airports using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  departureIata: string,
  arrivalIata: string
): number | null {
  const departure = getAirport(departureIata);
  const arrival = getAirport(arrivalIata);

  if (!departure || !arrival) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((arrival.lat - departure.lat) * Math.PI) / 180;
  const dLng = ((arrival.lng - departure.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((departure.lat * Math.PI) / 180) *
      Math.cos((arrival.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Get country from airport IATA code
 */
export function getCountry(iata: string): string | null {
  const airport = getAirport(iata);
  return airport?.country || null;
}
