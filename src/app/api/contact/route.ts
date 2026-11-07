import { NextRequest, NextResponse } from "next/server";
import { createContactEnquiry } from "@/server/repositories/enquiryRepository";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  sendContactNotificationToAdmin,
  sendContactAcknowledgementToClient,
} from "@/lib/email/resend";
import { logAuditEvent } from "@/lib/security/audit";

// Rate limiting map: IP -> attempts
const submissionLimiter = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxSubmissions = 8;

  const current = submissionLimiter.get(ip);
  if (!current) {
    submissionLimiter.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (now - current.windowStart > windowMs) {
    submissionLimiter.set(ip, { count: 1, windowStart: now });
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
        { error: "Too many requests. Please wait a few minutes before submitting another inquiry." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 2. Anti-spam: Honeypot trap check
    if (body.hp_field) {
      await logAuditEvent({
        action: "SPAM_HONEYPOT_BLOCKED",
        entityType: "ENQUIRY",
        ipAddress: ip,
        details: { trap: "hp_field filled" },
      });
      // Deceptive success for bot
      return NextResponse.json({ success: true, message: "Inquiry received." });
    }

    // 3. Anti-spam: Cloudflare Turnstile Verification
    const turnstileToken = body.turnstileToken || body["cf-turnstile-response"];
    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || "Security verification failed. Please try again." },
        { status: 400 }
      );
    }

    const { fullName, email, phone, subject, message } = body;

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

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { error: "Please include a brief message or inquiry details (minimum 5 characters)." },
        { status: 400 }
      );
    }

    // 5. Persistent Storage in Database / Store
    const savedEnquiry = await createContactEnquiry(
      {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        subject: subject?.trim() || "General Wealth Advisory Inquiry",
        message: message.trim(),
      },
      ip
    );

    // 6. Security Audit Log
    await logAuditEvent({
      action: "ENQUIRY_CREATED",
      entityType: "ENQUIRY",
      entityId: savedEnquiry.id,
      userEmail: savedEnquiry.email,
      ipAddress: ip,
      details: { type: "CONTACT", subject: savedEnquiry.subject },
    });

    // 7. Email Notifications (Admin notification + Client acknowledgement)
    try {
      await Promise.allSettled([
        sendContactNotificationToAdmin(savedEnquiry),
        sendContactAcknowledgementToClient(savedEnquiry),
      ]);
    } catch (mailErr) {
      console.warn("Email dispatch error during contact submission:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you for contacting Vantage Wealth. An advisory partner will review your inquiry and connect with you within one business day.",
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Failed to process your message. Please try again or reach our desk directly." },
      { status: 500 }
    );
  }
}
