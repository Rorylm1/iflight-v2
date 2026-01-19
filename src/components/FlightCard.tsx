"use client";

import { useState } from "react";

export interface Flight {
  id: string;
  flight_number: string;
  date: string;
  airline: string;
  departure_airport: string;
  departure_airport_name: string | null;
  departure_country: string | null;
  departure_time: string;
  departure_time_actual: string | null;
  departure_terminal: string | null;
  arrival_airport: string;
  arrival_airport_name: string | null;
  arrival_country: string | null;
  arrival_time: string;
  arrival_time_actual: string | null;
  arrival_terminal: string | null;
  status: string;
  aircraft: string | null;
  distance_km: number | null;
  source: string;
  created_at: string;
}

interface FlightCardProps {
  flight: Flight;
  onDelete: (id: string) => void;
}

// Status styles - more subtle, integrated design
const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  scheduled: { dot: "bg-blue-400", text: "text-blue-400" },
  active: { dot: "bg-green-400", text: "text-green-400" },
  landed: { dot: "bg-gray-400", text: "text-gray-400" },
  cancelled: { dot: "bg-red-400", text: "text-red-400" },
  delayed: { dot: "bg-amber", text: "text-amber" },
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDistance(km: number | null): string {
  if (km === null || km === undefined) return "—";
  return km.toLocaleString() + " km";
}

// Convert country code to flag emoji (GB -> 🇬🇧)
function countryToFlag(countryCode: string | null): string {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function FlightCard({ flight, onDelete }: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flights?id=${flight.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(flight.id);
      }
    } catch (error) {
      console.error("Error deleting flight:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusStyle = STATUS_STYLES[flight.status] || STATUS_STYLES.scheduled;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
      {/* Main card content - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:ring-inset"
      >
        {/* Top row: Flight number, airline, status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl text-amber font-bold tracking-wide">
              {flight.flight_number}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">{flight.airline}</span>
            {flight.source.includes("estimated") && (
              <span className="text-xs px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-500">
                estimated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
            <span className={`text-sm capitalize ${statusStyle.text}`}>
              {flight.status}
            </span>
          </div>
        </div>

        {/* Route display - cleaner layout */}
        <div className="flex items-center">
          {/* Departure */}
          <div className="flex-1">
            <div className="font-mono text-3xl font-bold tracking-tight">
              {flight.departure_airport}
            </div>
            <div className="text-gray-400 mt-1">
              {formatTime(flight.departure_time)}
            </div>
          </div>

          {/* Center: Arrow, date, distance */}
          <div className="flex-1 flex flex-col items-center px-4">
            <div className="text-gray-400 text-sm mb-2">
              {formatDate(flight.date)}
            </div>
            <div className="flex items-center w-full max-w-[120px]">
              <div className="flex-1 h-px bg-gray-700"></div>
              <svg
                className="w-5 h-5 text-amber mx-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>
            <div className="text-gray-500 text-sm mt-2">
              {formatDistance(flight.distance_km)}
            </div>
          </div>

          {/* Arrival */}
          <div className="flex-1 text-right">
            <div className="font-mono text-3xl font-bold tracking-tight">
              {flight.arrival_airport}
            </div>
            <div className="text-gray-400 mt-1">
              {formatTime(flight.arrival_time)}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-5 bg-gray-950/50">
          {/* Airport details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                From
              </div>
              <div className="text-sm">
                <span className="mr-2">{countryToFlag(flight.departure_country)}</span>
                {flight.departure_airport_name || flight.departure_airport}
              </div>
              {flight.departure_time_actual && flight.departure_time_actual !== flight.departure_time && (
                <div className="text-amber text-xs mt-1">
                  Revised: {formatTime(flight.departure_time_actual)}
                </div>
              )}
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                To
              </div>
              <div className="text-sm">
                <span className="mr-2">{countryToFlag(flight.arrival_country)}</span>
                {flight.arrival_airport_name || flight.arrival_airport}
              </div>
              {flight.arrival_time_actual && flight.arrival_time_actual !== flight.arrival_time && (
                <div className="text-green-400 text-xs mt-1">
                  Expected: {formatTime(flight.arrival_time_actual)}
                </div>
              )}
            </div>
          </div>

          {/* Flight details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Departure Terminal
              </div>
              <div className="font-mono text-lg">
                {flight.departure_terminal ? `T${flight.departure_terminal}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Arrival Terminal
              </div>
              <div className="font-mono text-lg">
                {flight.arrival_terminal ? `T${flight.arrival_terminal}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Aircraft
              </div>
              <div className="font-mono text-sm">{flight.aircraft || "—"}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Data
              </div>
              <div className="font-mono text-sm">
                {flight.source.includes("estimated") ? "Estimated" : "Live API"}
              </div>
            </div>
          </div>

          {/* Delete section */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Delete this flight?</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-gray-500 hover:text-red-400 transition-colors text-sm"
              >
                Delete flight
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
