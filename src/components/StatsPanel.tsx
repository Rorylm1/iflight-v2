"use client";

import { Flight } from "./FlightCard";
import { calculateFlightCO2, formatCO2, getTreeEquivalent, HaulType } from "@/lib/co2-calculator";

interface StatsPanelProps {
  flights: Flight[];
}

interface CO2ByHaul {
  short: number;
  medium: number;
  long: number;
}

export default function StatsPanel({ flights }: StatsPanelProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Only count landed/past flights for emissions
  const landedFlights = flights.filter(
    (f) => f.status === "landed" || new Date(f.date + "T00:00:00") < today
  );

  // Calculate CO2 breakdown by haul type
  const co2ByHaul: CO2ByHaul = { short: 0, medium: 0, long: 0 };
  let totalCO2 = 0;
  let totalDistance = 0;

  landedFlights.forEach((f) => {
    if (f.distance_km) {
      const result = calculateFlightCO2(f.distance_km);
      co2ByHaul[result.haul] += result.co2Kg;
      totalCO2 += result.co2Kg;
      totalDistance += f.distance_km;
    }
  });

  // Count flights by haul type
  const flightsByHaul = { short: 0, medium: 0, long: 0 };
  landedFlights.forEach((f) => {
    if (f.distance_km) {
      const result = calculateFlightCO2(f.distance_km);
      flightsByHaul[result.haul]++;
    }
  });

  // Get unique countries from airport country codes
  const uniqueCountries = new Set(
    flights
      .flatMap((f) => [f.departure_country, f.arrival_country])
      .filter((c): c is string => c !== null && c !== undefined)
  ).size;

  // Calculate average CO2 per flight
  const avgCO2 = landedFlights.length > 0 ? totalCO2 / landedFlights.length : 0;

  // Trees needed
  const treesNeeded = getTreeEquivalent(totalCO2);

  // Comparison metrics (fun facts)
  const carsEquivalent = Math.round(totalCO2 / 4600); // Average car emits ~4.6 tonnes/year
  const householdsEquivalent = Math.round(totalCO2 / 8100); // Average UK household ~8.1 tonnes/year

  const haulColors: Record<HaulType, string> = {
    short: "bg-blue-500",
    medium: "bg-amber",
    long: "bg-red-500",
  };

  const haulLabels: Record<HaulType, string> = {
    short: "Short-haul (<1,500 km)",
    medium: "Medium-haul (1,500-4,000 km)",
    long: "Long-haul (>4,000 km)",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Flight Statistics & Carbon Footprint
      </h2>

      {landedFlights.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Complete some flights to see your statistics and carbon footprint analysis.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Main CO2 Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-800/50 rounded-lg">
              <div className="text-4xl font-mono text-amber font-bold">
                {formatCO2(totalCO2)}
              </div>
              <div className="text-gray-400 mt-2">Total CO₂ Emissions</div>
              <div className="text-gray-500 text-sm mt-1">
                Including radiative forcing (×1.9)
              </div>
            </div>
            <div className="text-center p-6 bg-gray-800/50 rounded-lg">
              <div className="text-4xl font-mono text-green-400 font-bold">
                🌳 {treesNeeded.toLocaleString()}
              </div>
              <div className="text-gray-400 mt-2">Trees to Offset</div>
              <div className="text-gray-500 text-sm mt-1">
                For one year of carbon absorption
              </div>
            </div>
            <div className="text-center p-6 bg-gray-800/50 rounded-lg">
              <div className="text-4xl font-mono text-blue-400 font-bold">
                {formatCO2(avgCO2)}
              </div>
              <div className="text-gray-400 mt-2">Avg per Flight</div>
              <div className="text-gray-500 text-sm mt-1">
                Across {landedFlights.length} flights
              </div>
            </div>
          </div>

          {/* CO2 by Haul Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Emissions by Flight Distance
            </h3>
            <div className="space-y-4">
              {(["short", "medium", "long"] as HaulType[]).map((haul) => {
                const percentage = totalCO2 > 0 ? (co2ByHaul[haul] / totalCO2) * 100 : 0;
                return (
                  <div key={haul}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{haulLabels[haul]}</span>
                      <span className="text-gray-400">
                        {formatCO2(co2ByHaul[haul])} ({flightsByHaul[haul]} flights)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${haulColors[haul]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparisons */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Equivalent To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
                <span className="text-2xl">🚗</span>
                <div>
                  <div className="font-mono text-lg text-white">
                    {carsEquivalent > 0 ? carsEquivalent : "<1"} year{carsEquivalent !== 1 ? "s" : ""}
                  </div>
                  <div className="text-gray-500 text-sm">of driving a car</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-mono text-lg text-white">
                    {householdsEquivalent > 0 ? householdsEquivalent : "<1"} year{householdsEquivalent !== 1 ? "s" : ""}
                  </div>
                  <div className="text-gray-500 text-sm">of household emissions</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg">
                <span className="text-2xl">🌍</span>
                <div>
                  <div className="font-mono text-lg text-white">
                    {uniqueCountries} countries
                  </div>
                  <div className="text-gray-500 text-sm">visited</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reduce Your Impact
            </h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Choose direct flights when possible (takeoff/landing use the most fuel)</li>
              <li>• Consider train travel for short distances under 500 km</li>
              <li>• Offset your emissions through verified carbon offset programs</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
