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

  const handleSync = async () => {
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
          lookbackDays: 365, // 12 months
          maxEmails: 100,
        }),
      });

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
      setError(err instanceof Error ? err.message : "Sync failed");
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
      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 bg-amber text-black font-semibold rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={dismissResult}
              className="text-red-400 hover:text-red-200"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="p-4 bg-gray-800 border border-gray-700 rounded text-sm space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-white">Sync Complete</h4>
            <button
              onClick={dismissResult}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-gray-400">
            <div>Emails scanned:</div>
            <div className="text-white">{result.stats.emailsFound}</div>

            <div>Flights found:</div>
            <div className="text-white">{result.stats.flightsFound}</div>

            <div>New flights added:</div>
            <div className="text-amber font-semibold">
              {result.stats.flightsNew}
            </div>

            {result.stats.flightsDuplicate > 0 && (
              <>
                <div>Already existed:</div>
                <div className="text-gray-500">
                  {result.stats.flightsDuplicate}
                </div>
              </>
            )}
          </div>

          {/* New Flights List */}
          {result.newFlights.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <div className="text-gray-400 text-xs uppercase mb-2">
                Added flights:
              </div>
              <div className="space-y-1">
                {result.newFlights.map((f, i) => (
                  <div key={i} className="font-mono text-amber">
                    {f.flightNumber} - {f.date}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <div className="text-red-400 text-xs uppercase mb-2">
                Errors ({result.errors.length}):
              </div>
              <div className="text-red-300 text-xs space-y-1">
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
