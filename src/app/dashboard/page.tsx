import { createServerSupabaseClient } from "@/lib/supabase-server";
import Header from "@/components/Header";

// Opt out of static generation - this page needs auth state
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Flights</h1>
          <p className="text-gray-400">Track and manage your flight history</p>
        </div>

        {/* Empty state - will be replaced with flight list in M2 */}
        <div className="border border-gray-800 border-dashed rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold mb-2">No flights yet</h2>
          <p className="text-gray-400 mb-6">
            Add your first flight to start tracking your journey
          </p>
          <button
            disabled
            className="px-6 py-3 bg-amber text-black font-semibold rounded hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Flight (Coming in M2)
          </button>
        </div>

        {/* Stats preview - placeholder for M4 */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Flights", value: "0" },
            { label: "Distance", value: "0 km" },
            { label: "Countries", value: "0" },
            { label: "Airlines", value: "0" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-900 border border-gray-800 rounded p-4"
            >
              <div className="text-2xl font-mono text-amber">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
