import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGoogleAuthUrl, generateState } from "@/lib/gmail/google-oauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/auth
 *
 * Initiates Google OAuth flow for Gmail access.
 * Redirects user to Google consent screen.
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

    // Generate state with user ID for CSRF protection
    const state = generateState(user.id);

    // Get Google OAuth URL
    const authUrl = getGoogleAuthUrl(state);

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Gmail Auth] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Gmail authorization" },
      { status: 500 }
    );
  }
}
