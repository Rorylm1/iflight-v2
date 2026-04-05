"use client";

import { useState, useEffect } from "react";
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
    <div className="w-full h-[500px] rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber border-t-transparent"></div>
    </div>
  ),
});

export default function MapPage() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from Supabase client
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        // Fetch flights from API
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
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber border-t-transparent"></div>
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
          <div className="p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Flight Map & Carbon Impact</h1>
          <p className="text-gray-400">
            Visualize your routes and understand your environmental footprint
          </p>
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
            className="text-gray-400 hover:text-amber transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
