"use client";

import { useState, useEffect } from "react";
import { Flight } from "./FlightCard";
import { calculateFlightCO2, formatCO2, HaulType } from "@/lib/co2-calculator";

interface CarbonInsightsProps {
  flights: Flight[];
}

interface CarbonEquivalent {
  emoji: string;
  value: string;
  label: string;
  description: string;
}

interface EquivalentsResponse {
  equivalents: CarbonEquivalent[];
  treesNeeded: number;
  offsetCost: number;
}

export default function CarbonInsights({ flights }: CarbonInsightsProps) {
  const [equivalents, setEquivalents] = useState<CarbonEquivalent[]>([]);
  const [treesNeeded, setTreesNeeded] = useState(0);
  const [offsetCost, setOffsetCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate totals from flights
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const landedFlights = flights.filter(
    (f) => f.status === "landed" || new Date(f.date + "T00:00:00") < today
  );

  // Calculate CO2 breakdown by haul type
  const co2ByHaul: Record<HaulType, number> = { short: 0, medium: 0, long: 0 };
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

  // Count unique countries
  const uniqueCountries = new Set(
    flights
      .flatMap((f) => [f.departure_country, f.arrival_country])
      .filter((c): c is string => c !== null && c !== undefined)
  ).size;

  // Fetch AI-generated equivalents
  const fetchEquivalents = async (showRefreshState = false) => {
    if (totalCO2 === 0) {
      setEquivalents([]);
      setTreesNeeded(0);
      setOffsetCost(0);
      return;
    }

    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/carbon-equivalents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ co2Kg: totalCO2 }),
      });

      if (response.ok) {
        const data: EquivalentsResponse = await response.json();
        setEquivalents(data.equivalents);
        setTreesNeeded(data.treesNeeded);
        setOffsetCost(data.offsetCost);
      }
    } catch (error) {
      console.error("Failed to fetch equivalents:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquivalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCO2]);

  const haulColors: Record<HaulType, string> = {
    short: "from-blue-500 to-blue-600",
    medium: "from-amber to-amber-600",
    long: "from-red-500 to-red-600",
  };

  const haulLabels: Record<HaulType, string> = {
    short: "Short (<1,500km)",
    medium: "Medium (1,500-4,000km)",
    long: "Long (>4,000km)",
  };

  if (landedFlights.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">🌍</div>
        <h2 className="text-xl font-semibold mb-2">Carbon Impact</h2>
        <p className="text-gray-400">
          Complete some flights to see your carbon footprint analysis and personalized insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            Carbon Impact
          </h2>
          <button
            onClick={() => fetchEquivalents(true)}
            disabled={isRefreshing}
            className="text-sm text-gray-400 hover:text-amber transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isRefreshing ? (
              <span className="animate-spin">↻</span>
            ) : (
              <span>↻</span>
            )}
            New insights
          </button>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="text-5xl font-mono text-amber font-bold mb-2">
              {formatCO2(totalCO2)}
            </div>
            <div className="text-gray-400">Total CO₂ Emissions</div>
            <div className="text-gray-500 text-sm mt-1">
              Including radiative forcing (×1.9)
            </div>
          </div>

          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="text-5xl font-mono text-green-400 font-bold mb-2">
              🌳 {treesNeeded.toLocaleString()}
            </div>
            <div className="text-gray-400">Trees Needed</div>
            <div className="text-gray-500 text-sm mt-1">
              To absorb in one year
            </div>
          </div>

          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="text-5xl font-mono text-blue-400 font-bold mb-2">
              £{offsetCost.toFixed(0)}
            </div>
            <div className="text-gray-400">Offset Cost</div>
            <div className="text-gray-500 text-sm mt-1">
              Via certified programs
            </div>
          </div>
        </div>

        {/* AI-Generated Equivalents */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            That&apos;s equivalent to...
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 rounded-xl p-5 animate-pulse"
                >
                  <div className="h-10 bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {equivalents.map((eq, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 hover:border-amber/30 transition-colors group"
                >
                  <div className="text-4xl mb-2">{eq.emoji}</div>
                  <div className="text-2xl font-mono text-white font-bold">
                    {eq.value}
                  </div>
                  <div className="text-gray-300 text-sm">{eq.label}</div>
                  <div className="text-gray-500 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {eq.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emissions by Haul Type */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Emissions by Flight Distance
          </h3>
          <div className="space-y-3">
            {(["short", "medium", "long"] as HaulType[]).map((haul) => {
              const percentage =
                totalCO2 > 0 ? (co2ByHaul[haul] / totalCO2) * 100 : 0;
              return (
                <div key={haul}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{haulLabels[haul]}</span>
                    <span className="text-gray-400 font-mono">
                      {formatCO2(co2ByHaul[haul])} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${haulColors[haul]} rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-mono text-amber font-bold">
            {landedFlights.length}
          </div>
          <div className="text-gray-400 text-sm">Flights Completed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-mono text-amber font-bold">
            {totalDistance.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm">Kilometers Flown</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-mono text-amber font-bold">
            {uniqueCountries}
          </div>
          <div className="text-gray-400 text-sm">Countries Visited</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-3xl font-mono text-amber font-bold">
            {formatCO2(landedFlights.length > 0 ? totalCO2 / landedFlights.length : 0)}
          </div>
          <div className="text-gray-400 text-sm">Avg per Flight</div>
        </div>
      </div>

      {/* Offset CTA */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/50 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-green-400 font-semibold text-lg mb-1">
              Offset Your Impact
            </h3>
            <p className="text-gray-300 text-sm">
              For approximately <span className="font-mono text-green-400">£{offsetCost.toFixed(2)}</span>,
              you can offset your {formatCO2(totalCO2)} of emissions through verified carbon reduction projects.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://www.goldstandard.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm font-medium"
            >
              Gold Standard
            </a>
            <a
              href="https://www.atmosfair.de/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Atmosfair
            </a>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Tips to Reduce Your Impact
        </h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-amber">•</span>
            <span>Choose direct flights when possible — takeoff and landing use the most fuel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber">•</span>
            <span>Consider trains for journeys under 500km — they emit ~90% less CO₂</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber">•</span>
            <span>Fly economy class — business class has 3× the carbon footprint per passenger</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber">•</span>
            <span>Pack light — every extra kg increases fuel consumption</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
