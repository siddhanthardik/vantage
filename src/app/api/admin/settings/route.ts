import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/auth/guard";
import { getBusinessSettings, updateBusinessSettings } from "@/server/repositories/serviceRepository";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET() {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const settings = await getBusinessSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings from PostgreSQL." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();
    const updated = await updateBusinessSettings(body);

    revalidateTag("business-settings", "max");
    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/consultation");

    await logAuditEvent({
      action: "SETTINGS_UPDATED",
      entityType: "SETTINGS",
      entityId: "default",
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { companyName: updated.companyName, phone: updated.phone },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("Failed to update business settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update business settings in PostgreSQL." },
      { status: 400 }
    );
  }
}
