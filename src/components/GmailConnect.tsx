"use client";

import { useState, useEffect } from "react";
import GmailSyncButton from "./GmailSyncButton";

interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
}

interface GmailConnectProps {
  onSyncComplete?: () => void;
}

export default function GmailConnect({ onSyncComplete }: GmailConnectProps) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch Gmail connection status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/gmail/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch Gmail status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Gmail auth endpoint
    window.location.href = "/api/gmail/auth";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/gmail/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setStatus({ connected: false });
        setShowConfirm(false);
      }
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-soft">
        <svg
          className="w-4 h-4 animate-spin"
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
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex flex-col gap-4">
        {/* Connection status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal"></div>
              <span className="text-sm text-ink-soft">Gmail connected</span>
            </div>
            <div className="text-sm font-ticket text-ink mt-1">{status.email}</div>
          </div>

          {showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 text-sm text-ink-soft hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1 text-sm bg-brick text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {disconnecting ? "..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm text-ink-soft hover:text-brick transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Sync button */}
        <GmailSyncButton onSyncComplete={onSyncComplete} />
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-stub border border-line rounded-lg text-ink hover:border-teal hover:bg-pass transition-colors"
    >
      <svg
        className="w-5 h-5 text-teal"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
      </svg>
      <span>Connect Gmail</span>
    </button>
  );
}
