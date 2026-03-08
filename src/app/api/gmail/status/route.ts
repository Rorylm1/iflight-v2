import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/status
 *
 * Returns Gmail connection status for the current user.
 */
export async function GET() {
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

    // Check for Gmail connection
    const { data: connection, error: queryError } = await supabase
      .from("gmail_connections")
      .select("google_email, last_sync_at, last_sync_status, connected_at")
      .eq("user_id", user.id)
      .single();

    if (queryError || !connection) {
      // No connection found
      return NextResponse.json({
        connected: false,
      });
    }

    // Return connection status
    return NextResponse.json({
      connected: true,
      email: connection.google_email,
      connectedAt: connection.connected_at,
      lastSyncAt: connection.last_sync_at,
      lastSyncStatus: connection.last_sync_status,
    });
  } catch (error) {
    console.error("[Gmail Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get Gmail status" },
      { status: 500 }
    );
  }
}
