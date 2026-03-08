import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  exchangeCodeForTokens,
  getGoogleEmail,
  verifyState,
} from "@/lib/gmail/google-oauth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/callback
 *
 * Handles Google OAuth callback after user consents.
 * Exchanges authorization code for tokens and stores them.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial or error
    if (error) {
      console.log("[Gmail Callback] User denied or error:", error);
      return NextResponse.redirect(
        new URL("/dashboard?gmail=denied", request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("[Gmail Callback] Missing code or state");
      return NextResponse.redirect(
        new URL("/dashboard?gmail=error", request.url)
      );
    }

    // Verify state and extract user ID
    const userIdFromState = verifyState(state);
    if (!userIdFromState) {
      console.error("[Gmail Callback] Invalid state parameter");
      return NextResponse.redirect(
        new URL("/dashboard?gmail=error", request.url)
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify the logged-in user matches the state
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Gmail Callback] User not authenticated");
      return NextResponse.redirect(
        new URL("/auth/signin?redirect=/dashboard", request.url)
      );
    }

    if (user.id !== userIdFromState) {
      console.error("[Gmail Callback] User ID mismatch - possible CSRF attack");
      return NextResponse.redirect(
        new URL("/dashboard?gmail=error", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      console.error("[Gmail Callback] No refresh token received");
      return NextResponse.redirect(
        new URL("/dashboard?gmail=error", request.url)
      );
    }

    // Get user's Gmail address
    const googleEmail = await getGoogleEmail(tokens.access_token);

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database (upsert to handle reconnection)
    const { error: upsertError } = await supabase
      .from("gmail_connections")
      .upsert(
        {
          user_id: user.id,
          google_email: googleEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          scopes: tokens.scope,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("[Gmail Callback] Failed to store tokens:", upsertError);
      return NextResponse.redirect(
        new URL("/dashboard?gmail=error", request.url)
      );
    }

    console.log(`[Gmail Callback] Successfully connected ${googleEmail}`);

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL("/dashboard?gmail=connected", request.url)
    );
  } catch (error) {
    console.error("[Gmail Callback] Error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?gmail=error", request.url)
    );
  }
}
