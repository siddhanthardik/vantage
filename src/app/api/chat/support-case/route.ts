import { NextRequest, NextResponse } from "next/server";
import { verifyAnonymousSessionToken } from "@/lib/security/chatSecurity";
import { supportCaseRepository } from "@/server/repositories/supportCaseRepository";
import { chatConversationRepository } from "@/server/repositories/chatConversationRepository";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { SupportCaseCategory, SupportCasePriority } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/chat/support-case
 * Creates a support case from the chatbot conversation (with anti-duplicate protection)
 */
export async function POST(request: NextRequest) {
  try {
    const rawCookie = request.cookies.get("vw_chat_token")?.value;
    const sessionAuth = verifyAnonymousSessionToken(rawCookie);
    const body = await request.json();

    const {
      conversationId,
      customerName,
      contactPhone,
      contactEmail,
      category,
      subcategory,
      subject,
      description,
      priority,
      isUrgent,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: "Customer name is required to open a support case." },
        { status: 400 }
      );
    }

    if ((!contactPhone || !contactPhone.trim()) && (!contactEmail || !contactEmail.trim())) {
      return NextResponse.json(
        { error: "A contact phone number or email address is required to register a case." },
        { status: 400 }
      );
    }

    // Verify conversation ownership (Anti-IDOR)
    if (conversationId) {
      const conv = await chatConversationRepository.getConversationById(conversationId);
      if (!conv || (sessionAuth.sessionId && conv.anonymousSessionId !== sessionAuth.sessionId)) {
        return NextResponse.json(
          { error: "Unauthorized session access to conversation." },
          { status: 403 }
        );
      }
    }

    // Check for duplicate open case
    const existingOpenCase = await supportCaseRepository.findOpenCaseByContactOrConversation({
      conversationId,
      contactPhone: contactPhone?.trim(),
      contactEmail: contactEmail?.trim(),
    });

    if (existingOpenCase) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        data: {
          caseNumber: existingOpenCase.caseNumber,
          category: existingOpenCase.category,
          status: existingOpenCase.status,
          priority: existingOpenCase.priority,
          customerName: existingOpenCase.customerName,
          createdAt: existingOpenCase.createdAt,
          message: `An active support case (${existingOpenCase.caseNumber}) is already registered for this request.`,
        },
      });
    }

    // Correlate with ChatLead if one exists for this conversation
    let linkedLeadId: string | undefined = undefined;
    if (conversationId) {
      const lead = await chatLeadRepository.getLeadByConversationId(conversationId);
      if (lead) {
        linkedLeadId = lead.id;
      }
    }

    const calculatedPriority: SupportCasePriority =
      isUrgent || priority === "URGENT"
        ? "URGENT"
        : priority === "HIGH"
        ? "HIGH"
        : "MEDIUM";

    const created = await supportCaseRepository.createCase({
      conversationId,
      leadId: linkedLeadId,
      customerName: customerName.trim(),
      contactPhone: contactPhone?.trim() || undefined,
      contactEmail: contactEmail?.trim() || undefined,
      category: (category as SupportCaseCategory) || "GENERAL_ENQUIRY",
      subcategory: subcategory?.trim(),
      subject: (subject || "Client Support Request").trim(),
      description: (description || "Customer requested assistance via digital assistant.").trim(),
      priority: calculatedPriority,
      status: calculatedPriority === "URGENT" ? "ESCALATED" : "OPEN",
      advisorSummary: `Customer: ${customerName.trim()} | Contact: ${contactPhone || contactEmail} | Concern: ${subject || description}`,
    });

    return NextResponse.json(
      {
        success: true,
        isExisting: false,
        data: {
          caseNumber: created.caseNumber,
          category: created.category,
          status: created.status,
          priority: created.priority,
          customerName: created.customerName,
          createdAt: created.createdAt,
          message: `Your request has been registered under case reference ${created.caseNumber}.`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Support case creation error:", error);
    return NextResponse.json(
      { error: "Failed to open support case", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/support-case?caseNumber=...&contact=...
 * Look up case status with secure contact verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseNumber = searchParams.get("caseNumber");
    const contact = searchParams.get("contact");

    if (!caseNumber || !caseNumber.trim()) {
      return NextResponse.json(
        { error: "Case reference number is required." },
        { status: 400 }
      );
    }

    const found = await supportCaseRepository.findCaseByNumber(caseNumber.trim());
    if (!found) {
      return NextResponse.json(
        { error: "No support case found matching this reference number." },
        { status: 404 }
      );
    }

    // Security check: Must supply matching contact (phone or email)
    if (!contact || !contact.trim()) {
      return NextResponse.json({
        verified: false,
        message:
          "For privacy and account security, viewing case status requires your registered contact number or email.",
      });
    }

    const cleanInputContact = contact.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanCasePhone = (found.contactPhone || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanCaseEmail = (found.contactEmail || "").toLowerCase().trim();

    const isPhoneMatch =
      cleanCasePhone.length >= 8 && cleanInputContact.includes(cleanCasePhone.slice(-8));
    const isEmailMatch =
      cleanCaseEmail.length > 3 && cleanInputContact.includes(cleanCaseEmail.toLowerCase());

    if (!isPhoneMatch && !isEmailMatch) {
      return NextResponse.json({
        verified: false,
        message:
          "The contact details provided do not match the records for this case. For security, please connect directly with our advisory desk.",
      });
    }

    // Return only safe public status fields (internal notes strictly omitted)
    return NextResponse.json({
      verified: true,
      data: {
        caseNumber: found.caseNumber,
        category: found.category,
        status: found.status,
        priority: found.priority,
        subject: found.subject,
        createdAt: found.createdAt,
        lastActivityAt: found.lastActivityAt,
        resolvedAt: found.resolvedAt,
      },
    });
  } catch (error: any) {
    console.error("Support case lookup error:", error);
    return NextResponse.json(
      { error: "Failed to query case status", details: error.message },
      { status: 500 }
    );
  }
}
