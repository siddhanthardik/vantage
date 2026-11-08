import { NextRequest, NextResponse } from "next/server";
import { createCallbackEnquiry, ALLOWED_AREAS_OF_INTEREST } from "@/server/repositories/enquiryRepository";

// Rate limiting: IP -> { count, windowStart }
const callbackRateLimiter = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 4;

  const entry = callbackRateLimiter.get(ip);
  if (!entry || now - entry.windowStart > windowMs) {
    callbackRateLimiter.set(ip, { count: 1, windowStart: now });
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
      { error: "Too many callback requests. Please wait a few minutes before submitting again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Spam honeypot trap
    if (body.hp_field) {
      return NextResponse.json({
        success: true,
        message: "Thank you. Your callback request has been received.",
      });
    }

    if (!body.fullName || typeof body.fullName !== "string" || body.fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (!body.phone || typeof body.phone !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid phone number." },
        { status: 400 }
      );
    }

    const phoneDigits = body.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (8 to 15 digits)." },
        { status: 400 }
      );
    }

    if (!body.areaOfInterest || !ALLOWED_AREAS_OF_INTEREST.includes(body.areaOfInterest)) {
      return NextResponse.json(
        { error: "Please choose a valid area of interest." },
        { status: 400 }
      );
    }

    if (!body.consent) {
      return NextResponse.json(
        { error: "Please confirm your consent to be contacted." },
        { status: 400 }
      );
    }

    const { isDuplicate } = await createCallbackEnquiry(
      {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        areaOfInterest: body.areaOfInterest,
        preferredTime: body.preferredTime,
        consent: Boolean(body.consent),
        articleSlug: body.articleSlug || "",
        articleTitle: body.articleTitle,
      },
      ip
    );

    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        message: "We have already received your callback request. Our senior advisory team will contact you shortly.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you. Your callback request has been received. Our senior advisory team will contact you shortly.",
    });
  } catch (error: any) {
    console.error("Callback lead submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit callback request. Please try again later." },
      { status: 500 }
    );
  }
}
