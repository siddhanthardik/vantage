import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/guard";
import { chatLeadRepository } from "@/server/repositories/chatLeadRepository";
import { LeadQualificationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as LeadQualificationStatus | null;
    const salesStage = searchParams.get("salesStage") || undefined;
    const serviceInterest = searchParams.get("serviceInterest") || undefined;
    const assignedAdvisor = searchParams.get("assignedAdvisor") || undefined;
    const hasPendingFollowUp = searchParams.get("hasPendingFollowUp") === "true";
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (status && Object.values(LeadQualificationStatus).includes(status)) {
      where.status = status;
    }
    if (salesStage) {
      where.salesStage = salesStage;
    }
    if (serviceInterest) {
      where.serviceInterest = { contains: serviceInterest, mode: "insensitive" };
    }
    if (assignedAdvisor) {
      where.assignedAdvisor = { contains: assignedAdvisor, mode: "insensitive" };
    }
    if (hasPendingFollowUp) {
      where.nextFollowUpAt = { not: null };
    }

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { financialObjective: { contains: query, mode: "insensitive" } },
        { serviceInterest: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, leads, pipelineMetrics] = await Promise.all([
      prisma.chatLead.count({ where }),
      prisma.chatLead.findMany({
        where,
        take: limit,
        skip,
        orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
        include: {
          conversation: {
            select: {
              id: true,
              messageCount: true,
              language: true,
              status: true,
              primaryIntent: true,
              secondaryIntent: true,
              visitorClass: true,
              matchedServiceSlug: true,
              nextAction: true,
              contextMemory: true,
              createdAt: true,
            },
          },
          enquiry: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
          events: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              adminUser: { select: { name: true } },
            },
          },
        },
      }),
      chatLeadRepository.getSalesPipelineMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      leads,
      pipelineMetrics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Admin list leads error:", err);
    return NextResponse.json({ success: false, error: "Failed to list leads." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await request.json();
    const { action, leadId, salesStage, advisorName, followUpDate, note, reason } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });
    const adminUserId = adminUser?.id;

    let updatedLead: any = null;

    switch (action) {
      case "UPDATE_STAGE": {
        if (!salesStage) {
          return NextResponse.json({ error: "salesStage is required" }, { status: 400 });
        }
        updatedLead = await chatLeadRepository.updateSalesStage(
          leadId,
          salesStage,
          adminUserId,
          note
        );
        break;
      }

      case "ASSIGN_ADVISOR": {
        if (!advisorName) {
          return NextResponse.json({ error: "advisorName is required" }, { status: 400 });
        }
        updatedLead = await chatLeadRepository.assignAdvisor(
          leadId,
          advisorName,
          adminUserId,
          note
        );
        break;
      }

      case "SET_FOLLOW_UP": {
        if (!followUpDate) {
          return NextResponse.json({ error: "followUpDate is required" }, { status: 400 });
        }
        updatedLead = await chatLeadRepository.setFollowUp(
          leadId,
          new Date(followUpDate),
          adminUserId,
          note
        );
        break;
      }

      case "COMPLETE_FOLLOW_UP": {
        updatedLead = await chatLeadRepository.completeFollowUp(leadId, adminUserId, note);
        break;
      }

      case "ADD_NOTE": {
        if (!note || !note.trim()) {
          return NextResponse.json({ error: "Note text cannot be empty" }, { status: 400 });
        }
        updatedLead = await chatLeadRepository.addAdvisorNote(leadId, note, adminUserId);
        break;
      }

      case "CLOSE_LEAD": {
        if (!reason || !reason.trim()) {
          return NextResponse.json({ error: "Closure reason is required" }, { status: 400 });
        }
        updatedLead = await chatLeadRepository.closeLead(leadId, reason, adminUserId);
        break;
      }

      default: {
        return NextResponse.json({ error: `Unrecognized action: ${action}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (err: any) {
    console.error("Admin update lead error:", err);
    return NextResponse.json(
      { error: "Failed to update lead", details: err.message },
      { status: 500 }
    );
  }
}
