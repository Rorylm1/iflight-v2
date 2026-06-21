"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface GuestButtonProps {
  /**
   * "solid" renders a filled amber button (use as a primary CTA).
   * "ghost" renders a subtle text link (use beneath an existing primary action).
   */
  variant?: "solid" | "ghost";
}

/**
 * "Continue without an account" — lets visitors (e.g. employers) explore the
 * full app with zero signup friction.
 *
 * How it works:
 * 1. `signInAnonymously()` creates a REAL Supabase user with a genuine UUID but
 *    no email/password, and sets the normal session cookie. Because it's a real
 *    user id, all existing middleware, API routes, and Row Level Security work
 *    unchanged — the guest gets their own private, isolated data.
 * 2. We POST to /api/guest to seed that sandbox with demo flights so the
 *    dashboard, map, and stats are populated immediately.
 * 3. We send them to the dashboard.
 *
 * Requires "Anonymous sign-ins" to be enabled in the Supabase dashboard
 * (Authentication → Sign In / Providers → Anonymous sign-ins).
 */
export default function GuestButton({ variant = "ghost" }: GuestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleContinueAsGuest = async () => {
    setLoading(true);
    setError(null);

    // 1. Create the anonymous session
    const { error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
      // Most common cause: anonymous sign-ins not yet enabled in Supabase.
      setError(
        authError.message.toLowerCase().includes("disabled") ||
          authError.message.toLowerCase().includes("anonymous")
          ? "Guest mode isn't enabled yet. Please try again shortly."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // 2. Seed demo flights. Best-effort, with one retry: on a brand-new
    //    session the auth cookie can occasionally miss the very first server
    //    request, which the route answers with 401 — a short wait fixes it.
    //    Even if seeding ultimately fails, the dashboard still works (the
    //    guest would just start with an empty list).
    try {
      let res = await fetch("/api/guest", { method: "POST" });
      if (res.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        res = await fetch("/api/guest", { method: "POST" });
      }
    } catch (seedError) {
      console.error("Failed to seed demo flights:", seedError);
    }

    // 3. Into the app
    router.push("/dashboard");
    router.refresh();
  };

  const baseClasses =
    "transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses =
    variant === "solid"
      ? "px-8 py-3 bg-amber text-black font-semibold rounded hover:bg-amber-400"
      : "text-sm text-gray-400 hover:text-amber underline-offset-4 hover:underline";

  return (
    <div className={variant === "solid" ? "" : "text-center"}>
      <button
        type="button"
        onClick={handleContinueAsGuest}
        disabled={loading}
        className={`${baseClasses} ${variantClasses}`}
      >
        {loading
          ? "Setting up your demo…"
          : variant === "solid"
            ? "Explore as guest"
            : "Just looking? Continue without an account →"}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
