import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });

    const result = await chatLeadRepository.convertToEnquiry(id, adminUser?.id);

    // Record administrative security audit log
    await logAuditEvent({
      action: "CHATBOT_LEAD_CONVERTED_TO_ENQUIRY",
      entityType: "ENQUIRY",
      entityId: result.enquiry.id,
      userEmail: auth.session.email,
      details: {
        leadId: id,
        enquiryId: result.enquiry.id,
        enquiryType: result.enquiry.type,
      },
    });

    return NextResponse.json({
      success: true,
      lead: result.lead,
      enquiry: result.enquiry,
      message: `Lead successfully converted to operational Enquiry (${result.enquiry.id}).`,
    });
  } catch (err: any) {
    console.error("Admin convert lead error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to convert lead to operational enquiry.",
      },
      { status: 400 }
    );
  }
}
