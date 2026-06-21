"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import CarbonInsights from "@/components/CarbonInsights";
import { Flight } from "@/components/FlightCard";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Dynamically import FlightMap to avoid SSR issues with Mapbox
const FlightMap = dynamic(() => import("@/components/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-xl bg-pass border border-line shadow-pass flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal border-t-transparent"></div>
    </div>
  ),
});

export default function MapPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from Supabase client
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          // Redirect to login if not authenticated
          router.push("/auth/signin");
          return;
        }

        setUser(authUser);

        // Fetch flights from API
        const response = await fetch("/api/flights");

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          if (response.status === 401) {
            router.push("/auth/signin");
            return;
          }
          throw new Error(data.error || "Failed to fetch flights");
        }

        const data = await response.json();
        setFlights(data.flights || []);
      } catch (err) {
        console.error("Error loading map data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-teal border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="p-6 bg-brick/10 border border-brick/40 rounded-xl text-center">
            <p className="text-brick mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brick text-white rounded-md hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 pb-5 border-b-2 border-ink/80">
          <p className="font-ticket text-[11px] uppercase tracking-[0.22em] text-ink-soft mb-2">
            Routes &amp; carbon impact
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-none text-ink">
            Where you&apos;ve flown
          </h1>
        </div>

        {/* Flight Map */}
        <div className="mb-8">
          <FlightMap flights={flights} />
        </div>

        {/* Carbon Insights */}
        <CarbonInsights flights={flights} />

        {/* Back to Dashboard Link */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="text-ink-soft hover:text-teal transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to passes
          </a>
        </div>
      </main>
    </div>
  );
}
