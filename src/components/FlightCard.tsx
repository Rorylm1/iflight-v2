"use client";

import { useState } from "react";
import { calculateFlightCO2, formatCO2 } from "@/lib/co2-calculator";

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
  /** Position in its list — drives the staggered fold-in entrance. */
  index?: number;
}

/**
 * Map a flight status to one of three boarding-pass stub treatments.
 * The accent carries meaning: teal = live/your-action, brick = alert.
 */
function statusVariant(status: string): { cls: string; label: string } {
  switch (status) {
    case "cancelled":
      return { cls: "bp-status--alert", label: "Cancelled" };
    case "landed":
      return { cls: "bp-status--done", label: "Landed" };
    case "active":
      return { cls: "bp-status--live", label: "In the air" };
    case "delayed":
      return { cls: "bp-status--alert", label: "Delayed" };
    default:
      return { cls: "bp-status--live", label: "Scheduled" };
  }
}

/**
 * Past "scheduled" flights read as "landed" — the date is the source of truth.
 */
function getEffectiveStatus(status: string, date: string): string {
  if (status === "cancelled") return status;
  const flightDate = new Date(date + "T23:59:59");
  if (flightDate < new Date()) return "landed";
  return status;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDistance(km: number | null): string {
  if (km === null || km === undefined) return "—";
  return km.toLocaleString() + " km";
}

// Country code → flag emoji (GB → 🇬🇧)
function countryToFlag(countryCode: string | null): string {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Deterministic barcode (no Math.random — keeps SSR/CSR markup identical).
function barcodeWidths(seed: string): number[] {
  const widths: number[] = [];
  for (let i = 0; i < 42; i++) {
    const c = seed.charCodeAt(i % seed.length) + i * 7;
    widths.push((c % 3) + 1);
  }
  return widths;
}

export default function FlightCard({
  flight,
  onDelete,
  index = 0,
}: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flights?id=${flight.id}`, {
        method: "DELETE",
      });
      if (response.ok) onDelete(flight.id);
    } catch (error) {
      console.error("Error deleting flight:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const effectiveStatus = getEffectiveStatus(flight.status, flight.date);
  const status = statusVariant(effectiveStatus);
  const co2 = flight.distance_km ? calculateFlightCO2(flight.distance_km) : null;
  const haul = co2?.haul === "long" ? "long" : "short";
  const locator = flight.id.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();

  // Staggered entrance: card slides up, then the stub unfolds a beat later.
  const base = Math.min(index * 0.07, 0.9);

  return (
    <article
      className="bp-pass"
      data-haul={haul}
      style={{ animationDelay: `${base}s` }}
      aria-label={`${flight.airline} ${flight.flight_number}, ${flight.departure_airport} to ${flight.arrival_airport}`}
    >
      {/* Main section — click to reveal the fine print */}
      <button
        className="bp-main"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="bp-route">
          <div className="bp-iata">
            {flight.departure_airport}
            <small>{flight.departure_airport_name || "Departure"}</small>
          </div>
          <div className="bp-leg" aria-hidden="true">
            <span className="bp-plane">✈</span>
            <span className="bp-dashes" />
            <span className="bp-km">{formatDistance(flight.distance_km)}</span>
          </div>
          <div className="bp-iata" style={{ textAlign: "right" }}>
            {flight.arrival_airport}
            <small style={{ marginLeft: "auto" }}>
              {flight.arrival_airport_name || "Arrival"}
            </small>
          </div>
        </div>

        <div className="bp-grid">
          <div className="bp-fld">
            <div className="bp-k">Carrier</div>
            <div className="bp-v">{flight.airline}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Date</div>
            <div className="bp-v">{formatDate(flight.date)}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Depart</div>
            <div className="bp-v bp-big">{formatTime(flight.departure_time)}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Arrive</div>
            <div className="bp-v bp-big">{formatTime(flight.arrival_time)}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Aircraft</div>
            <div className="bp-v">{flight.aircraft || "—"}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Terminal</div>
            <div className="bp-v">
              {flight.departure_terminal ? `T${flight.departure_terminal}` : "—"}
            </div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">CO₂ est.</div>
            <div className="bp-v">{co2 ? formatCO2(co2.co2Kg) : "—"}</div>
          </div>
          <div className="bp-fld">
            <div className="bp-k">Details</div>
            <div className="bp-v" style={{ color: "var(--teal)" }}>
              {isExpanded ? "Hide ▲" : "Show ▼"}
            </div>
          </div>
        </div>
      </button>

      {/* Perforated stub */}
      <aside className="bp-stub" style={{ animationDelay: `${base + 0.18}s` }}>
        <span className={`bp-status ${status.cls}`}>{status.label}</span>
        <div className="bp-stubrow">
          <div className="bp-k">Flight</div>
          <div className="bp-v">{flight.flight_number}</div>
        </div>
        {flight.source.includes("estimated") && (
          <div className="bp-k" style={{ letterSpacing: "0.1em" }}>
            ~ estimated times
          </div>
        )}
        <div className="bp-barcode" aria-hidden="true">
          {barcodeWidths(flight.id).map((w, i) => (
            <i key={i} style={{ width: `${w * 1.4}px` }} />
          ))}
        </div>
        <div className="bp-pnr">{locator}</div>
      </aside>

      {/* Expanded fine print */}
      {isExpanded && (
        <div className="bp-fine">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="bp-k">From</div>
              <div className="text-sm text-ink mt-1">
                <span className="mr-2">
                  {countryToFlag(flight.departure_country)}
                </span>
                {flight.departure_airport_name || flight.departure_airport}
              </div>
              {flight.departure_time_actual &&
                (effectiveStatus === "landed" ||
                  effectiveStatus === "active" ||
                  flight.departure_time_actual !== flight.departure_time) && (
                  <div className="text-teal text-xs mt-1 font-ticket">
                    {effectiveStatus === "landed" || effectiveStatus === "active"
                      ? "Departed"
                      : "Revised"}
                    : {formatTime(flight.departure_time_actual)}
                  </div>
                )}
            </div>
            <div>
              <div className="bp-k">To</div>
              <div className="text-sm text-ink mt-1">
                <span className="mr-2">
                  {countryToFlag(flight.arrival_country)}
                </span>
                {flight.arrival_airport_name || flight.arrival_airport}
              </div>
              {flight.arrival_time_actual &&
                (effectiveStatus === "landed" ||
                  flight.arrival_time_actual !== flight.arrival_time) && (
                  <div className="text-teal text-xs mt-1 font-ticket">
                    {effectiveStatus === "landed" ? "Landed" : "Expected"}:{" "}
                    {formatTime(flight.arrival_time_actual)}
                  </div>
                )}
            </div>
            <div>
              <div className="bp-k">Arrival terminal</div>
              <div className="text-sm text-ink mt-1 font-ticket">
                {flight.arrival_terminal ? `T${flight.arrival_terminal}` : "—"}
              </div>
            </div>
            <div>
              <div className="bp-k">Distance</div>
              <div className="text-sm text-ink mt-1 font-ticket">
                {formatDistance(flight.distance_km)}
              </div>
            </div>
          </div>

          {/* Delete */}
          <div className="mt-6 pt-4 border-t border-line">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <span className="text-ink-soft text-sm">
                  Remove this pass from your log?
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm bg-brick text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isDeleting ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-ink-soft hover:text-brick transition-colors"
              >
                Remove flight
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
