import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import {
  getServiceById,
  updateService,
  deleteService,
  revalidateServiceCache,
} from "@/server/repositories/serviceRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ service });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();
    const updated = await updateService(id, body);
    await revalidateServiceCache(updated.slug);

    await logAuditEvent({
      action: "SERVICE_UPDATED",
      entityType: "SERVICE",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { title: updated.title, status: updated.status },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update service." },
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
    const deleted = await deleteService(id);
    if (!deleted) {
      return NextResponse.json({ error: "Service not found or already deleted" }, { status: 404 });
    }
    await revalidateServiceCache();

    await logAuditEvent({
      action: "SERVICE_DELETED",
      entityType: "SERVICE",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete service." },
      { status: 500 }
    );
  }
}
