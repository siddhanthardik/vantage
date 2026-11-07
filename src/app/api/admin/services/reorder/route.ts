import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { reorderServices } from "@/server/repositories/serviceRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const { orderedIds } = await req.json();
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds must be an array of service IDs" }, { status: 400 });
    }

    await reorderServices(orderedIds);

    await logAuditEvent({
      action: "SERVICES_REORDERED",
      entityType: "SERVICE",
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { count: orderedIds.length },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reorder services" }, { status: 500 });
  }
}
