"use client";

import { useState, useEffect } from "react";
import { Flight } from "./FlightCard";
import { calculateFlightCO2, formatCO2, HaulType } from "@/lib/co2-calculator";

interface CarbonInsightsProps {
  flights: Flight[];
}

interface CarbonEquivalent {
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
    short: "bg-teal",
    medium: "bg-[#B8791F]",
    long: "bg-brick",
  };

  const haulLabels: Record<HaulType, string> = {
    short: "Short (<1,500km)",
    medium: "Medium (1,500-4,000km)",
    long: "Long (>4,000km)",
  };

  if (landedFlights.length === 0) {
    return (
      <div className="bg-pass border border-line rounded-xl p-8 text-center">
        <h2 className="font-display font-extrabold text-2xl mb-2 text-ink">
          Carbon impact
        </h2>
        <p className="text-ink-soft">
          Complete some flights to see your carbon footprint analysis and personalized insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Header */}
      <div className="bg-pass border border-line rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-extrabold text-2xl text-ink">
            Carbon impact
          </h2>
          <button
            onClick={() => fetchEquivalents(true)}
            disabled={isRefreshing}
            className="text-sm text-ink-soft hover:text-teal transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>↻</span>
            New insights
          </button>
        </div>

        {/* Hero Stats — three ticket stubs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-6 bg-stub rounded-lg border border-line">
            <div className="text-4xl font-ticket text-teal font-medium mb-2">
              {formatCO2(totalCO2)}
            </div>
            <div className="text-ink text-sm font-medium">Total CO₂ emissions</div>
            <div className="text-ink-soft text-xs mt-1">
              Including radiative forcing (×1.9)
            </div>
          </div>

          <div className="text-center p-6 bg-stub rounded-lg border border-line">
            <div className="text-4xl font-ticket text-ink font-medium mb-2">
              {treesNeeded.toLocaleString()}
            </div>
            <div className="text-ink text-sm font-medium">Trees to offset</div>
            <div className="text-ink-soft text-xs mt-1">To absorb in one year</div>
          </div>

          <div className="text-center p-6 bg-stub rounded-lg border border-line">
            <div className="text-4xl font-ticket text-ink font-medium mb-2">
              £{offsetCost.toFixed(0)}
            </div>
            <div className="text-ink text-sm font-medium">Offset cost</div>
            <div className="text-ink-soft text-xs mt-1">Via certified programs</div>
          </div>
        </div>

        {/* AI-Generated Equivalents */}
        <div className="mb-8">
          <h3 className="font-ticket text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-4">
            That&apos;s equivalent to...
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-stub rounded-lg p-5 border border-line animate-pulse">
                  <div className="h-8 bg-line rounded mb-3"></div>
                  <div className="h-3 bg-line rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {equivalents.map((eq, index) => (
                <div
                  key={index}
                  className="bg-stub rounded-lg p-5 border border-line hover:border-teal/40 transition-colors group"
                >
                  <div className="text-2xl font-ticket text-ink font-medium">
                    {eq.value}
                  </div>
                  <div className="text-ink text-sm mt-1">{eq.label}</div>
                  <div className="text-ink-soft text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {eq.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emissions by Haul Type */}
        <div>
          <h3 className="font-ticket text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-4">
            Emissions by flight distance
          </h3>
          <div className="space-y-3">
            {(["short", "medium", "long"] as HaulType[]).map((haul) => {
              const percentage =
                totalCO2 > 0 ? (co2ByHaul[haul] / totalCO2) * 100 : 0;
              return (
                <div key={haul}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink">{haulLabels[haul]}</span>
                    <span className="text-ink-soft font-ticket text-xs">
                      {formatCO2(co2ByHaul[haul])} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-stub rounded-full overflow-hidden border border-line">
                    <div
                      className={`h-full ${haulColors[haul]} rounded-full transition-all duration-700`}
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
      <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-line bg-pass overflow-hidden divide-x divide-y divide-line md:divide-y-0">
        {[
          { v: landedFlights.length.toString(), k: "Flights completed" },
          { v: totalDistance.toLocaleString(), k: "Kilometers flown" },
          { v: uniqueCountries.toString(), k: "Countries visited" },
          {
            v: formatCO2(landedFlights.length > 0 ? totalCO2 / landedFlights.length : 0),
            k: "Avg per flight",
          },
        ].map((s) => (
          <div key={s.k} className="p-4 text-center">
            <div className="font-ticket text-2xl text-ink">{s.v}</div>
            <div className="font-ticket text-[10px] uppercase tracking-[0.14em] text-ink-soft mt-1">
              {s.k}
            </div>
          </div>
        ))}
      </div>

      {/* Offset CTA */}
      <div className="bg-teal/10 border border-teal/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-teal font-semibold text-lg mb-1">Offset your impact</h3>
            <p className="text-ink text-sm">
              For approximately{" "}
              <span className="font-ticket text-teal">£{offsetCost.toFixed(2)}</span>, you
              can offset your {formatCO2(totalCO2)} of emissions through verified carbon
              reduction projects.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href="https://www.goldstandard.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-teal text-pass rounded-md hover:bg-teal-soft transition-colors text-sm font-medium"
            >
              Gold Standard
            </a>
            <a
              href="https://www.atmosfair.de/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-stub border border-line text-ink rounded-md hover:border-teal transition-colors text-sm font-medium"
            >
              Atmosfair
            </a>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-pass border border-line rounded-xl p-6">
        <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
          Tips to reduce your impact
        </h3>
        <ul className="space-y-2 text-ink-soft text-sm">
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Choose direct flights when possible — takeoff and landing use the most fuel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Consider trains for journeys under 500km — they emit ~90% less CO₂</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Fly economy class — business class has 3× the carbon footprint per passenger</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal">•</span>
            <span>Pack light — every extra kg increases fuel consumption</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
