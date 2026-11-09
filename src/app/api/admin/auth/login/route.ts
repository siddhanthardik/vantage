import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/security/password";
import { logAuditEvent } from "@/lib/security/audit";
import { prisma } from "@/lib/db/prisma";

// In-memory brute force protection tracking
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if last attempt was more than 15 minutes ago
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (entry.count >= 5) {
    return false; // Locked out
  }

  entry.count += 1;
  entry.lastAttempt = now;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    if (!checkRateLimit(ip)) {
      await logAuditEvent({
        action: "LOGIN_RATE_LIMITED",
        entityType: "AUTH",
        ipAddress: ip,
        details: { reason: "Exceeded 5 failed login attempts in 15 minutes" },
      });

      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 15 minutes before retrying." },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check database if prisma is connected
    let authenticatedUser: { email: string; name: string; role: "ADMIN" | "EDITOR" | "VIEWER" } | null = null;

    if (prisma) {
      try {
        const user = await prisma.adminUser.findUnique({
          where: { email: cleanEmail },
        });

        if (user) {
          const valid = await verifyPassword(password, user.passwordHash);
          if (valid) {
            authenticatedUser = {
              email: user.email,
              name: user.name,
              role: user.role as "ADMIN" | "EDITOR" | "VIEWER",
            };
            // Update last login
            await prisma.adminUser.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });
          }
        }
      } catch (e) {
        console.warn("Prisma user auth query skipped:", e);
      }
    }

    // 2. If not matched in DB, check configured environment variables
    if (!authenticatedUser) {
      const configuredEmail = process.env.ADMIN_EMAIL || "admin@vantagewealth.in";
      const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const configuredPassword = process.env.ADMIN_PASSWORD;

      if (cleanEmail === configuredEmail.toLowerCase()) {
        if (configuredPasswordHash) {
          const valid = await verifyPassword(password, configuredPasswordHash);
          if (valid) {
            authenticatedUser = {
              email: configuredEmail,
              name: "Administrator",
              role: "ADMIN",
            };
          }
        } else if (configuredPassword) {
          // Plaintext env variable match (warn in prod)
          if (password === configuredPassword) {
            authenticatedUser = {
              email: configuredEmail,
              name: "Administrator",
              role: "ADMIN",
            };
          }
        } else if (process.env.NODE_ENV !== "production") {
          // Development fallback default credential
          if (password === "VantageAdmin2026!") {
            authenticatedUser = {
              email: configuredEmail,
              name: "Development Administrator",
              role: "ADMIN",
            };
          }
        }
      }
    }

    if (authenticatedUser) {
      // Clear rate limit counter on success
      loginAttempts.delete(ip);

      await setAdminSession(authenticatedUser.email, authenticatedUser.name, authenticatedUser.role);

      await logAuditEvent({
        action: "LOGIN_SUCCESS",
        entityType: "AUTH",
        userEmail: authenticatedUser.email,
        ipAddress: ip,
        details: { role: authenticatedUser.role },
      });

      return NextResponse.json({
        success: true,
        redirect: "/admin/dashboard",
      });
    }

    // Failed authentication
    await logAuditEvent({
      action: "LOGIN_FAILURE",
      entityType: "AUTH",
      userEmail: cleanEmail,
      ipAddress: ip,
      details: { attemptEmail: cleanEmail },
    });

    return NextResponse.json(
      { error: "Invalid credentials. Please verify your email and password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal authentication service error." },
      { status: 500 }
    );
  }
}
