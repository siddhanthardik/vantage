import { NextRequest, NextResponse } from "next/server";
import { createConsultationEnquiry } from "@/server/repositories/enquiryRepository";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  sendConsultationNotificationToAdmin,
  sendConsultationAcknowledgementToClient,
} from "@/lib/email/resend";
import { logAuditEvent } from "@/lib/security/audit";

// Rate limiting map: IP -> attempts
const consultationLimiter = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxSubmissions = 6;

  const current = consultationLimiter.get(ip);
  if (!current) {
    consultationLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (now - current.windowStart > windowMs) {
    consultationLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (current.count >= maxSubmissions) {
    return true;
  }

  current.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    // 1. Rate Limiting Check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many consultation requests from your IP. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-spam: Honeypot check
    if (body.hp_field) {
      await logAuditEvent({
        action: "SPAM_HONEYPOT_BLOCKED",
        entityType: "CONSULTATION",
        ipAddress: ip,
        details: { trap: "hp_field filled" },
      });
      return NextResponse.json({
        success: true,
        message: "Consultation request received.",
      });
    }

    // 3. Anti-spam: Turnstile verification
    const turnstileToken = body.turnstileToken || body["cf-turnstile-response"];
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || "Security verification failed. Please try again." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      serviceSlug,
      preferredMode,
      preferredDate,
      preferredTime,
      message,
    } = body;

    // 4. Server-Side Validation
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json(
        { error: "Please provide a valid contact phone number." },
        { status: 400 }
      );
    }

    if (!preferredDate) {
      return NextResponse.json(
        { error: "Please specify your preferred consultation date." },
        { status: 400 }
      );
    }

    // 5. Persistent Storage in Database / Store
    const savedConsultation = await createConsultationEnquiry(
      {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        serviceSlug: serviceSlug || "investment-advisory",
        preferredMode: preferredMode === "IN_PERSON" ? "IN_PERSON" : "ONLINE",
        preferredDate: preferredDate.trim(),
        preferredTime: preferredTime?.trim() || "Morning (10:00 AM - 1:00 PM)",
        message: message?.trim(),
      },
      ip
    );

    // 6. Security Audit Log
    await logAuditEvent({
      action: "CONSULTATION_REQUESTED",
      entityType: "CONSULTATION",
      entityId: savedConsultation.id,
      userEmail: savedConsultation.email,
      ipAddress: ip,
      details: {
        serviceSlug: savedConsultation.serviceSlug,
        preferredMode: savedConsultation.preferredMode,
        preferredDate: savedConsultation.preferredDate,
      },
    });

    // 7. Email Notifications (Admin notification + Client acknowledgement)
    try {
      await Promise.allSettled([
        sendConsultationNotificationToAdmin(savedConsultation),
        sendConsultationAcknowledgementToClient(savedConsultation),
      ]);
    } catch (mailErr) {
      console.warn("Email dispatch error during consultation submission:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "Your consultation request has been received by Vantage Wealth. A senior advisor will review your requested time and contact you promptly to finalize your discovery session.",
    });
  } catch (error: any) {
    console.error("Consultation API error:", error);
    return NextResponse.json(
      { error: "Failed to submit consultation request. Please try again or call our advisory desk." },
      { status: 500 }
    );
  }
}
