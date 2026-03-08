import { createServerSupabaseClient } from "@/lib/supabase-server";
import { revokeToken } from "@/lib/gmail/google-oauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/gmail/disconnect
 *
 * Disconnects Gmail by revoking tokens and deleting the connection record.
 */
export async function POST() {
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

    // Get current connection to revoke tokens
    const { data: connection, error: queryError } = await supabase
      .from("gmail_connections")
      .select("access_token, refresh_token")
      .eq("user_id", user.id)
      .single();

    if (queryError || !connection) {
      return NextResponse.json(
        { error: "No Gmail connection found" },
        { status: 404 }
      );
    }

    // Revoke tokens with Google (best effort - don't fail if this fails)
    try {
      await revokeToken(connection.refresh_token);
    } catch (revokeError) {
      console.warn("[Gmail Disconnect] Token revocation failed:", revokeError);
      // Continue anyway - we'll delete the local record
    }

    // Delete the connection record
    const { error: deleteError } = await supabase
      .from("gmail_connections")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[Gmail Disconnect] Failed to delete connection:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect Gmail" },
        { status: 500 }
      );
    }

    console.log(`[Gmail Disconnect] Successfully disconnected for user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Gmail Disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}
