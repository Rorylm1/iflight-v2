/**
 * Google OAuth Utilities
 *
 * Handles OAuth flow for Gmail API access (separate from user login).
 * Uses authorization code flow with refresh tokens.
 */

// Google OAuth endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

// Gmail readonly scope + email to get user's email address
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string; // Only returned on initial authorization
  expires_in: number; // Seconds until access_token expires
  token_type: string;
  scope: string;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string;
  email: string;
}

/**
 * Generate Google OAuth authorization URL
 *
 * @param state - Random string for CSRF protection (should include user_id hash)
 * @returns URL to redirect user to Google consent screen
 */
export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || getDefaultRedirectUri();

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent to ensure refresh token is returned
    state: state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 *
 * @param code - Authorization code from Google callback
 * @returns Access token, refresh token, and expiration
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || getDefaultRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Google OAuth] Token exchange failed:", error);
    throw new Error("Failed to exchange authorization code for tokens");
  }

  const tokens: GoogleTokens = await response.json();
  return tokens;
}

/**
 * Refresh an expired access token using refresh token
 *
 * @param refreshToken - Long-lived refresh token
 * @returns New access token and expiration
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log("[Google OAuth] Attempting token refresh...");
  console.log("[Google OAuth] Client ID present:", !!clientId);
  console.log("[Google OAuth] Client Secret present:", !!clientSecret);
  console.log("[Google OAuth] Refresh token length:", refreshToken?.length || 0);

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Google OAuth] Token refresh failed with status:", response.status);
    console.error("[Google OAuth] Error response:", errorText);

    // Parse Google's error response for more detail
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error === "invalid_grant") {
        throw new Error("Gmail connection expired. Please disconnect and reconnect Gmail.");
      }
      throw new Error(`Token refresh failed: ${errorJson.error_description || errorJson.error}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes("Gmail connection")) {
        throw parseError;
      }
      throw new Error("Failed to refresh access token");
    }
  }

  const tokens: GoogleTokens = await response.json();
  console.log("[Google OAuth] Token refresh successful");
  return tokens;
}

/**
 * Revoke OAuth tokens (on disconnect)
 *
 * @param token - Access token or refresh token to revoke
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
    method: "POST",
  });

  if (!response.ok) {
    console.warn("[Google OAuth] Token revocation failed (may already be revoked)");
    // Don't throw - token may already be invalid
  }
}

/**
 * Get user's email from Google userinfo endpoint
 *
 * @param accessToken - Valid access token
 * @returns User's Gmail address
 */
export async function getGoogleEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Google user info");
  }

  const data = await response.json();
  return data.email;
}

/**
 * Check if access token is expired (with 5 minute buffer)
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return new Date().getTime() > expiresAt.getTime() - bufferMs;
}

/**
 * Generate a random state string for CSRF protection
 * Includes user_id hash to verify on callback
 */
export function generateState(userId: string): string {
  const random = Math.random().toString(36).substring(2, 15);
  // Simple encoding - in production, consider using a proper JWT or encrypted token
  const encoded = Buffer.from(userId).toString("base64");
  return `${random}_${encoded}`;
}

/**
 * Verify and extract user_id from state parameter
 */
export function verifyState(state: string): string | null {
  try {
    const parts = state.split("_");
    if (parts.length !== 2) return null;
    const userId = Buffer.from(parts[1], "base64").toString("utf-8");
    // Basic validation - should be a UUID
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
    return userId;
  } catch {
    return null;
  }
}

/**
 * Get default redirect URI based on environment
 */
function getDefaultRedirectUri(): string {
  // Use explicit production URL if set, otherwise fall back to Vercel URL
  // IMPORTANT: VERCEL_URL changes per deployment, so we prefer a stable URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`;
  }
  // For production on Vercel, use the production domain (not preview URLs)
  if (process.env.VERCEL_ENV === "production") {
    return "https://iflight-v2.vercel.app/api/gmail/callback";
  }
  // For preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/gmail/callback`;
  }
  return "http://localhost:3000/api/gmail/callback";
}
