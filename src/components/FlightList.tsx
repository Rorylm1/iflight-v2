"use client";

import { useState, useEffect, useCallback } from "react";
import FlightCard, { Flight } from "./FlightCard";
import AddFlightModal from "./AddFlightModal";
import GmailConnect from "./GmailConnect";
import StatsPanel from "./StatsPanel";
import { calculateFlightCO2, formatCO2, getTreeEquivalent } from "@/lib/co2-calculator";

export default function FlightList() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFlights = useCallback(async () => {
    try {
      const response = await fetch("/api/flights");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch flights");
      }

      setFlights(data.flights || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const handleFlightAdded = () => {
    fetchFlights();
  };

  const handleFlightDeleted = (deletedId: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== deletedId));
  };

  // Split flights into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingFlights = flights
    .filter((f) => new Date(f.date + "T00:00:00") >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastFlights = flights
    .filter((f) => new Date(f.date + "T00:00:00") < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats - only count distance from landed/past flights
  const landedFlights = flights.filter(
    (f) => f.status === "landed" || new Date(f.date + "T00:00:00") < today
  );
  const totalDistance = landedFlights.reduce((sum, f) => sum + (f.distance_km || 0), 0);
  const uniqueAirports = new Set(
    flights.flatMap((f) => [f.departure_airport, f.arrival_airport])
  ).size;
  const uniqueAirlines = new Set(flights.map((f) => f.airline)).size;

  // Calculate total CO2 emissions
  const totalCO2 = landedFlights.reduce((sum, f) => {
    if (f.distance_km) {
      return sum + calculateFlightCO2(f.distance_km).co2Kg;
    }
    return sum;
  }, 0);
  const treesNeeded = getTreeEquivalent(totalCO2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-brick/10 border border-brick/40 rounded-md text-brick">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Masthead + Add Flight */}
      <div className="mb-8 flex justify-between items-end gap-4 pb-5 border-b-2 border-ink/80">
        <div>
          <p className="font-ticket text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-2">
            Your travel log · {flights.length} sector{flights.length === 1 ? "" : "s"}
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-none">
            Boarding passes
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 px-5 py-3 bg-teal text-pass font-semibold rounded-md hover:bg-teal-soft transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add flight
        </button>
      </div>

      {/* Flight Sections */}
      {flights.length === 0 ? (
        <div className="border-2 border-line border-dashed rounded-xl p-12 text-center bg-pass/60">
          <div className="font-display font-extrabold text-3xl text-ink mb-2">
            No passes yet
          </div>
          <p className="text-ink-soft mb-6">
            Add your first flight to start your boarding-pass log.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal text-pass font-semibold rounded-md hover:bg-teal-soft transition-colors"
          >
            Add your first flight
          </button>
        </div>
      ) : (
        <div id="passes-perspective" className="space-y-10">
          {/* Upcoming Flights */}
          {upcomingFlights.length > 0 && (
            <section>
              <h2 className="font-ticket text-[11px] uppercase tracking-[0.2em] text-ink-soft mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                Upcoming · {upcomingFlights.length}
              </h2>
              <div className="space-y-6">
                {upcomingFlights.map((flight, i) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onDelete={handleFlightDeleted}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past Flights */}
          {pastFlights.length > 0 && (
            <section>
              <h2 className="font-ticket text-[11px] uppercase tracking-[0.2em] text-ink-soft mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-faint"></span>
                Flown · {pastFlights.length}
              </h2>
              <div className="space-y-6">
                {pastFlights.map((flight, i) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onDelete={handleFlightDeleted}
                    index={upcomingFlights.length + i}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Frequent-flyer summary band */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 rounded-xl border border-line bg-pass overflow-hidden divide-x divide-y divide-line md:divide-y-0">
        {[
          { v: flights.length.toString(), k: "Flights" },
          { v: `${totalDistance.toLocaleString()} km`, k: "Distance" },
          { v: uniqueAirports.toString(), k: "Airports" },
          { v: uniqueAirlines.toString(), k: "Airlines" },
          { v: formatCO2(totalCO2), k: "CO₂ est." },
          { v: treesNeeded.toString(), k: "Trees to offset" },
        ].map((s) => (
          <div key={s.k} className="p-4">
            <div className="font-ticket text-xl text-ink leading-tight">{s.v}</div>
            <div className="font-ticket text-[10px] uppercase tracking-[0.14em] text-ink-soft mt-1">
              {s.k}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Panel */}
      {flights.length > 0 && (
        <div className="mt-12">
          <StatsPanel flights={flights} />
        </div>
      )}

      {/* Gmail Sync */}
      <div className="mt-12 bg-pass border border-line rounded-xl p-6">
        <h2 className="font-display font-extrabold text-xl mb-2 text-ink">
          Import from Gmail
        </h2>
        <p className="text-ink-soft text-sm mb-4">
          Connect your inbox to automatically find and import flight bookings.
        </p>
        <GmailConnect onSyncComplete={fetchFlights} />
      </div>

      {/* Add Flight Modal */}
      <AddFlightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFlightAdded={handleFlightAdded}
      />
    </>
  );
}
