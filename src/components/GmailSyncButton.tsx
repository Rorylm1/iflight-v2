"use client";

import { useState } from "react";

interface SyncResult {
  success: boolean;
  stats: {
    emailsFound: number;
    emailsProcessed: number;
    flightsFound: number;
    flightsNew: number;
    flightsDuplicate: number;
    errors: number;
  };
  newFlights: Array<{
    flightNumber: string;
    date: string;
  }>;
  errors: string[];
}

interface GmailSyncButtonProps {
  onSyncComplete?: () => void; // Callback to refresh flights list
}

export default function GmailSyncButton({ onSyncComplete }: GmailSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleSync = async (deepSync: boolean = false) => {
    setShowOptions(false);
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lookbackDays: 365, // Full year of flight emails
          maxEmails: deepSync ? 75 : 25, // More emails for thorough search
          deepSync: deepSync, // Use broader search query
        }),
      });

      // Handle non-JSON responses (timeouts return HTML)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Server returned HTML error page (timeout, 502, 504, etc.)
        if (response.status === 504 || response.status === 502) {
          throw new Error("Sync timed out. Try disconnecting and reconnecting Gmail, then sync again.");
        }
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setResult(data);

      // Refresh the flights list if new flights were added
      if (data.stats?.flightsNew > 0 && onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      // Handle JSON parse errors specifically
      if (err instanceof SyntaxError) {
        setError("Sync timed out. The server took too long to respond. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Sync failed");
      }
    } finally {
      setSyncing(false);
    }
  };

  const dismissResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Sync Button with Dropdown */}
      <div className="relative inline-flex">
        <button
          onClick={() => handleSync(false)}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-pass font-semibold rounded-l-md hover:bg-teal-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Syncing...
            </>
          ) : (
            <>
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sync Flights from Gmail
            </>
          )}
        </button>

        {/* Dropdown toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={syncing}
          className="px-2 py-2 bg-teal text-pass font-semibold rounded-r-md border-l border-teal-soft hover:bg-teal-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showOptions && !syncing && (
          <div className="absolute top-full left-0 mt-1 bg-pass border border-line rounded-md shadow-pass z-10 min-w-[200px] overflow-hidden">
            <button
              onClick={() => handleSync(false)}
              className="w-full text-left px-4 py-3 hover:bg-stub transition-colors"
            >
              <div className="font-semibold text-ink">Quick Sync</div>
              <div className="text-xs text-ink-soft">
                Searches subject lines only (fast)
              </div>
            </button>
            <button
              onClick={() => handleSync(true)}
              className="w-full text-left px-4 py-3 hover:bg-stub transition-colors border-t border-line"
            >
              <div className="font-semibold text-ink">Deep Sync</div>
              <div className="text-xs text-ink-soft">
                Searches all airline emails (thorough)
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-brick/10 border border-brick/40 rounded-md text-brick text-sm">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={dismissResult}
              className="text-brick hover:opacity-70"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="p-4 bg-stub border border-line rounded-md text-sm space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-ink">Sync complete</h4>
            <button
              onClick={dismissResult}
              className="text-ink-soft hover:text-ink"
            >
              &times;
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-ink-soft font-ticket">
            <div>Emails scanned:</div>
            <div className="text-ink">{result.stats.emailsFound}</div>

            <div>Flights found:</div>
            <div className="text-ink">{result.stats.flightsFound}</div>

            <div>New flights added:</div>
            <div className="text-teal font-semibold">
              {result.stats.flightsNew}
            </div>

            {result.stats.flightsDuplicate > 0 && (
              <>
                <div>Already existed:</div>
                <div className="text-ink-faint">
                  {result.stats.flightsDuplicate}
                </div>
              </>
            )}
          </div>

          {/* New Flights List */}
          {result.newFlights.length > 0 && (
            <div className="pt-2 border-t border-line">
              <div className="text-ink-soft text-xs uppercase tracking-wide mb-2">
                Added flights:
              </div>
              <div className="space-y-1">
                {result.newFlights.map((f, i) => (
                  <div key={i} className="font-ticket text-teal">
                    {f.flightNumber} — {f.date}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="pt-2 border-t border-line">
              <div className="text-brick text-xs uppercase tracking-wide mb-2">
                Errors ({result.errors.length}):
              </div>
              <div className="text-brick/80 text-xs space-y-1">
                {result.errors.slice(0, 3).map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
                {result.errors.length > 3 && (
                  <div>...and {result.errors.length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
