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
    short: "bg-teal",
    medium: "bg-[#B8791F]",
    long: "bg-brick",
  };

  const haulLabels: Record<HaulType, string> = {
    short: "Short-haul (<1,500 km)",
    medium: "Medium-haul (1,500-4,000 km)",
    long: "Long-haul (>4,000 km)",
  };

  return (
    <div className="bg-pass border border-line rounded-xl p-6">
      <h2 className="font-display font-extrabold text-xl mb-6 text-ink">
        Flight statistics &amp; carbon footprint
      </h2>

      {landedFlights.length === 0 ? (
        <p className="text-ink-soft text-center py-8">
          Complete some flights to see your statistics and carbon footprint analysis.
        </p>
      ) : (
        <div className="space-y-8">
          {/* Main CO2 Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-stub rounded-lg border border-line">
              <div className="text-3xl font-ticket text-teal font-medium">
                {formatCO2(totalCO2)}
              </div>
              <div className="text-ink mt-2 text-sm font-medium">Total CO₂ emissions</div>
              <div className="text-ink-soft text-xs mt-1">
                Including radiative forcing (×1.9)
              </div>
            </div>
            <div className="text-center p-6 bg-stub rounded-lg border border-line">
              <div className="text-3xl font-ticket text-ink font-medium">
                {treesNeeded.toLocaleString()}
              </div>
              <div className="text-ink mt-2 text-sm font-medium">Trees to offset</div>
              <div className="text-ink-soft text-xs mt-1">
                For one year of carbon absorption
              </div>
            </div>
            <div className="text-center p-6 bg-stub rounded-lg border border-line">
              <div className="text-3xl font-ticket text-ink font-medium">
                {formatCO2(avgCO2)}
              </div>
              <div className="text-ink mt-2 text-sm font-medium">Avg per flight</div>
              <div className="text-ink-soft text-xs mt-1">
                Across {landedFlights.length} flights
              </div>
            </div>
          </div>

          {/* CO2 by Haul Type */}
          <div>
            <h3 className="font-ticket text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-4">
              Emissions by flight distance
            </h3>
            <div className="space-y-4">
              {(["short", "medium", "long"] as HaulType[]).map((haul) => {
                const percentage = totalCO2 > 0 ? (co2ByHaul[haul] / totalCO2) * 100 : 0;
                return (
                  <div key={haul}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink">{haulLabels[haul]}</span>
                      <span className="text-ink-soft font-ticket text-xs">
                        {formatCO2(co2ByHaul[haul])} ({flightsByHaul[haul]} flights)
                      </span>
                    </div>
                    <div className="h-3 bg-stub rounded-full overflow-hidden border border-line">
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
            <h3 className="font-ticket text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-4">
              Equivalent to
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-baseline gap-3 p-4 bg-stub rounded-lg border border-line">
                <div className="font-ticket text-2xl text-ink">
                  {carsEquivalent > 0 ? carsEquivalent : "<1"}
                </div>
                <div className="text-ink-soft text-sm">
                  year{carsEquivalent !== 1 ? "s" : ""} of driving a car
                </div>
              </div>
              <div className="flex items-baseline gap-3 p-4 bg-stub rounded-lg border border-line">
                <div className="font-ticket text-2xl text-ink">
                  {householdsEquivalent > 0 ? householdsEquivalent : "<1"}
                </div>
                <div className="text-ink-soft text-sm">
                  year{householdsEquivalent !== 1 ? "s" : ""} of household emissions
                </div>
              </div>
              <div className="flex items-baseline gap-3 p-4 bg-stub rounded-lg border border-line">
                <div className="font-ticket text-2xl text-ink">{uniqueCountries}</div>
                <div className="text-ink-soft text-sm">countries visited</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 bg-teal/10 border border-teal/25 rounded-lg">
            <h3 className="text-teal font-semibold mb-2 text-sm">Reduce your impact</h3>
            <ul className="text-sm text-ink space-y-1">
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
