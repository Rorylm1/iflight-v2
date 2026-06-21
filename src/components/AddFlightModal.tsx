"use client";

import { useState } from "react";

interface AddFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlightAdded: () => void;
}

export default function AddFlightModal({
  isOpen,
  onClose,
  onFlightAdded,
}: AddFlightModalProps) {
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flightNumber: flightNumber.trim().toUpperCase(),
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add flight");
      }

      // Success - reset form and close modal
      setFlightNumber("");
      setDate("");
      onFlightAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-pass border border-line rounded-xl p-6 w-full max-w-md shadow-pass">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-extrabold text-2xl text-ink">Add flight</h2>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Flight Number Input */}
          <div>
            <label
              htmlFor="flightNumber"
              className="block font-ticket text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-2"
            >
              Flight Number
            </label>
            <input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="e.g., BA123"
              className="w-full px-4 py-3 bg-stub border border-line rounded-md text-ink font-ticket text-lg placeholder-ink-faint focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal caret-teal"
              required
              pattern="[A-Za-z0-9]{2,3}[0-9]{1,4}"
              title="Flight number format: 2-3 character airline code + 1-4 digits (e.g., BA123, EZY456, U2986)"
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ink-faint">
              e.g., BA123, EZY456, U2986
            </p>
          </div>

          {/* Date Input */}
          <div>
            <label
              htmlFor="date"
              className="block font-ticket text-[11px] uppercase tracking-[0.16em] text-ink-soft mb-2"
            >
              Flight Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-stub border border-line rounded-md text-ink font-ticket text-lg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal [color-scheme:light]"
              required
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-brick/10 border border-brick/40 rounded-md text-brick text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal text-pass font-semibold rounded-md hover:bg-teal-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Adding Flight...
              </>
            ) : (
              "Add Flight"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
