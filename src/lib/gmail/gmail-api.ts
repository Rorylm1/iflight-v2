/**
 * Gmail API Client
 *
 * Fetches emails from Gmail using the Gmail API.
 * Handles pagination and content extraction.
 */

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
    parts?: GmailPart[];
  };
}

interface GmailPart {
  mimeType: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

export interface EmailContent {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export interface FetchEmailsResult {
  messages: GmailMessage[];
  nextPageToken?: string;
}

/**
 * Search for emails matching a query
 *
 * @param accessToken - Valid Gmail access token
 * @param query - Gmail search query
 * @param maxResults - Maximum results per page (default 50)
 * @param pageToken - Token for pagination
 */
export async function searchEmails(
  accessToken: string,
  query: string,
  maxResults: number = 50,
  pageToken?: string
): Promise<FetchEmailsResult> {
  const params = new URLSearchParams({
    q: query,
    maxResults: maxResults.toString(),
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[Gmail API] Search failed:", error);
    throw new Error(`Gmail search failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Get full details of a specific email
 *
 * @param accessToken - Valid Gmail access token
 * @param messageId - Gmail message ID
 */
export async function getEmailDetail(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[Gmail API] Get message failed:", error);
    throw new Error(`Failed to get email: ${response.status}`);
  }

  return response.json();
}

/**
 * Extract readable content from a Gmail message
 *
 * @param message - Gmail message detail
 * @returns Parsed email content
 */
export function parseEmailContent(message: GmailMessageDetail): EmailContent {
  const headers = message.payload.headers;

  // Extract headers
  const getHeader = (name: string): string => {
    const header = headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value || "";
  };

  const from = getHeader("From");
  const subject = getHeader("Subject");
  const date = getHeader("Date");

  // Extract body - try plain text first, then HTML
  let body = "";

  // Try to get body from parts (multipart emails)
  if (message.payload.parts) {
    body = extractBodyFromParts(message.payload.parts);
  }

  // Fallback to direct body
  if (!body && message.payload.body?.data) {
    body = decodeBase64Url(message.payload.body.data);
  }

  // If still no body, use snippet
  if (!body) {
    body = message.snippet || "";
  }

  // Clean up HTML if present
  body = stripHtml(body);

  // Truncate very long bodies (keep first 10000 chars for AI)
  if (body.length > 10000) {
    body = body.substring(0, 10000) + "... [truncated]";
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    subject,
    date,
    body,
  };
}

/**
 * Recursively extract body from email parts
 */
function extractBodyFromParts(parts: GmailPart[]): string {
  // Prefer plain text
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    // Check nested parts
    if (part.parts) {
      const nested = extractBodyFromParts(part.parts);
      if (nested) return nested;
    }
  }

  // Fallback to HTML
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      const nested = extractBodyFromParts(part.parts);
      if (nested) return nested;
    }
  }

  return "";
}

/**
 * Decode base64url encoded string (Gmail format)
 */
function decodeBase64Url(data: string): string {
  // Replace URL-safe chars with standard base64
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  // Remove script and style tags with content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|tr|li|br|h[1-6])>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  // Clean up whitespace
  text = text.replace(/\s+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n\n");
  text = text.trim();

  return text;
}

/**
 * Fetch multiple emails with their content
 * Processes in batches to avoid rate limits
 *
 * @param accessToken - Valid Gmail access token
 * @param messageIds - Array of message IDs to fetch
 * @param onProgress - Optional progress callback
 */
export async function fetchEmailContents(
  accessToken: string,
  messageIds: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<EmailContent[]> {
  const contents: EmailContent[] = [];
  const batchSize = 10; // Process 10 at a time

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const detail = await getEmailDetail(accessToken, id);
          return parseEmailContent(detail);
        } catch (error) {
          console.error(`[Gmail API] Failed to fetch email ${id}:`, error);
          return null;
        }
      })
    );

    contents.push(...batchResults.filter((c): c is EmailContent => c !== null));

    if (onProgress) {
      onProgress(Math.min(i + batchSize, messageIds.length), messageIds.length);
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < messageIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return contents;
}
