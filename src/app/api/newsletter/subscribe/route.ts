import { NextRequest, NextResponse } from "next/server";
import { subscribeNewsletter, isValidEmail } from "@/server/repositories/newsletterRepository";

// Rate limiter: IP -> { count, windowStart }
const rateLimiter = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 5;

  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= maxAttempts) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
             req.headers.get("x-real-ip") ||
             "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many subscription requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Spam honeypot trap
    if (body.hp_field) {
      // Silently discard bot submission
      return NextResponse.json({
        success: true,
        message: "Thank you for subscribing to The Vantage Wealth Newsletter.",
      });
    }

    if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const result = await subscribeNewsletter({
      name: typeof body.name === "string" ? body.name : undefined,
      email: body.email,
      source: "INSIGHTS_ARTICLE",
      sourceSlug: typeof body.sourceSlug === "string" ? body.sourceSlug : undefined,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
