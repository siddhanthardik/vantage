import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { updateEnquiryStatus, deleteEnquiry } from "@/server/repositories/enquiryRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const { status } = await req.json();
    if (!status || !["NEW", "CONTACTED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await updateEnquiryStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "ENQUIRY_STATUS_UPDATED",
      entityType: "ENQUIRY",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { newStatus: status },
    });

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update enquiry" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const success = await deleteEnquiry(id);
    if (!success) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "ENQUIRY_DELETED",
      entityType: "ENQUIRY",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete enquiry" },
      { status: 500 }
    );
  }
}
