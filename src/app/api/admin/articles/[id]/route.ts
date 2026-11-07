import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  getArticleRevisions,
} from "@/server/repositories/articleRepository";
import { logAuditEvent } from "@/lib/security/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const revisions = await getArticleRevisions(id);

  return NextResponse.json({
    success: true,
    article: {
      ...article,
      revisions,
    },
  });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  try {
    const body = await req.json();
    const updated = await updateArticle(id, body, auth.session.email);

    await logAuditEvent({
      action: "ARTICLE_UPDATED",
      entityType: "ARTICLE",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
      details: {
        title: updated.title,
        status: updated.status,
      },
    });

    return NextResponse.json({ success: true, article: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update article" },
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
    const deleted = await deleteArticle(id);
    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "ARTICLE_DELETED",
      entityType: "ARTICLE",
      entityId: id,
      userEmail: auth.session.email,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
