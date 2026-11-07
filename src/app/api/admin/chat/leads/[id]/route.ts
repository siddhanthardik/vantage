import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { chatLeadEventRepository } from "@/server/repositories/chatLeadEventRepository";
import { LeadQualificationStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const lead = await chatLeadRepository.getLeadById(id);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
        }
      );
    }

    return NextResponse.json(
      { success: true, lead },
      {
        headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
      }
    );
  } catch (err: any) {
    console.error("Admin lead detail error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lead." },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate" },
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { status, note } = body;

    const lead = await prisma.chatLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });

    if (status && Object.values(LeadQualificationStatus).includes(status)) {
      await chatLeadRepository.updateQualification(
        id,
        status,
        adminUser?.id,
        note || `Admin status change to ${status}`
      );
    } else if (note) {
      await chatLeadEventRepository.recordEvent({
        leadId: id,
        adminUserId: adminUser?.id,
        eventType: "ADMIN_NOTE_ADDED",
        metadata: { note },
      });
    }

    const updatedLead = await chatLeadRepository.getLeadById(id);
    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    console.error("Admin update lead error:", err);
    return NextResponse.json({ success: false, error: "Failed to update lead." }, { status: 500 });
  }
}
