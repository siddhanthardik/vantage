import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAllTeamMembers, createTeamMember, revalidateTeamCache } from "@/server/repositories/teamRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const members = await getAllTeamMembers();
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Member name is required." }, { status: 400 });
    }
    if (!body.designation || !body.designation.trim()) {
      return NextResponse.json({ error: "Professional designation is required." }, { status: 400 });
    }

    const created = await createTeamMember(body);
    await revalidateTeamCache();

    await logAuditEvent({
      action: "TEAM_MEMBER_CREATED",
      entityType: "TEAM",
      entityId: created.id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { name: created.name, roleType: created.roleType, designation: created.designation },
    });

    return NextResponse.json({ success: true, member: created }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create team member." },
      { status: 400 }
    );
  }
}
