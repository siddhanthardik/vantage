import { NextRequest, NextResponse } from "next/server";
import { CallbackPreferredMethod, LeadQualificationStatus } from "@prisma/client";
import { chatConversationRepository } from "@/server/repositories/chatConversationRepository";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { chatLeadEventRepository } from "@/server/repositories/chatLeadEventRepository";
import { chatbotSettingsRepository } from "@/server/repositories/chatbotSettingsRepository";
import { verifyAnonymousSessionToken, hashClientIp } from "@/lib/security/chatSecurity";

export async function POST(request: NextRequest) {
  try {
    const rawCookie = request.cookies.get("vw_chat_token")?.value;
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipHash = hashClientIp(clientIp) || "anonymous";

    // 1. Session verification
    const sessionAuth = verifyAnonymousSessionToken(rawCookie);
    if (!sessionAuth.valid || !sessionAuth.sessionId) {
      return NextResponse.json({ success: false, error: "Invalid session. Please refresh." }, { status: 401 });
    }

    const body = await request.json();
    const {
      conversationId,
      fullName,
      email,
      phone,
      preferredMethod = "PHONE",
      preferredTimeWindow,
      financialObjective,
      notes,
      consentGiven,
    } = body;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required." }, { status: 400 });
    }

    // 2. Anti-IDOR check
    const conversation = await chatConversationRepository.getConversationById(conversationId, false);
    if (!conversation || conversation.anonymousSessionId !== sessionAuth.sessionId) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    // 3. Validation
    const cleanName = typeof fullName === "string" ? fullName.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ success: false, error: "Please provide your full name." }, { status: 400 });
    }

    if (preferredMethod === "PHONE" && !cleanPhone) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number for callback." },
        { status: 400 }
      );
    }

    if (preferredMethod === "EMAIL" && (!cleanEmail || !cleanEmail.includes("@"))) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address for callback." },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { success: false, error: "Please acknowledge the contact consent to request a callback." },
        { status: 400 }
      );
    }

    // 4. Duplicate callback submission check
    const existingLead = await chatLeadRepository.getLeadByConversationId(conversationId);
    if (existingLead && existingLead.status === LeadQualificationStatus.CALLBACK_REQUESTED) {
      const refId = `CB-${existingLead.id.slice(-6).toUpperCase()}`;
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        referenceId: refId,
        message: "Your callback request is already registered with our advisory team.",
      });
    }

    // 5. Upsert Lead in PostgreSQL with Phase 2 Qualification & Advisor Summary
    const methodEnum =
      preferredMethod === "EMAIL" ? CallbackPreferredMethod.EMAIL : CallbackPreferredMethod.PHONE;

    const memory = ((conversation as any).contextMemory as any) || {};
    const primaryIntent = (conversation as any).primaryIntent || "CALLBACK_REQUEST";

    const lead = await chatLeadRepository.upsertLead({
      conversationId,
      fullName: cleanName,
      phone: cleanPhone || undefined,
      email: cleanEmail || undefined,
      preferredMethod: methodEnum,
      preferredTimeWindow: preferredTimeWindow || "Standard Business Hours (9:30 AM - 6:30 PM IST)",
      financialObjective: financialObjective || memory.financialGoal || undefined,
      portfolioSize: memory.investmentAmount || undefined,
      notes: notes || undefined,
      qualificationScore: 85, // Direct callback with verified contact details
      urgency: "HIGH",
      advisorSummary: `### ADVISOR DISCOVERY BRIEFING (DIRECT CALLBACK REQUEST)
**Visitor Name:** ${cleanName}
**Contact Info:** ${cleanPhone ? `Phone: ${cleanPhone}` : ""} | ${cleanEmail ? `Email: ${cleanEmail}` : ""}
**Preferred Callback Time:** ${preferredTimeWindow || "Standard Business Hours"}
**Preferred Channel:** ${methodEnum}
**Primary Intent:** ${primaryIntent}
**Matched Service:** ${(conversation as any).matchedServiceSlug || "General Wealth Advisory"}
**Volunteered Amount:** ${memory.investmentAmount || "Not specified"}
**Target Horizon:** ${memory.timeHorizon || "Not specified"}
**Goal / Requirement:** ${financialObjective || memory.financialGoal || "General Advisory Discussion"}
**Handover Reason:** Visitor completed callback form with consent.
`,
      consentGiven: true,
      consentTimestamp: new Date(),
      consentIpHash: ipHash,
      status: LeadQualificationStatus.CALLBACK_REQUESTED,
    });

    // 6. Update status to CALLBACK_REQUESTED
    await chatLeadRepository.updateQualification(
      lead.id,
      LeadQualificationStatus.CALLBACK_REQUESTED,
      undefined,
      `Visitor requested ${methodEnum} callback for ${preferredTimeWindow || "earliest window"}`
    );

    // 7. Log lifecycle event
    await chatLeadEventRepository.recordEvent({
      leadId: lead.id,
      eventType: "CALLBACK_REQUESTED",
      metadata: {
        method: methodEnum,
        timeWindow: preferredTimeWindow,
        ipHash,
      },
    });

    const settings = await chatbotSettingsRepository.getSettings();
    const referenceId = `CB-${lead.id.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      referenceId,
      preferredMethod: methodEnum,
      confirmationMessage:
        settings.callbackWording ||
        "Our private wealth advisory team has received your request and will contact you during our standard business hours (Monday to Friday, 9:30 AM to 6:30 PM IST).",
      businessHours: `${settings.workingHoursStart} - ${settings.workingHoursEnd} ${settings.timezone}`,
    });
  } catch (err: any) {
    console.error("Callback submission error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to register callback request. Please try again." },
      { status: 500 }
    );
  }
}
