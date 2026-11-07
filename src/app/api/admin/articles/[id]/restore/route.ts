import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { restoreArticleRevision } from "@/server/repositories/articleRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const { version } = await req.json();
    if (!version || typeof version !== "number") {
      return NextResponse.json({ error: "Valid revision version number is required." }, { status: 400 });
    }

    const restored = await restoreArticleRevision(id, version, auth.session.email);

    await logAuditEvent({
      action: "ARTICLE_REVISION_RESTORED",
      entityType: "ARTICLE",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: { restoredToVersion: version },
    });

    return NextResponse.json({ success: true, article: restored });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to restore revision" },
      { status: 400 }
    );
  }
}
