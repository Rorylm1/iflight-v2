import { createServerSupabaseClient } from "@/lib/supabase-server";
import { runGmailSync } from "@/lib/gmail/sync-service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Extend timeout for sync operations
export const maxDuration = 60; // 60 seconds

/**
 * POST /api/gmail/sync
 *
 * Triggers Gmail sync to find and import flight bookings.
 *
 * Request body (optional):
 * {
 *   lookbackDays?: number,  // Default: 365
 *   maxEmails?: number      // Default: 100
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Gmail is connected
    const { data: connection } = await supabase
      .from("gmail_connections")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: "Gmail not connected. Please connect Gmail first." },
        { status: 400 }
      );
    }

    // Parse options from request body
    let options = {};
    try {
      const body = await request.json();
      options = {
        lookbackDays: body.lookbackDays,
        maxEmails: body.maxEmails,
      };
    } catch {
      // No body or invalid JSON - use defaults
    }

    console.log(`[Gmail Sync] Starting sync for user ${user.id}`);

    // Run the sync
    const result = await runGmailSync(supabase, user.id, options);

    console.log(`[Gmail Sync] Complete:`, result.stats);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Gmail Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
