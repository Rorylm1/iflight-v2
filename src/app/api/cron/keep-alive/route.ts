import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Always run fresh — never cache a keep-alive ping.
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/keep-alive
 *
 * Supabase's free tier PAUSES any project that goes 7 days without an API
 * request. This route exists purely to be that request: Vercel Cron calls it
 * daily (see vercel.json), it runs one cheap read against Supabase, and that
 * read resets Supabase's 7-day inactivity timer.
 *
 * Why a READ and not an INSERT?
 *   Supabase counts *any* request as activity — it doesn't care if data
 *   changes. A SELECT keeps the project alive without polluting real tables
 *   with throwaway rows.
 *
 * Why the `flight_cache` table?
 *   It has NO row-level security (it's a shared cache of public flight data),
 *   so the unauthenticated cron request (no user cookie/session) can read it
 *   without being blocked. `head: true` fetches only the row count, not the
 *   rows themselves — the lightest possible query.
 */
export async function GET(request: Request) {
  // Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to cron
  // requests when the CRON_SECRET env var is set. If it's set, reject anyone
  // who can't present it — stops randoms from hitting this endpoint.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // A bare client with no cookie handling — this request has no logged-in user,
  // and we only touch publicly-readable reference data.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { count, error } = await supabase
    .from("flight_cache")
    .select("*", { count: "exact", head: true });

  if (error) {
    // Log and surface the failure so a broken ping is visible in Vercel logs
    // rather than silently letting the project drift toward a pause.
    console.error("[keep-alive] Supabase ping failed:", error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Supabase pinged — inactivity timer reset.",
    cachedFlights: count,
    pingedAt: new Date().toISOString(),
  });
}
