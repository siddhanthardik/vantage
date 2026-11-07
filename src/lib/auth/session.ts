import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_COOKIE_NAME = "vantage_admin_session";

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: ADMIN_SESSION_SECRET must be configured in production.");
    }
    return "dev_secret_vantage_wealth_fiduciary_key_2026";
  }
  return secret;
}

export interface AdminSession {
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  isAuthenticated: boolean;
}

interface SessionTokenPayload {
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  issuedAt: number;
  expiresAt: number;
}

/**
 * Sign a payload with HMAC-SHA256
 */
function signPayload(payload: SessionTokenPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 token
 */
function verifyPayload(token: string, secret: string): SessionTokenPayload | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionTokenPayload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Retrieve verified session from secure HTTP-only cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    const payload = verifyPayload(sessionCookie.value, secret);

    if (payload && payload.email) {
      return {
        email: payload.email,
        name: payload.name || "Administrator",
        role: payload.role || "ADMIN",
        isAuthenticated: true,
      };
    }
  } catch (err) {
    return null;
  }

  return null;
}

/**
 * Set a tamper-proof cryptographically signed HTTP-only session cookie
 */
export async function setAdminSession(
  email: string,
  name: string = "Vantage Administrator",
  role: "ADMIN" | "EDITOR" | "VIEWER" = "ADMIN"
): Promise<void> {
  const cookieStore = await cookies();
  const secret = getSessionSecret();

  const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
  const now = Date.now();

  const payload: SessionTokenPayload = {
    email,
    name,
    role,
    issuedAt: now,
    expiresAt: now + maxAge * 1000,
  };

  const token = signPayload(payload, secret);

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/**
 * Destroy session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
