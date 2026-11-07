import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { reorderTeamMembers } from "@/server/repositories/teamRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function PUT(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "Invalid array of team member IDs." }, { status: 400 });
    }

    await reorderTeamMembers(orderedIds);

    await logAuditEvent({
      action: "TEAM_MEMBERS_REORDERED",
      entityType: "TEAM",
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { count: orderedIds.length },
    });

    return NextResponse.json({ success: true, message: "Order updated successfully." });
  } catch (error: any) {
    console.error("Failed to reorder team members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder team members." },
      { status: 400 }
    );
  }
}
