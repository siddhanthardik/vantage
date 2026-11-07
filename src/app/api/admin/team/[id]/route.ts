import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import {
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
} from "@/server/repositories/teamRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const member = await getTeamMemberById(id);

  if (!member) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  return NextResponse.json({ member });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();
    const updated = await updateTeamMember(id, body);

    await logAuditEvent({
      action: "TEAM_MEMBER_UPDATED",
      entityType: "TEAM",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { name: updated.name, roleType: updated.roleType, status: updated.status },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error("Failed to update team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update team member." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const member = await getTeamMemberById(id);
    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const deleted = await deleteTeamMember(id);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete team member." }, { status: 400 });
    }

    await logAuditEvent({
      action: "TEAM_MEMBER_DELETED",
      entityType: "TEAM",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { name: member.name, roleType: member.roleType },
    });

    return NextResponse.json({ success: true, message: "Team member deleted successfully." });
  } catch (error: any) {
    console.error("Failed to delete team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete team member." },
      { status: 400 }
    );
  }
}
