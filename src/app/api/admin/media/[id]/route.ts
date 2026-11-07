import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { deleteMediaItem } from "@/server/repositories/mediaRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const success = await deleteMediaItem(id);
    if (!success) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "MEDIA_DELETED",
      entityType: "MEDIA",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: "Media deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete media asset" },
      { status: 500 }
    );
  }
}
