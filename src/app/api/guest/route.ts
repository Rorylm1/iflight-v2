import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getDemoFlightRows } from "@/lib/demo-flights";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/guest - Seed demo flights for a guest (anonymous) user
 *
 * Called right after `signInAnonymously()` on the client. By that point the
 * anonymous session cookie is set, so `auth.getUser()` here returns a real
 * (anonymous) user whose `id` satisfies Row Level Security on inserts.
 *
 * This is idempotent: it only seeds when the user has zero flights, so a
 * double-click, refresh, or retry can never create duplicate demo data.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Must have a session (anonymous users count as authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Idempotency guard: never seed on top of existing flights.
    // `head: true` returns only the count, not the rows (cheap).
    const { count, error: countError } = await supabase
      .from("flights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("[Guest] Error counting existing flights:", countError);
      return NextResponse.json(
        { error: "Failed to check existing flights" },
        { status: 500 }
      );
    }

    if ((count ?? 0) > 0) {
      // Already has flights (e.g. retry) — nothing to do.
      return NextResponse.json({ seeded: 0, alreadySeeded: true });
    }

    // Insert the curated demo set. RLS passes because user_id === auth.uid().
    const rows = getDemoFlightRows(user.id);
    const { data: inserted, error: insertError } = await supabase
      .from("flights")
      .insert(rows)
      .select("id");

    if (insertError) {
      console.error("[Guest] Error seeding demo flights:", insertError);
      return NextResponse.json(
        { error: "Failed to seed demo flights" },
        { status: 500 }
      );
    }

    console.log(`[Guest] Seeded ${inserted?.length ?? 0} demo flights for ${user.id}`);
    return NextResponse.json({ seeded: inserted?.length ?? 0 }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/guest:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
