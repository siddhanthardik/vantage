import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getAllServices, createService, revalidateServiceCache } from "@/server/repositories/serviceRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const services = await getAllServices();
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Service title is required." }, { status: 400 });
    }
    if (!body.slug || !body.slug.trim()) {
      return NextResponse.json({ error: "URL slug is required." }, { status: 400 });
    }
    if (!body.shortDesc || !body.shortDesc.trim()) {
      return NextResponse.json({ error: "Short description is required." }, { status: 400 });
    }

    const created = await createService(body);
    await revalidateServiceCache(created.slug);

    await logAuditEvent({
      action: "SERVICE_CREATED",
      entityType: "SERVICE",
      entityId: created.id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { title: created.title, slug: created.slug },
    });

    return NextResponse.json({ success: true, service: created }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create service." },
      { status: 400 }
    );
  }
}
