import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { supportCaseRepository } from "@/server/repositories/supportCaseRepository";
import { SupportCasePriority, SupportCaseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/support/[id]
 * Retrieves complete case details including internal events and notes
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;
    const supportCase = await supportCaseRepository.getCaseById(id);

    if (!supportCase) {
      return NextResponse.json({ error: "Support case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supportCase });
  } catch (error: any) {
    console.error("Failed to get support case details:", error);
    return NextResponse.json(
      { error: "Failed to get support case", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/support/[id]
 * Updates case status, assignment, internal notes, resolution notes, or priority
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status, assignedTo, assignedAdminId, note, resolutionNotes, priority } = body;

    const existing = await supportCaseRepository.getCaseById(id);
    if (!existing) {
      return NextResponse.json({ error: "Support case not found" }, { status: 404 });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: auth.session.email },
      select: { id: true },
    });
    const adminUserId = adminUser?.id;

    let result: any = existing;

    switch (action) {
      case "UPDATE_STATUS": {
        if (!status) {
          return NextResponse.json({ error: "New status is required" }, { status: 400 });
        }
        result = await supportCaseRepository.updateStatus(
          id,
          status as SupportCaseStatus,
          adminUserId,
          note
        );
        break;
      }

      case "ASSIGN": {
        result = await supportCaseRepository.assignCase(
          id,
          { assignedTo, assignedAdminId },
          adminUserId,
          note
        );
        break;
      }

      case "ADD_INTERNAL_NOTE": {
        if (!note || !note.trim()) {
          return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 });
        }
        result = await supportCaseRepository.addInternalNote(id, note, adminUserId);
        break;
      }

      case "RESOLVE": {
        if (!resolutionNotes || !resolutionNotes.trim()) {
          return NextResponse.json(
            { error: "Resolution notes are required when resolving a case" },
            { status: 400 }
          );
        }
        result = await supportCaseRepository.resolveCase(id, resolutionNotes, adminUserId);
        break;
      }

      case "REOPEN": {
        result = await supportCaseRepository.updateStatus(
          id,
          "OPEN",
          adminUserId,
          note || "Case reopened for further investigation."
        );
        break;
      }

      case "UPDATE_PRIORITY": {
        if (!priority) {
          return NextResponse.json({ error: "New priority is required" }, { status: 400 });
        }
        result = await supportCaseRepository.updatePriority(
          id,
          priority as SupportCasePriority,
          adminUserId,
          note
        );
        break;
      }

      default: {
        return NextResponse.json(
          { error: `Unrecognized action: ${action}` },
          { status: 400 }
        );
      }
    }

    const updatedFullCase = await supportCaseRepository.getCaseById(id);

    return NextResponse.json({ success: true, data: updatedFullCase });
  } catch (error: any) {
    console.error("Failed to update support case:", error);
    return NextResponse.json(
      { error: "Failed to update support case", details: error.message },
      { status: 500 }
    );
  }
}
