import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import GuestButton from "@/components/GuestButton";

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
      <div className="text-center max-w-md w-full">
        <p className="font-ticket text-[11px] uppercase tracking-[0.24em] text-ink-soft mb-5">
          Your travel log · est. MMXXVI
        </p>
        <h1 className="font-display font-extrabold text-6xl tracking-tight mb-4 text-ink">
          <span className="text-teal">i</span>Flight
        </h1>
        <p className="text-ink-soft text-lg mb-8">
          Every flight you take, kept as a boarding pass.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="px-8 py-3 bg-teal text-pass font-semibold rounded-md hover:bg-teal-soft transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 border border-line text-ink font-semibold rounded-md hover:border-ink-soft transition-colors"
          >
            Create account
          </Link>
        </div>

        {/* No-signup path for visitors / employers evaluating the app */}
        <div className="mt-6">
          <GuestButton variant="ghost" />
        </div>

        {/* perforated feature strip */}
        <div className="mt-16 grid grid-cols-3 border-t-2 border-dashed border-line pt-6 font-ticket text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          <div>Log flights</div>
          <div className="border-x border-line">Carbon stats</div>
          <div>Globe map</div>
        </div>
      </div>
    </main>
  );
}
