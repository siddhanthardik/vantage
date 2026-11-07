import crypto from "crypto";

const CHAT_SESSION_SECRET = process.env.SESSION_SECRET || "vantage-chat-session-default-secret-salt-key-2026";

/**
 * Creates an anonymous SHA-256 hash of a client IP address with a daily rotating salt.
 * Ensures compliance with DPDP Act 2023 / GDPR by preventing long-term visitor tracking.
 */
export function hashClientIp(rawIp: string | null | undefined): string | null {
  if (!rawIp) return null;
  const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return crypto
    .createHmac("sha256", CHAT_SESSION_SECRET)
    .update(`${rawIp.trim()}-${dayKey}`)
    .digest("hex");
}

/**
 * Generates a cryptographically random, URL-safe 256-bit session token
 */
export function generateAnonymousSessionToken(): string {
  const entropy = crypto.randomBytes(32).toString("base64url");
  const signature = crypto
    .createHmac("sha256", CHAT_SESSION_SECRET)
    .update(entropy)
    .digest("base64url");
  return `${entropy}.${signature}`;
}

/**
 * Verifies the integrity of a signed anonymous session token and returns the session ID
 */
export function verifyAnonymousSessionToken(signedToken: string | null | undefined): {
  valid: boolean;
  sessionId: string | null;
} {
  if (!signedToken || typeof signedToken !== "string") {
    return { valid: false, sessionId: null };
  }

  const parts = signedToken.split(".");
  if (parts.length !== 2) {
    return { valid: false, sessionId: null };
  }

  const [entropy, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", CHAT_SESSION_SECRET)
    .update(entropy)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const isMatch =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isMatch) {
    return { valid: false, sessionId: null };
  }

  return { valid: true, sessionId: entropy };
}
