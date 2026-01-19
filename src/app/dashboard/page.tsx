import { createServerSupabaseClient } from "@/lib/supabase-server";
import Header from "@/components/Header";
import FlightList from "@/components/FlightList";

// Opt out of static generation - this page needs auth state
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <FlightList />
      </main>
    </div>
  );
}
