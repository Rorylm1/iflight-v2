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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Add Flight Button */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Your Flights</h1>
          <p className="text-gray-400">Track and manage your flight history</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-amber text-black font-semibold rounded hover:bg-amber-400 transition-colors flex items-center gap-2"
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
          Add Flight
        </button>
      </div>

      {/* Flight Sections */}
      {flights.length === 0 ? (
        <div className="border border-gray-800 border-dashed rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold mb-2">No flights yet</h2>
          <p className="text-gray-400 mb-6">
            Add your first flight to start tracking your journey
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-amber text-black font-semibold rounded hover:bg-amber-400 transition-colors"
          >
            Add Your First Flight
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Flights */}
          {upcomingFlights.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Upcoming Flights
                <span className="text-gray-500 font-normal">
                  ({upcomingFlights.length})
                </span>
              </h2>
              <div className="space-y-3">
                {upcomingFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onDelete={handleFlightDeleted}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past Flights */}
          {pastFlights.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                Past Flights
                <span className="text-gray-500 font-normal">
                  ({pastFlights.length})
                </span>
              </h2>
              <div className="space-y-3">
                {pastFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onDelete={handleFlightDeleted}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-amber">{flights.length}</div>
          <div className="text-sm text-gray-400">Total Flights</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-amber">
            {totalDistance.toLocaleString()} km
          </div>
          <div className="text-sm text-gray-400">Distance Flown</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-amber">{uniqueAirports}</div>
          <div className="text-sm text-gray-400">Airports</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-amber">{uniqueAirlines}</div>
          <div className="text-sm text-gray-400">Airlines</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-amber">{formatCO2(totalCO2)}</div>
          <div className="text-sm text-gray-400">CO₂ Emissions</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <div className="text-2xl font-mono text-green-400">🌳 {treesNeeded}</div>
          <div className="text-sm text-gray-400">Trees to Offset</div>
        </div>
      </div>

      {/* Stats Panel */}
      {flights.length > 0 && (
        <div className="mt-12">
          <StatsPanel flights={flights} />
        </div>
      )}

      {/* Gmail Sync */}
      <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Import from Gmail</h2>
        <p className="text-gray-400 text-sm mb-4">
          Connect your Gmail to automatically find and import flight bookings from your inbox.
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
