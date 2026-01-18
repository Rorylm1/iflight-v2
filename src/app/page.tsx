import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Opt out of static generation - this page checks auth state
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-amber">i</span>Flight
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Track your flights. Visualize your journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-8 py-3 bg-amber text-black font-semibold rounded hover:bg-amber-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 border border-gray-700 text-white font-semibold rounded hover:border-gray-600 transition-colors"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">✈️</div>
            <div className="text-sm text-gray-400">Log Flights</div>
          </div>
          <div>
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm text-gray-400">Track Stats</div>
          </div>
          <div>
            <div className="text-3xl mb-2">🗺️</div>
            <div className="text-sm text-gray-400">View Map</div>
          </div>
        </div>
      </div>
    </main>
  );
}
